# frozen_string_literal: true

class PropertyInquiryMailbox < ApplicationMailbox
  # Rate limiting constants
  RATE_LIMIT_COUNT = 5
  RATE_LIMIT_PERIOD = 1.hour
  MAX_MESSAGE_LENGTH = 10_000
  SPAM_SCORE_THRESHOLD = 5.0

  before_processing :check_spam_score
  before_processing :find_tenant
  before_processing :check_rate_limit

  def process
    customer = Customer.find_or_create_by_contact!(
      tenant: @tenant,
      email: sender_email,
      name: sender_name,
      phone: nil
    )

    default_room = find_default_inquiry_room

    inquiry = PropertyInquiry.create!(
      room: default_room,
      customer: customer,
      name: sender_name,
      email: sender_email,
      message: sanitized_body,
      media_type: :email,
      origin_type: :general_inquiry,
      channel: :email
    )

    Rails.logger.info "[PropertyInquiryMailbox] Created inquiry ##{inquiry.id} for tenant #{@tenant.subdomain}"
  rescue ActiveRecord::RecordInvalid => e
    Rails.logger.error "[PropertyInquiryMailbox] Failed to create inquiry: #{e.message}"
    bounced!
  end

  private

  def find_tenant
    recipient = mail.to&.first
    unless recipient
      Rails.logger.warn "[PropertyInquiryMailbox] No recipient address found"
      bounced!
      return
    end

    subdomain = recipient.match(/^(.+)-inquiry@/i)&.[](1)
    unless subdomain
      Rails.logger.warn "[PropertyInquiryMailbox] Invalid address format: #{recipient}"
      bounced!
      return
    end

    @tenant = Tenant.find_by(subdomain: subdomain, status: :active)
    unless @tenant
      Rails.logger.warn "[PropertyInquiryMailbox] Tenant not found for subdomain: #{subdomain}"
      bounced!
    end
  end

  def find_default_inquiry_room
    room_id = @tenant.settings&.dig('default_inquiry_room_id')
    return Room.find(room_id) if room_id.present?

    # Fallback: find any room from the tenant
    room = Room.joins(:building).where(buildings: { tenant_id: @tenant.id }).first
    unless room
      Rails.logger.error "[PropertyInquiryMailbox] No room available for tenant: #{@tenant.subdomain}"
      bounced!
      raise ActiveRecord::RecordNotFound, "No default inquiry room configured"
    end
    room
  end

  def check_spam_score
    spam_score = mail['X-Spam-Score']&.to_s&.to_f || 0
    if spam_score > SPAM_SCORE_THRESHOLD
      Rails.logger.warn "[PropertyInquiryMailbox] Rejected spam email (score: #{spam_score}) from #{sender_email}"
      bounced!
    end
  end

  def check_rate_limit
    return unless sender_email.present?

    recent_count = PropertyInquiry
      .where(email: sender_email)
      .where(channel: :email)
      .where('created_at > ?', RATE_LIMIT_PERIOD.ago)
      .count

    if recent_count >= RATE_LIMIT_COUNT
      Rails.logger.warn "[PropertyInquiryMailbox] Rate limit exceeded for: #{sender_email}"
      bounced!
    end
  end

  def sender_email
    @sender_email ||= mail.from&.first&.downcase
  end

  def sender_name
    @sender_name ||= begin
      # Try to get name from the From header
      from_field = mail[:from]
      name = from_field&.display_names&.first
      name.presence || sender_email&.split('@')&.first || 'Unknown'
    end
  end

  def sanitized_body
    body = mail.text_part&.decoded || mail.decoded || ''
    # Strip HTML tags and limit length
    body = ActionController::Base.helpers.strip_tags(body)
    body.truncate(MAX_MESSAGE_LENGTH)
  end
end
