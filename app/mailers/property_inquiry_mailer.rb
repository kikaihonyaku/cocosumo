class PropertyInquiryMailer < ApplicationMailer
  # 管理者（物件担当者）への通知メール
  def notify_admin(property_inquiry)
    @inquiry = property_inquiry
    @publication = property_inquiry.property_publication
    @room = @publication.room
    @building = @room.building

    # 管理者のメールアドレスを取得（テナントのユーザー）
    admin_email = @building.tenant&.user&.email
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

    mail(
      to: @inquiry.email,
      subject: "[CoCoスモ] お問い合わせを受け付けました - #{@building.name}"
    )
  end

  private

  def property_public_url(publication)
    host = ENV.fetch('APP_HOST', 'https://cocosumo.space')
    "#{host}/property/#{publication.publication_id}"
  end
end
