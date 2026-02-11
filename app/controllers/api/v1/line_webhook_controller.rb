class Api::V1::LineWebhookController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :set_tenant
  before_action :verify_signature

  # POST /api/v1/line/webhook/:tenant_subdomain
  def receive
    body = request.body.read
    events = @client.parse_events_from(body)

    events.each do |event|
      case event
      when Line::Bot::Event::Message
        handle_message(event)
      when Line::Bot::Event::Follow
        handle_follow(event)
      when Line::Bot::Event::Unfollow
        handle_unfollow(event)
      end
    end

    head :ok
  end

  private

  def set_tenant
    @tenant = Tenant.find_by!(subdomain: params[:tenant_subdomain])
    @config = @tenant.line_config

    unless @config&.configured?
      head :not_found
      return
    end

    @client = Line::Bot::Client.new do |c|
      c.channel_id = @config.channel_id
      c.channel_secret = @config.channel_secret
      c.channel_token = @config.channel_token
    end
  rescue ActiveRecord::RecordNotFound
    head :not_found
  end

  def verify_signature
    body = request.body.read
    request.body.rewind
    signature = request.env["HTTP_X_LINE_SIGNATURE"]

    unless @client.validate_signature(body, signature)
      head :bad_request
    end
  end

  def handle_message(event)
    line_user_id = event["source"]["userId"]
    return unless line_user_id

    customer = @tenant.customers.find_by(line_user_id: line_user_id)
    return unless customer

    # 案件を取得（最新のアクティブな案件、なければ最新の案件）
    inquiry = customer.inquiries.find_by(status: :active) || customer.inquiries.order(created_at: :desc).first
    return unless inquiry

    case event.type
    when Line::Bot::Event::MessageType::Text
      record_text_message(customer, inquiry, event)
    when Line::Bot::Event::MessageType::Image
      record_image_message(customer, inquiry, event)
    end
  end

  def record_text_message(customer, inquiry, event)
    customer.add_activity!(
      activity_type: :line_message,
      direction: :inbound,
      inquiry: inquiry,
      content: event.message["text"],
      metadata: { line_message_type: "text", line_message_id: event.message["id"] }
    )
  end

  def record_image_message(customer, inquiry, event)
    # 画像のURLは取得不可（LINE APIの制約）。メッセージIDだけ記録
    customer.add_activity!(
      activity_type: :line_message,
      direction: :inbound,
      inquiry: inquiry,
      content: "[画像メッセージ]",
      metadata: { line_message_type: "image", line_message_id: event.message["id"] }
    )
  end

  def handle_follow(event)
    line_user_id = event["source"]["userId"]
    return unless line_user_id

    # プロフィール取得
    service = LineMessageService.new(@tenant)
    profile = service.get_profile(line_user_id)
    display_name = profile&.dig("displayName") || "LINE ユーザー"

    # 顧客検索または作成
    customer = Customer.find_or_create_by_contact!(
      tenant: @tenant,
      line_user_id: line_user_id,
      name: display_name
    )

    # 既存顧客にline_user_idを紐付け
    if customer.line_user_id.blank?
      customer.update!(line_user_id: line_user_id)
    end

    # 案件がない場合は作成
    inquiry = customer.inquiries.first
    unless inquiry
      inquiry = @tenant.inquiries.create!(
        customer: customer,
        notes: "LINE友だち追加"
      )
    end

    # 友だち追加を記録
    customer.add_activity!(
      activity_type: :line_message,
      direction: :inbound,
      inquiry: inquiry,
      subject: "友だち追加",
      content: "LINEで友だち追加されました（#{display_name}）",
      metadata: { line_message_type: "follow" }
    )

    # 挨拶メッセージ送信
    if @config.greeting_message.present?
      service.push_text(line_user_id, @config.greeting_message)
    end
  end

  def handle_unfollow(event)
    line_user_id = event["source"]["userId"]
    return unless line_user_id

    customer = @tenant.customers.find_by(line_user_id: line_user_id)
    return unless customer

    inquiry = customer.inquiries.order(created_at: :desc).first
    return unless inquiry

    customer.add_activity!(
      activity_type: :line_message,
      direction: :inbound,
      inquiry: inquiry,
      subject: "ブロック",
      content: "LINEでブロックされました",
      metadata: { line_message_type: "unfollow" }
    )

    # line_user_id をクリア（ブロックされたため送信不可）
    customer.update!(line_user_id: nil)
  end
end
