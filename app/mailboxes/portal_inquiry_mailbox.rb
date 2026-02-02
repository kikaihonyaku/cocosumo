# frozen_string_literal: true

class PortalInquiryMailbox < ApplicationMailbox
  RATE_LIMIT_COUNT = 5
  RATE_LIMIT_PERIOD = 1.hour
  SPAM_SCORE_THRESHOLD = 5.0

  PORTAL_PARSERS = {
    suumo: PortalEmailParsers::SuumoParser
    # athome: PortalEmailParsers::AthomeParser,
    # homes: PortalEmailParsers::HomesParser,
    # lifull: PortalEmailParsers::LifullParser,
  }.freeze

  before_processing :find_tenant
  before_processing :detect_portal
  before_processing :check_spam_score
  before_processing :check_rate_limit

  def process
    parsed = @parser.parse(mail)

    name = parsed[:name] || fallback_name
    email = parsed[:email] || sender_email
    phone = parsed[:phone]
    message = parsed[:message] || sanitized_body
    origin_type = parsed[:origin_type] || :general_inquiry

    if parsed[:name].nil? && parsed[:email].nil?
      Rails.logger.warn "[PortalInquiryMailbox] Parse incomplete for #{@portal_type} email from #{sender_email}"
    end

    customer = Customer.find_or_create_by_contact!(
      tenant: @tenant,
      email: email,
      name: name,
      phone: phone
    )

    default_room = find_default_inquiry_room

    inquiry = @tenant.inquiries.create!(
      customer: customer
    )

    property_inquiry = PropertyInquiry.create!(
      room: default_room,
      customer: customer,
      inquiry: inquiry,
      name: name,
      email: email,
      phone: phone,
      message: message,
      media_type: @portal_type,
      origin_type: origin_type,
      channel: :email
    )

    Rails.logger.info "[PortalInquiryMailbox] Created inquiry ##{property_inquiry.id} " \
                      "(portal: #{@portal_type}) for tenant #{@tenant.subdomain}"
  rescue ActiveRecord::RecordInvalid => e
    Rails.logger.error "[PortalInquiryMailbox] Failed to create inquiry: #{e.message}"
    bounced!
  end

  private

  def find_tenant
    recipient = mail.to&.first
    unless recipient
      Rails.logger.warn "[PortalInquiryMailbox] No recipient address found"
      bounced!
      return
    end

    # {subdomain}-{store_code}-inquiry-{portal}@
    match = recipient.match(/^(.+?)-([a-zA-Z0-9]{1,6})-inquiry-(?:suumo|athome|homes|lifull)@/i)
    if match
      subdomain = match[1]
      store_code = match[2]
    else
      # フォールバック: {subdomain}-inquiry-{portal}@ (店舗コードなし)
      match = recipient.match(/^(.+?)-inquiry-(?:suumo|athome|homes|lifull)@/i)
      subdomain = match&.[](1)
      store_code = nil
    end

    unless subdomain
      Rails.logger.warn "[PortalInquiryMailbox] Invalid address format: #{recipient}"
      bounced!
      return
    end

    @tenant = Tenant.find_by(subdomain: subdomain, status: :active)
    unless @tenant
      Rails.logger.warn "[PortalInquiryMailbox] Tenant not found for subdomain: #{subdomain}"
      bounced!
      return
    end

    # 店舗コードが指定されている場合はそのstoreを取得、なければテナントの最初の店舗にフォールバック
    if store_code.present?
      @store = @tenant.stores.find_by("LOWER(code) = ?", store_code.downcase)
      Rails.logger.warn "[PortalInquiryMailbox] Store not found for code: #{store_code}" unless @store
    end
    @store ||= @tenant.stores.first
  end

  def detect_portal
    recipient = mail.to&.first
    portal_name = recipient&.match(/-inquiry-(suumo|athome|homes|lifull)@/i)&.[](1)&.downcase&.to_sym

    unless portal_name && PORTAL_PARSERS.key?(portal_name)
      Rails.logger.warn "[PortalInquiryMailbox] Unsupported portal: #{portal_name}"
      bounced!
      return
    end

    @portal_type = portal_name
    @parser = PORTAL_PARSERS[@portal_type].new
  end

  def check_spam_score
    spam_score = mail["X-Spam-Score"]&.to_s&.to_f || 0
    if spam_score > SPAM_SCORE_THRESHOLD
      Rails.logger.warn "[PortalInquiryMailbox] Rejected spam email (score: #{spam_score}) from #{sender_email}"
      bounced!
    end
  end

  def check_rate_limit
    return unless sender_email.present?

    recent_count = PropertyInquiry
      .where(email: sender_email)
      .where(channel: :email)
      .where("created_at > ?", RATE_LIMIT_PERIOD.ago)
      .count

    if recent_count >= RATE_LIMIT_COUNT
      Rails.logger.warn "[PortalInquiryMailbox] Rate limit exceeded for: #{sender_email}"
      bounced!
    end
  end

  def find_default_inquiry_room
    room_id = @tenant.settings&.dig("default_inquiry_room_id")
    return Room.find(room_id) if room_id.present?

    room = Room.joins(:building).where(buildings: { tenant_id: @tenant.id }).first
    unless room
      Rails.logger.error "[PortalInquiryMailbox] No room available for tenant: #{@tenant.subdomain}"
      bounced!
      raise ActiveRecord::RecordNotFound, "No default inquiry room configured"
    end
    room
  end

  def sender_email
    @sender_email ||= mail.from&.first&.downcase
  end

  def sender_name
    @sender_name ||= begin
      from_field = mail[:from]
      name = from_field&.display_names&.first
      name.presence || sender_email&.split("@")&.first || "Unknown"
    end
  end

  def fallback_name
    sender_name.presence || "不明（#{@portal_type}メール）"
  end

  def sanitized_body
    body = mail.text_part&.decoded || mail.decoded || ""
    body = ActionController::Base.helpers.strip_tags(body)
    body.truncate(10_000)
  end
end
