class CustomerMailer < ApplicationMailer
  # 顧客へのメール送信
  def send_to_customer(customer, sender_user, subject, body, inquiry, body_format: "text", attachment_ids: nil)
    @customer = customer
    @body = body
    @body_format = body_format
    @sender = sender_user

    tenant = customer.tenant
    store = sender_user.store
    from_address = store&.email.presence || default_from
    reply_to_address = "#{tenant.subdomain}-reply-#{customer.id}-#{inquiry.id}-#{store&.id || 0}@inbound.cocosumo.space"

    # Active Storageから添付ファイルを読み込み
    if attachment_ids.present?
      EmailAttachment.where(id: attachment_ids).find_each do |email_attachment|
        next unless email_attachment.file.attached?
        attachments[email_attachment.filename] = {
          mime_type: email_attachment.content_type,
          content: email_attachment.file.download
        }
      end
    end

    mail(
      to: customer.email,
      from: from_address,
      reply_to: reply_to_address,
      bcc: from_address,
      subject: subject
    )
  end

  # 顧客からの返信を店舗担当者に通知
  def notify_reply_received(customer, inquiry, reply_subject, reply_body, store: nil)
    @customer = customer
    @inquiry = inquiry
    @reply_subject = reply_subject
    @reply_body = reply_body

    tenant = customer.tenant
    notify_email = store&.email.presence || tenant.user&.email
    return unless notify_email.present?

    @customer_url = "#{tenant_base_url(tenant)}/customers/#{customer.id}"

    mail(
      to: notify_email,
      subject: "[CoCoスモ] #{customer.name}様からメール返信がありました"
    )
  end

  private

  def default_from
    ENV.fetch('MAILER_FROM_ADDRESS', 'noreply@cocosumo.space')
  end
end
