class Api::V1::BuildingsController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :set_building, only: [:show, :update, :destroy, :grounding]

  # GET /api/v1/buildings
  def index
    @buildings = current_tenant.buildings.kept.includes(:rooms)

    # 検索条件によるフィルタリング
    @buildings = @buildings.where("name LIKE ?", "%#{params[:name]}%") if params[:name].present?
    @buildings = @buildings.where("address LIKE ?", "%#{params[:address]}%") if params[:address].present?
    @buildings = @buildings.where(building_type: params[:building_type]) if params[:building_type].present?
    @buildings = @buildings.where("total_units >= ?", params[:min_rooms]) if params[:min_rooms].present?
    @buildings = @buildings.where("total_units <= ?", params[:max_rooms]) if params[:max_rooms].present?

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

    # 空室数・空室率・部屋情報を含めて返す
    render json: @buildings.as_json(
      methods: [:room_cnt, :free_cnt, :latitude, :longitude],
      include: {
        rooms: {
          only: [:id, :rent, :area, :room_type, :status, :floor, :room_number]
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
      :parking_spaces
    )
  end

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end
end
