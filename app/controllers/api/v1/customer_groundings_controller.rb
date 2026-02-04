class Api::V1::CustomerGroundingsController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :set_customer_access
  before_action :check_access_permission
  before_action :check_daily_quota

  DAILY_LIMIT = 30

  # POST /api/v1/customer/:access_token/grounding
  def create
    unless params[:query].present?
      return render json: { error: 'クエリが必要です' }, status: :bad_request
    end

    building = @property_publication.room&.building

    unless building
      return render json: { error: '物件情報が見つかりません' }, status: :not_found
    end

    latitude = params[:latitude].presence || building.latitude
    longitude = params[:longitude].presence || building.longitude

    unless latitude && longitude
      return render json: { error: '位置情報が設定されていません' }, status: :bad_request
    end

    conversation_history = params[:conversation_history] || []

    begin
      service = VertexAiGroundingService.new
      response = service.query_with_grounding(
        query: params[:query],
        latitude: latitude,
        longitude: longitude,
        conversation_history: conversation_history,
        address: building.address
      )

      increment_usage

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
        is_mock: response[:is_mock] || false,
        remaining: remaining_quota
      }
    rescue StandardError => e
      Rails.logger.error("Customer Grounding API error: #{e.message}")
      Rails.logger.error(e.backtrace.first(5).join("\n"))
      render json: {
        error: 'AI応答の取得に失敗しました。しばらく時間をおいて再度お試しください。',
        details: e.message
      }, status: :internal_server_error
    end
  end

  private

  def set_customer_access
    @customer_access = CustomerAccess.find_by(access_token: params[:access_token])

    unless @customer_access
      render json: { error: 'アクセストークンが無効です' }, status: :not_found
      return
    end

    @property_publication = @customer_access.property_publication
  end

  def check_access_permission
    unless @customer_access.accessible?
      if @customer_access.revoked?
        render json: { error: 'このアクセス権は取り消されています' }, status: :forbidden
      elsif @customer_access.expired?
        render json: { error: 'このアクセス権の有効期限が切れています' }, status: :gone
      else
        render json: { error: 'アクセス権がありません' }, status: :forbidden
      end
    end
  end

  def check_daily_quota
    if remaining_quota <= 0
      render json: {
        error: "本日の利用回数上限に達しました（1日#{DAILY_LIMIT}回まで）",
        remaining: 0
      }, status: :too_many_requests
    end
  end

  def session_id
    @session_id ||= begin
      raw = "#{request.remote_ip}-#{params[:access_token]}"
      Digest::SHA256.hexdigest(raw)[0..31]
    end
  end

  def cache_key
    "customer_grounding:#{@property_publication.id}:#{session_id}:#{Date.current}"
  end

  def current_usage
    Rails.cache.read(cache_key).to_i
  end

  def remaining_quota
    [DAILY_LIMIT - current_usage, 0].max
  end

  def increment_usage
    Rails.cache.write(cache_key, current_usage + 1, expires_in: 24.hours)
  end
end
