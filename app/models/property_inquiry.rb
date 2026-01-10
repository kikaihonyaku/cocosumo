class PropertyInquiry < ApplicationRecord
  # Associations
  belongs_to :property_publication
  belongs_to :customer, optional: true
  has_many :customer_accesses

  # Enums
  enum :source_type, { public_page: 0, customer_limited: 1 }, prefix: true
  enum :status, { unreplied: 0, replied: 1, no_reply_needed: 2 }, prefix: true
  enum :channel, { web_form: 0, line: 1 }, prefix: true

  # Validations
  validates :name, presence: true
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }, if: -> { channel_web_form? }
  validates :message, presence: true

  # Callbacks
  before_create :link_or_create_customer

  # Scopes
  scope :recent, -> { order(created_at: :desc) }

  # Get formatted created time
  def formatted_created_at
    created_at.strftime('%Y年%m月%d日 %H:%M')
  end

  # Get formatted replied time
  def formatted_replied_at
    replied_at&.strftime('%Y年%m月%d日 %H:%M')
  end

  # テナントを取得
  def tenant
    property_publication&.room&.building&.tenant
  end

  # 顧客の他の問い合わせ
  def other_inquiries_from_same_customer
    return [] unless customer.present?
    customer.property_inquiries.where.not(id: id)
  end

  # 同一顧客の他物件問い合わせ件数
  def other_inquiry_count
    other_inquiries_from_same_customer.count
  end

  private

  def link_or_create_customer
    return if customer.present?
    return unless email.present?

    tenant_obj = tenant
    return unless tenant_obj

    self.customer = Customer.find_or_initialize_by_contact(
      tenant: tenant_obj,
      email: email,
      name: name,
      phone: phone
    )
    customer.save! if customer.new_record?
  end
end
