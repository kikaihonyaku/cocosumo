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

    # 空室有無のフィルタ
    if params[:has_vacancy].present?
      if params[:has_vacancy] == 'true'
        @buildings = @buildings.select { |b| b.rooms.where(status: :vacant).count > 0 }
      elsif params[:has_vacancy] == 'false'
        @buildings = @buildings.select { |b| b.rooms.where(status: :vacant).count == 0 }
      end
    end

    @buildings = @buildings.order(created_at: :desc)

    # 空室数・空室率を含めて返す
    render json: @buildings.as_json(methods: [:room_cnt, :free_cnt])
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

      Rails.logger.info("Grounding query: #{params[:query]}")
      Rails.logger.info("Location: #{latitude}, #{longitude}")
      Rails.logger.info("Address: #{@building.address}")
      Rails.logger.info("Conversation history size: #{conversation_history.size}")

      # Vertex AI Grounding APIを試行し、エラー時はモックレスポンスにフォールバック
      response = call_vertex_ai_grounding(params[:query], latitude, longitude, conversation_history, @building.address)

      render json: {
        success: true,
        answer: response[:answer],
        sources: response[:sources],
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
        error: '周辺情報の取得に失敗しました',
        details: e.message
      }, status: :internal_server_error
    end
  end

  # Vertex AI Grounding APIを呼び出し、エラー時はモックレスポンスにフォールバック
  def call_vertex_ai_grounding(query, latitude, longitude, conversation_history = [], address = nil)
    service = VertexAiGroundingService.new
    result = service.query_with_grounding(
      query: query,
      latitude: latitude,
      longitude: longitude,
      conversation_history: conversation_history,
      address: address
    )

    Rails.logger.info("Vertex AI Grounding API success")
    result.merge(is_mock: false)

  rescue VertexAiGroundingService::GroundingError => e
    Rails.logger.warn("Vertex AI Grounding failed, falling back to mock: #{e.message}")

    # フォールバック: モックレスポンス
    mock_response = generate_mock_response(query, latitude, longitude, address || @building.address)
    mock_response.merge(is_mock: true)
  end

  def generate_mock_response(query, latitude, longitude, address)
    # モックレスポンスを生成
    {
      answer: "#{address}周辺についてお答えします。\n\n" \
              "この地域は、生活に便利な施設が充実したエリアです。\n\n" \
              "【周辺施設】\n" \
              "・コンビニエンスストア: 徒歩3分圏内に複数店舗\n" \
              "・スーパーマーケット: 徒歩5分\n" \
              "・飲食店: 多様なジャンルの飲食店が充実\n" \
              "・駅: 最寄り駅まで徒歩10分\n\n" \
              "【生活環境】\n" \
              "・閑静な住宅街で、治安も良好です\n" \
              "・公園や緑地も近く、生活しやすい環境です\n\n" \
              "※現在はデモ版のため、実際のGoogle Mapsデータに基づく情報ではありません。\n" \
              "実際の機能を利用するには、Vertex AI APIの設定が必要です。",
      sources: [
        { name: "Google Maps (デモ)", url: "https://maps.google.com/" }
      ]
    }
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
      :built_year,
      :description,
      :postcode,
      :structure,
      :floors
    )
  end

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end
end
