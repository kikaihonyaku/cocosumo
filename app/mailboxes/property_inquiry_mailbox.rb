# frozen_string_literal: true

class PropertyInquiryMailbox < ApplicationMailbox
  # Rate limiting constants
  RATE_LIMIT_COUNT = 5
  RATE_LIMIT_PERIOD = 1.hour
  MAX_MESSAGE_LENGTH = 10_000
  SPAM_SCORE_THRESHOLD = 5.0

  # 送信元ドメインからポータル種別を自動判定するマッピング
  PORTAL_SENDER_DOMAINS = {
    "suumo.jp" => :suumo
    # "athome.co.jp" => :athome,
  }.freeze

  before_processing :check_spam_score
  before_processing :find_tenant
  before_processing :check_rate_limit

  def process
    portal_type = detect_portal_from_sender
    if portal_type
      delegate_to_portal_parser(portal_type)
      return
    end

    customer = Customer.find_or_create_by_contact!(
      tenant: @tenant,
      email: sender_email,
      name: sender_name,
      phone: nil
    )

    default_room = find_default_inquiry_room

    inquiry_record = @tenant.inquiries.create!(
      customer: customer
    )

    property_inquiry = PropertyInquiry.create!(
      room: default_room,
      customer: customer,
      inquiry: inquiry_record,
      name: sender_name,
      email: sender_email,
      message: sanitized_body,
      media_type: :email,
      origin_type: :general_inquiry,
      channel: :email
    )

    Rails.logger.info "[PropertyInquiryMailbox] Created inquiry ##{property_inquiry.id} for tenant #{@tenant.subdomain}"
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

    # 新形式: {subdomain}-s{store_id}-inquiry@ / 旧形式: {subdomain}-inquiry@
    match = recipient.match(/^(.+?)(?:-s(\d+))?-inquiry@/i)
    subdomain = match&.[](1)
    store_id = match&.[](2)&.to_i

    unless subdomain
      Rails.logger.warn "[PropertyInquiryMailbox] Invalid address format: #{recipient}"
      bounced!
      return
    end

    @tenant = Tenant.find_by(subdomain: subdomain, status: :active)
    unless @tenant
      Rails.logger.warn "[PropertyInquiryMailbox] Tenant not found for subdomain: #{subdomain}"
      bounced!
      return
    end

    # store_idが指定されている場合はそのstoreを取得、なければテナントの最初の店舗にフォールバック
    if store_id.present? && store_id > 0
      @store = @tenant.stores.find_by(id: store_id)
      Rails.logger.warn "[PropertyInquiryMailbox] Store not found: #{store_id}" unless @store
    end
    @store ||= @tenant.stores.first
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

  def detect_portal_from_sender
    domain = sender_email&.split("@")&.last
    PORTAL_SENDER_DOMAINS[domain]
  end

  def delegate_to_portal_parser(portal_type)
    parser_class = PortalInquiryMailbox::PORTAL_PARSERS[portal_type]
    unless parser_class
      Rails.logger.warn "[PropertyInquiryMailbox] No parser for portal: #{portal_type}"
      return
    end

    parsed = parser_class.new.parse(mail)

    name = parsed[:name] || sender_name
    email = parsed[:email] || sender_email
    phone = parsed[:phone]
    message = parsed[:message] || sanitized_body
    origin_type = parsed[:origin_type] || :general_inquiry

    customer = Customer.find_or_create_by_contact!(
      tenant: @tenant,
      email: email,
      name: name,
      phone: phone
    )

    default_room = find_default_inquiry_room

    inquiry_record = @tenant.inquiries.create!(
      customer: customer
    )

    property_inquiry = PropertyInquiry.create!(
      room: default_room,
      customer: customer,
      inquiry: inquiry_record,
      name: name,
      email: email,
      phone: phone,
      message: message,
      media_type: portal_type,
      origin_type: origin_type,
      channel: :email
    )

    Rails.logger.info "[PropertyInquiryMailbox] Created portal inquiry ##{property_inquiry.id} " \
                      "(portal: #{portal_type}) for tenant #{@tenant.subdomain}"
  end
end
