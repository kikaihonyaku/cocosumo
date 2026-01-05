class Api::V1::BuildingsController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :set_building, only: [:show, :update, :destroy, :grounding]

  # GET /api/v1/buildings
  def index
    @buildings = current_tenant.buildings.kept.includes(:rooms, :building_photos, :store)

    # 検索条件によるフィルタリング
    @buildings = @buildings.where("name LIKE ?", "%#{params[:name]}%") if params[:name].present?
    @buildings = @buildings.where("address LIKE ?", "%#{params[:address]}%") if params[:address].present?
    @buildings = @buildings.where(building_type: params[:building_type]) if params[:building_type].present?
    @buildings = @buildings.where("total_units >= ?", params[:min_rooms]) if params[:min_rooms].present?
    @buildings = @buildings.where("total_units <= ?", params[:max_rooms]) if params[:max_rooms].present?

    # 店舗フィルタ
    @buildings = @buildings.where(store_id: params[:store_id]) if params[:store_id].present?

    # === GIS検索 ===

    # 矩形範囲検索 (bounds: "sw_lat,sw_lng,ne_lat,ne_lng")
    if params[:bounds].present?
      bounds = params[:bounds].split(',').map(&:to_f)
      if bounds.length == 4
        sw_lat, sw_lng, ne_lat, ne_lng = bounds
        @buildings = @buildings.within_bounds(sw_lat, sw_lng, ne_lat, ne_lng)
      end
    end

    # 半径検索 (lat, lng, radius in meters)
    if params[:lat].present? && params[:lng].present? && params[:radius].present?
      @buildings = @buildings.within_radius(
        params[:lat].to_f,
        params[:lng].to_f,
        params[:radius].to_i
      )
    end

    # ポリゴン検索 (polygon: WKT形式 "POLYGON((lng1 lat1, lng2 lat2, ...))")
    if params[:polygon].present?
      @buildings = @buildings.within_polygon(params[:polygon])
    end

    # 空室有無のフィルタ
    if params[:has_vacancy].present?
      if params[:has_vacancy] == 'true'
        @buildings = @buildings.select { |b| b.rooms.where(status: :vacant).count > 0 }
      elsif params[:has_vacancy] == 'false'
        @buildings = @buildings.select { |b| b.rooms.where(status: :vacant).count == 0 }
      end
    end

    # 登録元フィルタ（外部取込み / 自社登録）
    if params[:external_import].present? || params[:own_registration].present?
      ext = ActiveModel::Type::Boolean.new.cast(params[:external_import])
      own = ActiveModel::Type::Boolean.new.cast(params[:own_registration])

      if ext && own
        # 両方true: フィルタなし（全件）
      elsif ext && !own
        # 外部取込みのみ
        @buildings = @buildings.where.not(suumo_imported_at: nil)
      elsif !ext && own
        # 自社登録のみ
        @buildings = @buildings.where(suumo_imported_at: nil)
      else
        # 両方false: 0件
        @buildings = @buildings.none
      end
    end

    # 距離順ソート
    if params[:sort_by_distance].present? && params[:lat].present? && params[:lng].present?
      @buildings = @buildings.order_by_distance(params[:lat].to_f, params[:lng].to_f)
    else
      @buildings = @buildings.order(created_at: :desc)
    end

    # 空室数・空室率・部屋情報・店舗情報を含めて返す
    render json: @buildings.as_json(
      methods: [:room_cnt, :free_cnt, :latitude, :longitude, :exterior_photo_count, :thumbnail_url],
      include: {
        rooms: {
          only: [:id, :rent, :area, :room_type, :status, :floor, :room_number]
        },
        store: {
          only: [:id, :name]
        }
      }
    )
  end

  # GET /api/v1/buildings/nearest
  # 最寄り物件検索
  def nearest
    lat = params[:lat].to_f
    lng = params[:lng].to_f
    limit = (params[:limit] || 5).to_i

    @buildings = current_tenant.buildings.kept
      .nearest(lat, lng, limit)
      .includes(:rooms)

    render json: @buildings.as_json(methods: [:room_cnt, :free_cnt, :latitude, :longitude])
  end

  # GET /api/v1/buildings/by_school_district
  # 学区内の物件を検索
  def by_school_district
    school_district = SchoolDistrict.find(params[:school_district_id])

    @buildings = current_tenant.buildings.kept
      .where("ST_Contains(?::geometry, location::geometry)", school_district.geom)
      .includes(:rooms)

    render json: @buildings.as_json(methods: [:room_cnt, :free_cnt, :latitude, :longitude])
  end

  # GET /api/v1/buildings/:id
  def show
    render json: @building.as_json(include: {
      rooms: {
        methods: [:status_label, :room_type_label]
      },
      owners: {}
    })
  end

  # POST /api/v1/buildings
  def create
    @building = current_tenant.buildings.build(building_params)

    if @building.save
      render json: @building, status: :created
    else
      render json: { errors: @building.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/buildings/:id
  def update
    if @building.update(building_params)
      render json: @building
    else
      render json: { errors: @building.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/buildings/:id (論理削除)
  def destroy
    if @building.discard
      render json: {
        success: true,
        message: '物件を削除しました',
        deleted_at: @building.discarded_at
      }
    else
      render json: {
        success: false,
        error: '削除に失敗しました'
      }, status: :unprocessable_entity
    end
  end

  # GET /api/v1/buildings/archived (削除済み物件一覧)
  def archived
    @buildings = current_tenant.buildings.discarded.includes(:rooms).order(discarded_at: :desc)
    render json: @buildings.as_json(methods: [:room_cnt, :free_cnt])
  end

  # POST /api/v1/buildings/:id/restore (物件の復元)
  def restore
    @building = current_tenant.buildings.discarded.find(params[:id])

    if @building.undiscard
      render json: {
        success: true,
        message: '物件を復元しました'
      }
    else
      render json: {
        success: false,
        error: '復元に失敗しました'
      }, status: :unprocessable_entity
    end
  end

  # POST /api/v1/buildings/:id/grounding
  # Grounding with Google Mapsを使用して周辺情報を取得
  def grounding
    unless params[:query].present?
      return render json: { error: 'クエリが必要です' }, status: :bad_request
    end

    begin
      # 緯度・経度を取得（パラメータまたは建物データから）
      latitude = params[:latitude].presence || @building.latitude
      longitude = params[:longitude].presence || @building.longitude

      unless latitude && longitude
        return render json: { error: '位置情報が設定されていません' }, status: :bad_request
      end

      # 会話履歴を取得
      conversation_history = params[:conversation_history] || []

      # Vertex AI Grounding APIを呼び出し
      response = call_vertex_ai_grounding(params[:query], latitude, longitude, conversation_history, @building.address)

      render json: {
        success: true,
        answer: response[:answer],
        sources: response[:sources],
        widget_context_token: response[:widget_context_token],
        place_ids: response[:place_ids],
        query: params[:query],
        location: {
          latitude: latitude,
          longitude: longitude
        },
        is_mock: response[:is_mock] || false
      }

    rescue StandardError => e
      Rails.logger.error("Grounding API error: #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))
      render json: {
        error: 'AI応答の取得に失敗しました。しばらく時間をおいて再度お試しください。',
        details: e.message
      }, status: :internal_server_error
    end
  end

  # Vertex AI Grounding APIを呼び出し
  def call_vertex_ai_grounding(query, latitude, longitude, conversation_history = [], address = nil)
    service = VertexAiGroundingService.new
    result = service.query_with_grounding(
      query: query,
      latitude: latitude,
      longitude: longitude,
      conversation_history: conversation_history,
      address: address
    )

    result.merge(is_mock: false)
  end

  # POST /api/v1/buildings/analyze_floorplan
  # 募集図面PDFを解析し、建物情報と部屋情報を抽出
  def analyze_floorplan
    unless params[:file].present?
      return render json: { error: '募集図面PDFが必要です' }, status: :bad_request
    end

    unless params[:file].content_type == 'application/pdf'
      return render json: { error: 'PDFファイルのみアップロード可能です' }, status: :unprocessable_entity
    end

    begin
      # PDFデータをBase64エンコード
      pdf_data = params[:file].read
      pdf_base64 = Base64.strict_encode64(pdf_data)

      # 建物情報と部屋情報を抽出するプロンプト
      prompt = <<~PROMPT
        あなたは不動産の募集図面（チラシ）を解析する専門家です。
        このPDFは賃貸物件の募集図面です。以下の情報を抽出してJSON形式で出力してください。

        ## 建物情報（building）
        - name: 建物名（マンション名・アパート名など）
        - address: 所在地（住所）
        - building_type: 建物種別（以下のいずれか: mansion, apartment, house, office）
          - mansion: マンション、RC造、SRC造の集合住宅
          - apartment: アパート、木造・軽量鉄骨造の集合住宅
          - house: 一戸建て、テラスハウス
          - office: オフィス、店舗
        - structure: 構造（例: RC造, SRC造, 木造, 鉄骨造, 軽量鉄骨造）
        - floors: 建物の総階数（数値のみ）
        - built_date: 築年月（YYYY-MM-DD形式、年のみの場合はYYYY-01-01、不明な場合はnull）
        - total_units: 総戸数（数値のみ、不明な場合はnull）

        ## 部屋情報（room）
        - room_number: 部屋番号（例: 101, 201, A-101）
        - room_type: 間取り（studio, 1K, 1DK, 1LDK, 2K, 2DK, 2LDK, 3K, 3DK, 3LDK, other）
        - area: 専有面積（数値のみ、㎡）
        - rent: 賃料（数値のみ、円）
        - management_fee: 管理費・共益費（数値のみ、円。なしは0）
        - deposit: 敷金（数値のみ、円。月数指定の場合はnull）
        - deposit_months: 敷金（月数）
        - key_money: 礼金（数値のみ、円。月数指定の場合はnull）
        - key_money_months: 礼金（月数）
        - direction: 向き（南, 南東, 東, 北東, 北, 北西, 西, 南西）
        - floor: 階数（数値のみ）
        - facilities: 設備（カンマ区切り）
        - parking_fee: 駐車場料金（数値のみ、円。なし/込みは0、駐車場なしはnull）
        - available_date: 入居可能日（YYYY-MM-DD形式、「即入居可」は"immediate"）
        - pets_allowed: ペット可否（true/false）
        - guarantor_required: 保証人要否（true/false）
        - two_person_allowed: 二人入居可否（true/false）
        - description: 物件のアピールポイント（100文字程度）

        注意事項:
        - 情報が見つからない項目はnullを設定
        - 数値は必ず数値型で出力
        - JSONのみを出力し、他の説明は含めない
        - 必ず有効なJSON形式で出力

        出力例:
        {
          "building": {
            "name": "サンシャインハイツ渋谷",
            "address": "東京都渋谷区道玄坂1-2-3",
            "building_type": "mansion",
            "structure": "RC造",
            "floors": 10,
            "built_date": "2015-03-01",
            "total_units": 45
          },
          "room": {
            "room_number": "301",
            "room_type": "1LDK",
            "area": 45.5,
            "rent": 120000,
            "management_fee": 8000,
            "deposit": null,
            "deposit_months": 1,
            "key_money": null,
            "key_money_months": 1,
            "direction": "南",
            "floor": 3,
            "facilities": "エアコン,バス・トイレ別,室内洗濯機置場,オートロック",
            "parking_fee": 0,
            "available_date": "immediate",
            "pets_allowed": false,
            "guarantor_required": true,
            "two_person_allowed": true,
            "description": "南向きで日当たり良好。駅徒歩5分の好立地。"
          }
        }
      PROMPT

      # Gemini APIクライアントを初期化
      client = Gemini.new(
        credentials: {
          service: 'generative-language-api',
          api_key: ENV['GEMINI_API_KEY'],
          version: 'v1beta'
        },
        options: { model: 'gemini-2.5-flash' }
      )

      # Gemini APIにリクエスト送信
      result = client.generate_content({
        contents: {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'application/pdf',
                data: pdf_base64
              }
            }
          ]
        }
      })

      # レスポンスからテキストを取得
      response_text = result.dig('candidates', 0, 'content', 'parts', 0, 'text') || ''

      # JSONを抽出
      json_text = response_text.gsub(/```json\s*/, '').gsub(/```\s*/, '').strip
      extracted_data = JSON.parse(json_text)

      # building_typeの変換
      building_type_mapping = {
        'マンション' => 'mansion',
        'アパート' => 'apartment',
        '一戸建て' => 'house',
        'オフィス' => 'office',
        '店舗' => 'office'
      }
      if extracted_data['building'] && extracted_data['building']['building_type']
        original_type = extracted_data['building']['building_type']
        extracted_data['building']['building_type'] = building_type_mapping[original_type] || original_type
      end

      # room_typeの変換
      room_type_mapping = {
        'ワンルーム' => 'studio',
        'studio' => 'studio',
        '1K' => '1K', '1DK' => '1DK', '1LDK' => '1LDK',
        '2K' => '2K', '2DK' => '2DK', '2LDK' => '2LDK',
        '3K' => '3K', '3DK' => '3DK', '3LDK' => '3LDK',
        'その他' => 'other', 'other' => 'other'
      }
      if extracted_data['room'] && extracted_data['room']['room_type']
        original_type = extracted_data['room']['room_type']
        extracted_data['room']['room_type'] = room_type_mapping[original_type] || original_type
      end

      # 敷金・礼金を月数から金額に変換
      room = extracted_data['room']
      if room && room['rent']
        if room['deposit_months'] && room['deposit'].nil?
          room['deposit'] = room['rent'] * room['deposit_months']
        end
        if room['key_money_months'] && room['key_money'].nil?
          room['key_money'] = room['rent'] * room['key_money_months']
        end
      end

      # 入居可能日の変換
      if room && room['available_date'] == 'immediate'
        room['available_date'] = Date.today.to_s
        room['available_date_note'] = '即入居可'
      end

      # 設備の正規化処理
      if room && room['facilities'].present?
        normalizer = FacilityNormalizer.new
        facility_result = normalizer.normalize(room['facilities'])
        room['facility_codes'] = facility_result[:matched].map { |m| m[:facility].code }
        room['normalized_facilities'] = facility_result[:matched].map { |m| m[:facility].name }
        room['unmatched_facilities'] = facility_result[:unmatched]
      end

      render json: {
        success: true,
        extracted_data: extracted_data,
        message: '募集図面の解析が完了しました'
      }

    rescue JSON::ParserError => e
      Rails.logger.error("Floorplan analysis JSON parse error: #{e.message}")
      render json: {
        error: '解析結果のパースに失敗しました',
        details: e.message,
        raw_response: response_text
      }, status: :unprocessable_entity
    rescue StandardError => e
      Rails.logger.error("Floorplan analysis error: #{e.message}")
      Rails.logger.error(e.backtrace.first(5).join("\n"))
      render json: {
        error: '募集図面の解析に失敗しました',
        details: e.message
      }, status: :internal_server_error
    end
  end

  # POST /api/v1/buildings/find_similar
  # 建物名・住所・座標から類似建物を検索
  def find_similar
    matcher = BuildingMatcherService.new(tenant: current_tenant)
    results = matcher.find_similar(
      name: params[:name],
      address: params[:address],
      latitude: params[:latitude]&.to_f,
      longitude: params[:longitude]&.to_f
    )

    render json: {
      success: true,
      similar_buildings: results.map do |r|
        {
          id: r[:building].id,
          name: r[:building].name,
          address: r[:building].address,
          building_type: r[:building].building_type,
          latitude: r[:building].latitude,
          longitude: r[:building].longitude,
          room_cnt: r[:building].room_cnt,
          free_cnt: r[:building].free_cnt,
          score: r[:score],
          reasons: r[:reasons]
        }
      end
    }
  end

  # POST /api/v1/buildings/register_from_floorplan
  # 建物と部屋を一括登録し、募集図面PDFを部屋に添付
  def register_from_floorplan
    ActiveRecord::Base.transaction do
      building_data = params[:building] || {}
      room_data = params[:room] || {}

      # 既存建物に追加する場合
      if building_data[:id].present?
        @building = current_tenant.buildings.find(building_data[:id])
        is_new_building = false
      else
        # 新規建物を作成
        @building = current_tenant.buildings.build(
          name: building_data[:name],
          address: building_data[:address],
          building_type: building_data[:building_type] || 'mansion',
          structure: building_data[:structure],
          floors: building_data[:floors],
          built_date: building_data[:built_date],
          total_units: building_data[:total_units],
          latitude: building_data[:latitude],
          longitude: building_data[:longitude]
        )

        unless @building.save
          return render json: { errors: @building.errors.full_messages }, status: :unprocessable_entity
        end
        is_new_building = true
      end

      # 部屋を作成
      @room = @building.rooms.build(
        room_number: room_data[:room_number] || '未設定',
        floor: room_data[:floor] || 1,
        room_type: convert_room_type(room_data[:room_type]),
        area: room_data[:area],
        rent: room_data[:rent],
        management_fee: room_data[:management_fee],
        deposit: room_data[:deposit],
        key_money: room_data[:key_money],
        direction: room_data[:direction],
        parking_fee: room_data[:parking_fee],
        available_date: room_data[:available_date],
        pets_allowed: room_data[:pets_allowed],
        guarantor_required: room_data[:guarantor_required],
        two_person_allowed: room_data[:two_person_allowed],
        description: room_data[:description],
        facilities: room_data[:facilities]
      )

      unless @room.save
        return render json: { errors: @room.errors.full_messages }, status: :unprocessable_entity
      end

      # 設備を登録
      if params[:facility_codes].present?
        Array(params[:facility_codes]).each do |code|
          facility = Facility.find_by(code: code)
          next unless facility
          @room.room_facilities.create!(facility: facility)
        end
      end

      # 募集図面PDFを添付
      if params[:file].present?
        # ファイルを先に読み取ってからサムネイル生成（Active Storageの非同期を回避）
        pdf_data = params[:file].read
        params[:file].rewind

        @room.floorplan_pdf.attach(params[:file])

        # サムネイル生成（元のPDFデータから直接生成）
        generate_floorplan_thumbnail_from_data(@room, pdf_data)
      end

      render json: {
        success: true,
        building: @building.as_json(methods: [:room_cnt, :free_cnt, :latitude, :longitude]),
        room: @room.as_json(methods: [:status_label, :room_type_label]),
        is_new_building: is_new_building
      }, status: :created
    end
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: [e.message] }, status: :unprocessable_entity
  end

  private

  def set_building
    @building = current_tenant.buildings.find(params[:id])
  end

  def building_params
    params.require(:building).permit(
      :name,
      :address,
      :latitude,
      :longitude,
      :building_type,
      :total_units,
      :built_date,
      :description,
      :postcode,
      :structure,
      :floors,
      :has_elevator,
      :has_bicycle_parking,
      :has_parking,
      :parking_spaces,
      :store_id
    )
  end

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end

  # room_typeの変換（API応答形式をDB enum値に変換）
  def convert_room_type(room_type)
    mapping = {
      'studio' => 'studio',
      '1K' => 'one_bedroom',
      '1DK' => 'one_dk',
      '1LDK' => 'one_ldk',
      '2K' => 'two_bedroom',
      '2DK' => 'two_dk',
      '2LDK' => 'two_ldk',
      '3K' => 'three_bedroom',
      '3DK' => 'three_dk',
      '3LDK' => 'three_ldk',
      'other' => 'other'
    }
    mapping[room_type] || room_type
  end

  # PDFの1ページ目からサムネイル画像を生成
  def generate_floorplan_thumbnail(room)
    return unless room.floorplan_pdf.attached?

    begin
      pdf_tempfile = Tempfile.new(['floorplan', '.pdf'])
      pdf_tempfile.binmode
      pdf_tempfile.write(room.floorplan_pdf.download)
      pdf_tempfile.rewind

      thumbnail_tempfile = Tempfile.new(['thumbnail', '.png'])

      system(
        'convert',
        '-density', '150',
        '-quality', '90',
        '-background', 'white',
        '-flatten',
        "#{pdf_tempfile.path}[0]",
        '-resize', '800x>',
        thumbnail_tempfile.path
      )

      if File.exist?(thumbnail_tempfile.path) && File.size(thumbnail_tempfile.path) > 0
        room.floorplan_thumbnail.attach(
          io: File.open(thumbnail_tempfile.path),
          filename: "floorplan_thumbnail_#{room.id}.png",
          content_type: 'image/png'
        )
        Rails.logger.info("Floorplan thumbnail generated for room #{room.id}")
      end

      pdf_tempfile.close
      pdf_tempfile.unlink
      thumbnail_tempfile.close
      thumbnail_tempfile.unlink
    rescue StandardError => e
      Rails.logger.error("Failed to generate floorplan thumbnail: #{e.message}")
    end
  end

  # PDFデータから直接サムネイルを生成（Active Storage非同期を回避）
  def generate_floorplan_thumbnail_from_data(room, pdf_data)
    return if pdf_data.blank?

    begin
      pdf_tempfile = Tempfile.new(['floorplan', '.pdf'])
      pdf_tempfile.binmode
      pdf_tempfile.write(pdf_data)
      pdf_tempfile.rewind

      thumbnail_tempfile = Tempfile.new(['thumbnail', '.png'])

      result = system(
        'convert',
        '-density', '150',
        '-quality', '90',
        '-background', 'white',
        '-flatten',
        "#{pdf_tempfile.path}[0]",
        '-resize', '800x>',
        thumbnail_tempfile.path
      )

      Rails.logger.info("ImageMagick convert result: #{result}")

      if File.exist?(thumbnail_tempfile.path) && File.size(thumbnail_tempfile.path) > 0
        room.floorplan_thumbnail.attach(
          io: File.open(thumbnail_tempfile.path),
          filename: "floorplan_thumbnail_#{room.id}.png",
          content_type: 'image/png'
        )
        Rails.logger.info("Floorplan thumbnail generated for room #{room.id}")
      else
        Rails.logger.error("Thumbnail file not created or empty")
      end

      pdf_tempfile.close
      pdf_tempfile.unlink
      thumbnail_tempfile.close
      thumbnail_tempfile.unlink
    rescue StandardError => e
      Rails.logger.error("Failed to generate floorplan thumbnail: #{e.message}")
      Rails.logger.error(e.backtrace.first(5).join("\n"))
    end
  end
end
