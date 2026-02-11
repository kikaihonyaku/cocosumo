class LineMessageService
  class NotConfiguredError < StandardError; end
  class DeliveryError < StandardError; end

  attr_reader :tenant, :client

  def initialize(tenant)
    @tenant = tenant
    @config = tenant.line_config

    raise NotConfiguredError, "LINE設定が見つかりません" unless @config&.configured?

    @client = Line::Bot::Client.new do |c|
      c.channel_id = @config.channel_id
      c.channel_secret = @config.channel_secret
      c.channel_token = @config.channel_token
    end
  end

  def configured?
    @config&.configured? || false
  end

  # テキストメッセージ送信
  def push_text(line_user_id, text)
    message = { type: "text", text: text }
    push_message(line_user_id, message)
  end

  # 画像メッセージ送信
  def push_image(line_user_id, image_url, preview_url = nil)
    message = {
      type: "image",
      originalContentUrl: image_url,
      previewImageUrl: preview_url || image_url
    }
    push_message(line_user_id, message)
  end

  # Flex Message 送信
  def push_flex(line_user_id, alt_text, flex_contents)
    message = {
      type: "flex",
      altText: alt_text,
      contents: flex_contents
    }
    push_message(line_user_id, message)
  end

  # 物件カード Flex Message 送信
  def push_property_card(line_user_id, room)
    flex_contents = FlexMessageBuilder.build_property_card(room)
    alt_text = "#{room.building&.name} #{room.room_number} の物件情報"
    push_flex(line_user_id, alt_text, flex_contents)
  end

  # ユーザープロフィール取得
  def get_profile(line_user_id)
    response = @client.get_profile(line_user_id)
    if response.is_a?(Net::HTTPSuccess)
      JSON.parse(response.body)
    else
      nil
    end
  end

  # Webhook 署名検証
  def verify_signature(body, signature)
    @client.validate_signature(body, signature)
  end

  # Bot情報取得（接続テスト用）
  def get_bot_info
    response = @client.get_bot_info
    if response.is_a?(Net::HTTPSuccess)
      JSON.parse(response.body)
    else
      raise DeliveryError, "Bot情報の取得に失敗しました: #{response.code}"
    end
  end

  private

  def push_message(line_user_id, message)
    response = @client.push_message(line_user_id, message)
    unless response.is_a?(Net::HTTPSuccess)
      error_body = begin
        JSON.parse(response.body)
      rescue
        { "message" => response.body }
      end
      raise DeliveryError, "LINE送信エラー: #{error_body['message'] || response.code}"
    end
    response
  end
end
