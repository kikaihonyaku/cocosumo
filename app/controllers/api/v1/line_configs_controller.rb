class Api::V1::LineConfigsController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :require_admin

  # GET /api/v1/line_config
  def show
    config = current_user.tenant.line_config

    if config
      render json: config_json(config)
    else
      render json: { configured: false }
    end
  end

  # PUT /api/v1/line_config
  def update
    config = current_user.tenant.line_config || current_user.tenant.build_line_config

    if config.update(config_params)
      render json: { success: true, config: config_json(config) }
    else
      render json: { errors: config.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # POST /api/v1/line_config/test
  def test
    config = current_user.tenant.line_config
    unless config&.configured?
      return render json: { success: false, message: "LINE設定が未完了です" }, status: :unprocessable_entity
    end

    begin
      service = LineMessageService.new(current_user.tenant)
      bot_info = service.get_bot_info
      config.update!(webhook_verified: true)

      render json: {
        success: true,
        message: "接続テスト成功",
        bot_info: {
          display_name: bot_info["displayName"],
          user_id: bot_info["userId"],
          picture_url: bot_info["pictureUrl"]
        }
      }
    rescue LineMessageService::DeliveryError => e
      render json: { success: false, message: e.message }, status: :unprocessable_entity
    rescue => e
      render json: { success: false, message: "接続テストに失敗しました: #{e.message}" }, status: :unprocessable_entity
    end
  end

  private

  def config_params
    params.require(:line_config).permit(
      :channel_id, :channel_secret, :channel_token,
      :greeting_message, :rich_menu_id, :active, :friend_add_url
    )
  end

  def config_json(config)
    {
      configured: true,
      channel_id: mask_value(config.channel_id),
      channel_secret: mask_value(config.channel_secret),
      channel_token: mask_value(config.channel_token),
      webhook_verified: config.webhook_verified,
      greeting_message: config.greeting_message,
      rich_menu_id: config.rich_menu_id,
      active: config.active,
      friend_add_url: config.friend_add_url,
      webhook_url: webhook_url(config.tenant)
    }
  end

  def mask_value(value)
    return nil if value.blank?
    return value if value.length <= 8
    "#{value[0..3]}#{'*' * (value.length - 8)}#{value[-4..]}"
  end

  def webhook_url(tenant)
    base = Thread.current[:request_base_url] || request.base_url
    "#{base}/api/v1/line/webhook/#{tenant.subdomain}"
  end
end
