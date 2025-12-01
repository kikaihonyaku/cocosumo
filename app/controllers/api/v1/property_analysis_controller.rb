class Api::V1::PropertyAnalysisController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login

  # GET /api/v1/property_analysis
  def show
    # 物件とその部屋を取得
    buildings = current_tenant.buildings.kept.includes(:rooms)

    # === ベース検索条件（検索条件を設定で指定された条件） ===

    # 物件名フィルタ
    if params[:name].present?
      buildings = buildings.where('buildings.name ILIKE ?', "%#{params[:name]}%")
    end

    # 住所フィルタ
    if params[:address].present?
      buildings = buildings.where('buildings.address ILIKE ?', "%#{params[:address]}%")
    end

    # 物件種別フィルタ
    if params[:building_type].present?
      buildings = buildings.where(building_type: params[:building_type])
    end

    # 空室ありフィルタ
    if params[:has_vacancy] == 'true'
      # 空室がある物件のみ（free_cnt > 0）
      buildings = buildings.where('buildings.id IN (SELECT building_id FROM rooms WHERE status = ? GROUP BY building_id)', 'vacant')
    elsif params[:has_vacancy] == 'false'
      # 満室の物件のみ（free_cnt = 0）
      buildings = buildings.where('buildings.id NOT IN (SELECT building_id FROM rooms WHERE status = ?)', 'vacant')
    end

    # 戸数フィルタ
    if params[:min_rooms].present?
      min_rooms = params[:min_rooms].to_i
      buildings = buildings.where('buildings.id IN (SELECT building_id FROM rooms GROUP BY building_id HAVING COUNT(*) >= ?)', min_rooms)
    end
    if params[:max_rooms].present?
      max_rooms = params[:max_rooms].to_i
      buildings = buildings.where('buildings.id IN (SELECT building_id FROM rooms GROUP BY building_id HAVING COUNT(*) <= ?)', max_rooms)
    end

    # 登録元フィルタ
    external_import = params[:external_import]
    own_registration = params[:own_registration]

    if external_import.present? || own_registration.present?
      external_import_bool = external_import == 'true'
      own_registration_bool = own_registration == 'true'

      if external_import_bool && !own_registration_bool
        # 外部取込みのみ
        buildings = buildings.where.not(suumo_imported_at: nil)
      elsif !external_import_bool && own_registration_bool
        # 自社登録のみ
        buildings = buildings.where(suumo_imported_at: nil)
      elsif !external_import_bool && !own_registration_bool
        # 両方チェックなしの場合は結果なし
        buildings = buildings.none
      end
      # 両方trueの場合はフィルタなし
    end

    # === GIS検索 ===

    # 半径検索 (lat, lng, radius in meters)
    if params[:lat].present? && params[:lng].present? && params[:radius].present?
      buildings = buildings.within_radius(
        params[:lat].to_f,
        params[:lng].to_f,
        params[:radius].to_i
      )
    end

    # ポリゴン検索 (polygon: WKT形式)
    if params[:polygon].present?
      buildings = buildings.within_polygon(params[:polygon])
    end

    # 部屋のフィルタリング
    all_rooms = buildings.flat_map(&:rooms)

    # 賃料フィルタ（30万円以上は上限なしとして扱う）
    rent_max_threshold = 300000
    if params[:rent_min].present?
      all_rooms = all_rooms.select { |r| r.rent.to_f >= params[:rent_min].to_f }
    end
    if params[:rent_max].present? && params[:rent_max].to_f < rent_max_threshold
      all_rooms = all_rooms.select { |r| r.rent.to_f <= params[:rent_max].to_f }
    end

    # 間取りフィルタ
    if params[:room_types].present?
      room_types = params[:room_types].split(',')
      all_rooms = all_rooms.select { |r| room_types.include?(r.room_type) }
    end

    # 面積フィルタ
    if params[:area_min].present?
      all_rooms = all_rooms.select { |r| r.area.to_f >= params[:area_min].to_f }
    end
    if params[:area_max].present?
      all_rooms = all_rooms.select { |r| r.area.to_f <= params[:area_max].to_f }
    end

    # 築年数フィルタ（物件の築年数でフィルタ、40年以上は上限なしとして扱う）
    age_max_threshold = 40
    if params[:age_min].present? || (params[:age_max].present? && params[:age_max].to_i < age_max_threshold)
      current_year = Date.today.year
      age_min = params[:age_min].to_i
      age_max = (params[:age_max].present? && params[:age_max].to_i < age_max_threshold) ? params[:age_max].to_i : 999

      all_rooms = all_rooms.select do |room|
        building = room.building
        if building.built_date.present?
          age = current_year - building.built_date.year
          age >= age_min && age <= age_max
        else
          true # 築年数不明の場合は含める
        end
      end
    end

    # フィルタ後の部屋が属する物件を特定
    filtered_building_ids = all_rooms.map(&:building_id).uniq
    filtered_buildings = buildings.select { |b| filtered_building_ids.include?(b.id) }

    # フィルタ後の部屋IDのセットを作成
    filtered_room_ids = all_rooms.map(&:id).to_set

    # 集計を計算
    aggregations = calculate_aggregations(all_rooms, buildings)

    # レスポンス用に物件データを整形（フィルタ後の部屋のみ含める）
    properties_json = filtered_buildings.map do |building|
      # フィルタ後の部屋のみを取得
      filtered_rooms_for_building = building.rooms.select { |r| filtered_room_ids.include?(r.id) }

      building_data = building.as_json(methods: [:room_cnt, :free_cnt, :latitude, :longitude])
      # room_cntとfree_cntをフィルタ後の値に上書き
      building_data['room_cnt'] = filtered_rooms_for_building.count
      building_data['free_cnt'] = filtered_rooms_for_building.count { |r| r.status == 'vacant' }
      building_data['rooms'] = filtered_rooms_for_building.map do |room|
        room.as_json(only: [:id, :rent, :area, :room_type, :status, :floor, :room_number])
      end
      building_data
    end

    render json: {
      properties: properties_json,
      aggregations: aggregations
    }
  end

  private

  def calculate_aggregations(rooms, all_buildings)
    # 全体の部屋数
    total = rooms.count

    # 賃料帯別集計
    by_rent = [
      { range: "0-50000", label: "〜5万円", count: rooms.count { |r| r.rent.to_f < 50000 } },
      { range: "50000-100000", label: "5〜10万円", count: rooms.count { |r| r.rent.to_f >= 50000 && r.rent.to_f < 100000 } },
      { range: "100000-150000", label: "10〜15万円", count: rooms.count { |r| r.rent.to_f >= 100000 && r.rent.to_f < 150000 } },
      { range: "150000-200000", label: "15〜20万円", count: rooms.count { |r| r.rent.to_f >= 150000 && r.rent.to_f < 200000 } },
      { range: "200000+", label: "20万円〜", count: rooms.count { |r| r.rent.to_f >= 200000 } }
    ]

    # 間取り別集計
    by_room_type = {}
    room_type_labels = {
      'studio' => 'ワンルーム',
      '1K' => '1K',
      '1DK' => '1DK',
      '1LDK' => '1LDK',
      '2K' => '2K',
      '2DK' => '2DK',
      '2LDK' => '2LDK',
      '3K' => '3K',
      '3DK' => '3DK',
      '3LDK' => '3LDK',
      'other' => 'その他'
    }
    room_type_labels.each do |key, _label|
      by_room_type[key] = rooms.count { |r| r.room_type == key }
    end

    # 面積帯別集計
    by_area = [
      { range: "0-20", label: "〜20㎡", count: rooms.count { |r| r.area.to_f < 20 } },
      { range: "20-40", label: "20〜40㎡", count: rooms.count { |r| r.area.to_f >= 20 && r.area.to_f < 40 } },
      { range: "40-60", label: "40〜60㎡", count: rooms.count { |r| r.area.to_f >= 40 && r.area.to_f < 60 } },
      { range: "60-80", label: "60〜80㎡", count: rooms.count { |r| r.area.to_f >= 60 && r.area.to_f < 80 } },
      { range: "80+", label: "80㎡〜", count: rooms.count { |r| r.area.to_f >= 80 } }
    ]

    # 築年数別集計
    current_year = Date.today.year
    by_building_age = [
      { range: "0-5", label: "築5年以内", count: 0 },
      { range: "5-10", label: "築5〜10年", count: 0 },
      { range: "10-20", label: "築10〜20年", count: 0 },
      { range: "20-30", label: "築20〜30年", count: 0 },
      { range: "30+", label: "築30年以上", count: 0 }
    ]

    # 物件ごとの築年数を計算して部屋数をカウント
    rooms.each do |room|
      building = room.building
      next unless building.built_date.present?

      age = current_year - building.built_date.year

      case age
      when 0..4
        by_building_age[0][:count] += 1
      when 5..9
        by_building_age[1][:count] += 1
      when 10..19
        by_building_age[2][:count] += 1
      when 20..29
        by_building_age[3][:count] += 1
      else
        by_building_age[4][:count] += 1
      end
    end

    {
      total: total,
      by_rent: by_rent,
      by_room_type: by_room_type,
      by_area: by_area,
      by_building_age: by_building_age
    }
  end

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end
end
