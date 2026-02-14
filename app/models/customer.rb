class Customer < ApplicationRecord
  # Associations
  belongs_to :tenant
  has_many :inquiries, dependent: :destroy
  has_many :property_inquiries, dependent: :nullify
  has_many :customer_accesses, dependent: :nullify
  has_many :customer_activities, dependent: :destroy
  has_many :inquired_publications, through: :property_inquiries, source: :property_publication
  has_many :email_drafts, dependent: :destroy
  has_many :merge_dismissals_as_customer1, class_name: "CustomerMergeDismissal",
           foreign_key: :customer1_id, dependent: :destroy
  has_many :merge_dismissals_as_customer2, class_name: "CustomerMergeDismissal",
           foreign_key: :customer2_id, dependent: :destroy

  # Enums
  enum :status, { active: 0, archived: 1 }, default: :active

  # Validations
  validates :name, presence: true
  validates :email, uniqueness: { scope: :tenant_id, allow_blank: true }
  validates :line_user_id, uniqueness: { scope: :tenant_id, allow_blank: true }
  validate :email_or_line_required

  # Scopes
  scope :by_email, ->(email) { where(email: email) }
  scope :by_line, ->(line_id) { where(line_user_id: line_id) }
  scope :recent, -> { order(created_at: :desc) }
  scope :with_inquiries, -> { joins(:property_inquiries).distinct }

  # 顧客を検索または初期化（保存はしない）
  def self.find_or_initialize_by_contact(tenant:, email: nil, line_user_id: nil, name:, phone: nil)
    customer = nil
    customer = tenant.customers.find_by(email: email) if email.present?
    customer ||= tenant.customers.find_by(line_user_id: line_user_id) if line_user_id.present?
    customer || tenant.customers.new(email: email, line_user_id: line_user_id, name: name, phone: phone)
  end

  # 顧客を検索または作成（レースコンディション対応）
  def self.find_or_create_by_contact!(tenant:, email: nil, line_user_id: nil, name:, phone: nil)
    customer = find_or_initialize_by_contact(
      tenant: tenant,
      email: email,
      line_user_id: line_user_id,
      name: name,
      phone: phone
    )
    return customer if customer.persisted?

    customer.save!
    customer
  rescue ActiveRecord::RecordNotUnique
    tenant.customers.find_by(email: email) ||
      tenant.customers.find_by(line_user_id: line_user_id) ||
      raise
  end

  # 問い合わせ件数
  def inquiry_count
    property_inquiries.count
  end

  # 問い合わせ物件一覧
  def inquired_property_titles
    inquired_publications.pluck(:title).uniq
  end

  # 最新問い合わせ日時
  def last_inquiry_at
    property_inquiries.maximum(:created_at)
  end

  # 顧客アクセス発行数
  def access_count
    customer_accesses.count
  end

  # 連絡先情報のサマリー
  def contact_summary
    parts = []
    parts << email if email.present?
    parts << phone if phone.present?
    parts << "LINE連携済み" if line_user_id.present?
    parts.join(" / ")
  end

  # 最新PropertyInquiryのdeal_statusを返す
  def current_deal_status
    property_inquiries.order(created_at: :desc).first&.deal_status
  end

  # 対応履歴を追加
  def add_activity!(activity_type:, inquiry: nil, user: nil, direction: :internal, subject: nil, content: nil, **options)
    customer_activities.create!(
      inquiry: inquiry,
      user: user,
      activity_type: activity_type,
      direction: direction,
      subject: subject,
      content: content,
      **options
    )
  end

  private

  def email_or_line_required
    if email.blank? && line_user_id.blank?
      errors.add(:base, "メールアドレスまたはLINE IDが必要です")
    end
  end
end
