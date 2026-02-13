class PropertyInquiryMailer < ApplicationMailer
  # 管理者（物件担当者）への通知メール
  def notify_admin(property_inquiry, store: nil)
    @inquiry = property_inquiry
    @publication = property_inquiry.property_publication
    @room = @publication.room
    @building = @room.building

    # 店舗メール → テナントユーザーメールの順でフォールバック
    admin_email = store&.email.presence || @building.tenant&.user&.email
    return unless admin_email.present?

    @property_url = property_public_url(@publication)

    mail(
      to: admin_email,
      subject: "[CoCoスモ] 物件へのお問い合わせがありました - #{@building.name} #{@room.room_number}号室"
    )
  end

  # 顧客への自動返信メール
  def confirm_to_customer(property_inquiry)
    @inquiry = property_inquiry
    @publication = property_inquiry.property_publication
    @room = @publication.room
    @building = @room.building

    @property_url = property_public_url(@publication)

    # LINE友だち追加案内（LINE未連携の顧客のみ）
    line_config = @building.tenant&.line_config
    customer = property_inquiry.customer
    if line_config&.line_guidance_available? && customer&.line_user_id.blank?
      @line_friend_add_url = line_config.friend_add_url
    end

    mail(
      to: @inquiry.email,
      subject: "[CoCoスモ] お問い合わせを受け付けました - #{@building.name}"
    )
  end

  # 顧客への返信メール
  def reply_to_customer(property_inquiry, subject, body, store: nil, activity_id: nil)
    @inquiry = property_inquiry
    @body = body
    @publication = property_inquiry.property_publication
    @room = @publication.room
    @building = @room.building

    # SendGrid Event Webhook 用のトラッキングヘッダー
    if activity_id.present?
      headers["X-SMTPAPI"] = {
        unique_args: {
          activity_id: activity_id,
          tenant_id: @building.tenant_id
        }
      }.to_json
    end

    # 返信元アドレス: 店舗メール → テナントユーザーメール → デフォルト
    reply_from = store&.email.presence || @building.tenant&.user&.email
    reply_from = default_from if reply_from.blank?

    mail(
      to: @inquiry.email,
      from: reply_from,
      reply_to: reply_from,
      subject: subject
    )
  end

  private

  def property_public_url(publication)
    tenant = publication.tenant
    base_url = tenant_base_url(tenant)
    "#{base_url}/property/#{publication.publication_id}"
  end

  def default_from
    ENV.fetch('MAILER_FROM_ADDRESS', 'noreply@cocosumo.space')
  end
end
