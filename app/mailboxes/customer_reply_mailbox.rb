# frozen_string_literal: true

class CustomerReplyMailbox < ApplicationMailbox
  RATE_LIMIT_COUNT = 10
  RATE_LIMIT_PERIOD = 1.hour
  MAX_MESSAGE_LENGTH = 10_000
  SPAM_SCORE_THRESHOLD = 5.0

  before_processing :check_spam_score
  before_processing :find_tenant
  before_processing :find_customer_and_inquiry
  before_processing :check_rate_limit

  def process
    body = sanitized_body
    subject = mail.subject || "(件名なし)"

    # 対応履歴に受信メールを記録
    @customer.add_activity!(
      activity_type: :email,
      direction: :inbound,
      inquiry: @inquiry,
      subject: subject,
      content: body
    )

    # 店舗担当者に返信通知メールを送信
    CustomerMailer.notify_reply_received(@customer, @inquiry, subject, body, store: @store).deliver_later

    Rails.logger.info "[CustomerReplyMailbox] Recorded reply from #{sender_email} for customer ##{@customer.id}, inquiry ##{@inquiry.id}"
  rescue ActiveRecord::RecordInvalid => e
    Rails.logger.error "[CustomerReplyMailbox] Failed to record activity: #{e.message}"
    bounced!
  end

  private

  def find_tenant
    recipient = mail.to&.first
    unless recipient
      Rails.logger.warn "[CustomerReplyMailbox] No recipient address found"
      bounced!
      return
    end

    subdomain = recipient.match(/^(.+)-reply-\d+-\d+(?:-\d+)?@/i)&.[](1)
    unless subdomain
      Rails.logger.warn "[CustomerReplyMailbox] Invalid reply address format: #{recipient}"
      bounced!
      return
    end

    @tenant = Tenant.find_by(subdomain: subdomain, status: :active)
    unless @tenant
      Rails.logger.warn "[CustomerReplyMailbox] Tenant not found for subdomain: #{subdomain}"
      bounced!
    end
  end

  def find_customer_and_inquiry
    recipient = mail.to&.first
    match = recipient&.match(/-reply-(\d+)-(\d+)(?:-(\d+))?@/i)
    unless match
      Rails.logger.warn "[CustomerReplyMailbox] Could not extract IDs from: #{recipient}"
      bounced!
      return
    end

    customer_id = match[1].to_i
    inquiry_id = match[2].to_i
    store_id = match[3]&.to_i

    @customer = @tenant.customers.find_by(id: customer_id)
    unless @customer
      Rails.logger.warn "[CustomerReplyMailbox] Customer ##{customer_id} not found for tenant #{@tenant.subdomain}"
      bounced!
      return
    end

    @inquiry = @customer.inquiries.find_by(id: inquiry_id)
    unless @inquiry
      Rails.logger.warn "[CustomerReplyMailbox] Inquiry ##{inquiry_id} not found for customer ##{customer_id}"
      bounced!
      return
    end

    @store = @tenant.stores.find_by(id: store_id) if store_id.present? && store_id > 0
  end

  def check_spam_score
    spam_score = mail['X-Spam-Score']&.to_s&.to_f || 0
    if spam_score > SPAM_SCORE_THRESHOLD
      Rails.logger.warn "[CustomerReplyMailbox] Rejected spam email (score: #{spam_score}) from #{sender_email}"
      bounced!
    end
  end

  def check_rate_limit
    return unless sender_email.present?

    recent_count = @customer.customer_activities
      .where(activity_type: :email, direction: :inbound)
      .where("created_at > ?", RATE_LIMIT_PERIOD.ago)
      .count

    if recent_count >= RATE_LIMIT_COUNT
      Rails.logger.warn "[CustomerReplyMailbox] Rate limit exceeded for customer ##{@customer.id}"
      bounced!
    end
  end

  def sender_email
    @sender_email ||= mail.from&.first&.downcase
  end

  def sanitized_body
    body = mail.text_part&.decoded || mail.decoded || ''
    body = ActionController::Base.helpers.strip_tags(body)
    body.truncate(MAX_MESSAGE_LENGTH)
  end
end
