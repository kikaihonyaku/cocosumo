class PropertyInquiry < ApplicationRecord
  # Temporary attribute for tracking who made the change
  attr_accessor :changed_by

  # Associations
  belongs_to :room
  belongs_to :property_publication, optional: true
  belongs_to :customer
  belongs_to :inquiry
  belongs_to :assigned_user, class_name: "User", optional: true
  has_many :customer_accesses
  has_many :customer_activities

  # Callbacks for automatic activity recording
  after_create :record_inquiry_activity
  after_update :record_status_change_activity, if: :saved_change_to_status?
  before_save :track_deal_status_change
  after_update :record_deal_status_change_activity, if: :saved_change_to_deal_status?
  after_save :sync_assigned_user_to_inquiry
  after_save :sync_inquiry_status

  # Enums
  enum :media_type, {
    suumo: 0,
    athome: 1,
    homes: 2,
    lifull: 3,
    own_website: 10,
    line: 11,
    phone: 12,
    walk_in: 13,
    referral: 14,
    email: 15,
    other_media: 99
  }, prefix: true

  enum :origin_type, {
    document_request: 0,
    visit_reservation: 1,
    general_inquiry: 2,
    staff_proposal: 10,
    other_origin: 99
  }, prefix: true

  enum :status, {
    pending: 0,
    in_progress: 1,
    completed: 2
  }, prefix: true

  enum :channel, { web_form: 0, line: 1, email: 2 }, prefix: true

  enum :deal_status, {
    new_inquiry: 0,
    contacting: 1,
    viewing_scheduled: 2,
    viewing_done: 3,
    application: 4,
    contracted: 5,
    lost: 6
  }, default: :new_inquiry, prefix: :deal

  enum :priority, {
    low: 0,
    normal: 1,
    high: 2,
    urgent: 3
  }, default: :normal, prefix: :priority

  # Validations
  validates :name, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true

  # Delegations
  delegate :building, to: :room
  delegate :tenant, to: :building

  # Scopes
  scope :recent, -> { order(created_at: :desc) }
  scope :active, -> { where.not(status: :completed) }
  scope :active_deals, -> { where.not(deal_status: [ :contracted, :lost ]) }
  scope :by_deal_status, ->(status) { where(deal_status: status) }
  scope :by_priority, ->(priority) { where(priority: priority) }

  # Get formatted created time
  def formatted_created_at
    created_at.strftime("%Y年%m月%d日 %H:%M")
  end

  # Get formatted replied time
  def formatted_replied_at
    replied_at&.strftime("%Y年%m月%d日 %H:%M")
  end

  # ラベルメソッド
  def media_type_label
    I18n.t("activerecord.enums.property_inquiry.media_type.#{media_type}", default: media_type)
  end

  def origin_type_label
    I18n.t("activerecord.enums.property_inquiry.origin_type.#{origin_type}", default: origin_type)
  end

  def status_label
    I18n.t("activerecord.enums.property_inquiry.status.#{status}", default: status)
  end

  # ステータスラベル
  def deal_status_label
    {
      "new_inquiry" => "新規反響",
      "contacting" => "対応中",
      "viewing_scheduled" => "内見予約",
      "viewing_done" => "内見済",
      "application" => "申込",
      "contracted" => "成約",
      "lost" => "失注"
    }[deal_status] || deal_status
  end

  # 優先度ラベル
  def priority_label
    {
      "low" => "低",
      "normal" => "通常",
      "high" => "高",
      "urgent" => "緊急"
    }[priority] || priority
  end

  # ステータス変更（履歴付き）
  def change_deal_status!(new_status, user: nil, reason: nil)
    old_status = deal_status
    self.deal_status = new_status
    self.lost_reason = reason if new_status.to_s == "lost"
    self.changed_by = user
    save!
  end

  # 物件タイトル（room経由で取得）
  def property_title
    if property_publication.present?
      property_publication.title
    else
      "#{room.building.name} #{room.room_number}"
    end
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

  # 問い合わせ作成時のアクティビティ記録
  def record_inquiry_activity
    customer_activities.create!(
      customer: customer,
      inquiry: inquiry,
      user: changed_by,
      activity_type: :inquiry,
      direction: :inbound,
      subject: "#{origin_type_label}（#{media_type_label}）",
      content: message.presence
    )
  end

  # ステータス変更時のアクティビティ記録
  def record_status_change_activity
    old_status, new_status = saved_change_to_status
    old_label = I18n.t("activerecord.enums.property_inquiry.status.#{old_status}", default: old_status)
    new_label = status_label

    customer_activities.create!(
      customer: customer,
      inquiry: inquiry,
      user: changed_by,
      activity_type: :status_change,
      direction: :internal,
      subject: "案件ステータスを「#{new_label}」に変更",
      content: "#{property_title}：#{old_label} → #{new_label}"
    )
  end

  def track_deal_status_change
    if deal_status_changed?
      self.deal_status_changed_at = Time.current
    end
  end

  COMPLETED_DEAL_STATUSES = %w[contracted lost].freeze

  def sync_assigned_user_to_inquiry
    if assigned_user_id.present? && inquiry.assigned_user_id.nil?
      inquiry.update_column(:assigned_user_id, assigned_user_id)
    end
  end

  def sync_inquiry_status
    return if inquiry.on_hold?

    all_pis = inquiry.property_inquiries.reload
    all_completed = all_pis.any? && all_pis.all? { |pi| COMPLETED_DEAL_STATUSES.include?(pi.deal_status) }

    if all_completed && !inquiry.closed?
      inquiry.update_column(:status, Inquiry.statuses[:closed])
    elsif !all_completed && inquiry.closed?
      inquiry.update_column(:status, Inquiry.statuses[:active])
    end
  end

  def record_deal_status_change_activity
    customer_activities.create!(
      customer: customer,
      inquiry: inquiry,
      user: changed_by,
      activity_type: :status_change,
      direction: :internal,
      subject: "商談ステータスを「#{deal_status_label}」に変更",
      content: lost_reason.present? ? "#{property_title} - 理由: #{lost_reason}" : property_title
    )
  end
end
