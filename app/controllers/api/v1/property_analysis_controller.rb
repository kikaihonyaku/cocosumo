class Api::V1::PropertyAnalysisController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login

  # GET /api/v1/property_analysis
  # 全物件データを返す（GISフィルタは適用しない - ピン表示用）
  def show
    buildings = current_tenant.buildings.kept.includes(:building_photos, rooms: { room_facilities: :facility })

    # ベース検索条件のみ適用（GISは含まない）
    buildings = apply_base_filters(buildings)

    # 全部屋データを取得（フィルタはフロントエンドで行う）
    all_rooms = buildings.flat_map(&:rooms)

    # レスポンス用に物件データを整形（全部屋を含める）
    properties_json = buildings.map do |building|
      building_data = building.as_json(methods: [:room_cnt, :free_cnt, :latitude, :longitude, :exterior_photo_count, :thumbnail_url])
      building_data['rooms'] = building.rooms.map do |room|
        room_data = room.as_json(only: [:id, :rent, :area, :room_type, :status, :floor, :room_number])
        room_data['facility_codes'] = room.room_facilities.map { |rf| rf.facility.code }
        room_data
      end
      building_data
    end

    # 集計は参考情報として返す（フロントエンドでも計算するが、初期表示用）
    aggregations = calculate_aggregations(all_rooms, buildings)

    render json: {
      properties: properties_json,
      aggregations: aggregations,
      total_buildings: buildings.count,
      total_rooms: all_rooms.count
    }
  end

  # POST /api/v1/property_analysis/geo_filter
  # GISフィルタを適用し、該当する物件IDのみを返す（軽量API）
  def geo_filter
    buildings = current_tenant.buildings.kept

    # ベース検索条件を適用
    buildings = apply_base_filters(buildings)

    # GISフィルタを適用
    buildings = apply_geo_filters(buildings)

    # 該当物件のIDのみを返す
    render json: {
      building_ids: buildings.pluck(:id)
    }
  end

  private

  # ベース検索条件を適用（GISは含まない）
  def apply_base_filters(buildings)
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

    # 店舗フィルタ
    if params[:store_id].present?
      buildings = buildings.where(store_id: params[:store_id])
    end

    # 空室ありフィルタ
    if params[:has_vacancy] == 'true'
      buildings = buildings.where('buildings.id IN (SELECT building_id FROM rooms WHERE status = ? GROUP BY building_id)', 'vacant')
    elsif params[:has_vacancy] == 'false'
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
      # boolean または string 'true' のどちらでも対応
      external_import_bool = external_import == true || external_import == 'true'
      own_registration_bool = own_registration == true || own_registration == 'true'

      if external_import_bool && !own_registration_bool
        buildings = buildings.where.not(suumo_imported_at: nil)
      elsif !external_import_bool && own_registration_bool
        buildings = buildings.where(suumo_imported_at: nil)
      elsif !external_import_bool && !own_registration_bool
        buildings = buildings.none
      end
    end

    # 設備フィルタ（指定された全ての設備を持つ部屋がある建物のみ）
    if params[:facilities].present?
      facility_codes = Array(params[:facilities])
      if facility_codes.any?
        buildings = buildings.where(
          'buildings.id IN (
            SELECT r.building_id
            FROM rooms r
            INNER JOIN room_facilities rf ON rf.room_id = r.id
            INNER JOIN facilities f ON f.id = rf.facility_id
            WHERE f.code IN (?)
            GROUP BY r.building_id
            HAVING COUNT(DISTINCT f.code) >= ?
          )',
          facility_codes,
          facility_codes.length
        )
      end
    end

    buildings
  end

  # GISフィルタを適用
  def apply_geo_filters(buildings)
    Rails.logger.info "[apply_geo_filters] params[:lat]=#{params[:lat].inspect}, params[:lng]=#{params[:lng].inspect}, params[:radius]=#{params[:radius].inspect}"
    Rails.logger.info "[apply_geo_filters] params[:polygon] present?=#{params[:polygon].present?}, length=#{params[:polygon]&.length}"

    # 半径検索 (lat, lng, radius in meters)
    if params[:lat].present? && params[:lng].present? && params[:radius].present?
      Rails.logger.info "[apply_geo_filters] Applying radius filter"
      buildings = buildings.within_radius(
        params[:lat].to_f,
        params[:lng].to_f,
        params[:radius].to_i
      )
    end

    # ポリゴン検索 (polygon: WKT形式)
    if params[:polygon].present?
      Rails.logger.info "[apply_geo_filters] Applying polygon filter: #{params[:polygon][0..100]}..."
      buildings = buildings.within_polygon(params[:polygon])
    else
      Rails.logger.info "[apply_geo_filters] No polygon filter applied"
    end

    Rails.logger.info "[apply_geo_filters] Resulting query: #{buildings.to_sql[0..500]}"
    buildings
  end

  def calculate_aggregations(rooms, all_buildings)
    total = rooms.count

    by_rent = [
      { range: "0-50000", label: "〜5万円", count: rooms.count { |r| r.rent.to_f < 50000 } },
      { range: "50000-100000", label: "5〜10万円", count: rooms.count { |r| r.rent.to_f >= 50000 && r.rent.to_f < 100000 } },
      { range: "100000-150000", label: "10〜15万円", count: rooms.count { |r| r.rent.to_f >= 100000 && r.rent.to_f < 150000 } },
      { range: "150000-200000", label: "15〜20万円", count: rooms.count { |r| r.rent.to_f >= 150000 && r.rent.to_f < 200000 } },
      { range: "200000+", label: "20万円〜", count: rooms.count { |r| r.rent.to_f >= 200000 } }
    ]

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

    by_area = [
      { range: "0-20", label: "〜20㎡", count: rooms.count { |r| r.area.to_f < 20 } },
      { range: "20-40", label: "20〜40㎡", count: rooms.count { |r| r.area.to_f >= 20 && r.area.to_f < 40 } },
      { range: "40-60", label: "40〜60㎡", count: rooms.count { |r| r.area.to_f >= 40 && r.area.to_f < 60 } },
      { range: "60-80", label: "60〜80㎡", count: rooms.count { |r| r.area.to_f >= 60 && r.area.to_f < 80 } },
      { range: "80+", label: "80㎡〜", count: rooms.count { |r| r.area.to_f >= 80 } }
    ]

    current_year = Date.today.year
    by_building_age = [
      { range: "0-5", label: "築5年以内", count: 0 },
      { range: "5-10", label: "築5〜10年", count: 0 },
      { range: "10-20", label: "築10〜20年", count: 0 },
      { range: "20-30", label: "築20〜30年", count: 0 },
      { range: "30+", label: "築30年以上", count: 0 }
    ]

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
