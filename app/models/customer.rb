class Customer < ApplicationRecord
  # Associations
  belongs_to :tenant
  belongs_to :assigned_user, class_name: 'User', optional: true
  has_many :property_inquiries, dependent: :nullify
  has_many :customer_accesses, dependent: :nullify
  has_many :customer_activities, dependent: :destroy
  has_many :inquired_publications, through: :property_inquiries, source: :property_publication

  # Enums
  enum :status, { active: 0, archived: 1 }, default: :active

  enum :deal_status, {
    new_inquiry: 0,        # 新規反響
    contacting: 1,         # 対応中
    viewing_scheduled: 2,  # 内見予約
    viewing_done: 3,       # 内見済
    application: 4,        # 申込
    contracted: 5,         # 成約
    lost: 6                # 失注
  }, default: :new_inquiry, prefix: :deal

  enum :priority, {
    low: 0,      # 低
    normal: 1,   # 通常
    high: 2,     # 高
    urgent: 3    # 緊急
  }, default: :normal, prefix: :priority

  # Validations
  validates :name, presence: true
  validates :email, uniqueness: { scope: :tenant_id, allow_blank: true }
  validates :line_user_id, uniqueness: { scope: :tenant_id, allow_blank: true }
  validate :email_or_line_required

  # Callbacks
  before_save :track_deal_status_change

  # Scopes
  scope :by_email, ->(email) { where(email: email) }
  scope :by_line, ->(line_id) { where(line_user_id: line_id) }
  scope :recent, -> { order(created_at: :desc) }
  scope :with_inquiries, -> { joins(:property_inquiries).distinct }
  scope :by_deal_status, ->(status) { where(deal_status: status) }
  scope :by_priority, ->(priority) { where(priority: priority) }
  scope :active_deals, -> { where.not(deal_status: [:contracted, :lost]) }

  # 顧客を検索または作成
  def self.find_or_initialize_by_contact(tenant:, email: nil, line_user_id: nil, name:, phone: nil)
    customer = nil
    customer = tenant.customers.find_by(email: email) if email.present?
    customer ||= tenant.customers.find_by(line_user_id: line_user_id) if line_user_id.present?
    customer || tenant.customers.new(email: email, line_user_id: line_user_id, name: name, phone: phone)
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

  # ステータスラベル
  def deal_status_label
    {
      'new_inquiry' => '新規反響',
      'contacting' => '対応中',
      'viewing_scheduled' => '内見予約',
      'viewing_done' => '内見済',
      'application' => '申込',
      'contracted' => '成約',
      'lost' => '失注'
    }[deal_status] || deal_status
  end

  # 優先度ラベル
  def priority_label
    {
      'low' => '低',
      'normal' => '通常',
      'high' => '高',
      'urgent' => '緊急'
    }[priority] || priority
  end

  # ステータス変更（履歴付き）
  def change_deal_status!(new_status, user: nil, reason: nil)
    old_status = deal_status
    self.deal_status = new_status
    self.lost_reason = reason if new_status.to_s == 'lost'
    save!

    # 履歴を記録
    customer_activities.create!(
      user: user,
      activity_type: :status_change,
      direction: :internal,
      subject: "#{deal_status_label}に変更",
      content: reason.present? ? "理由: #{reason}" : nil
    )
  end

  # 対応履歴を追加
  def add_activity!(activity_type:, user: nil, direction: :internal, subject: nil, content: nil, **options)
    customer_activities.create!(
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

  def track_deal_status_change
    if deal_status_changed?
      self.deal_status_changed_at = Time.current
    end
  end
end
