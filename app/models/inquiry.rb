class Inquiry < ApplicationRecord
  # Associations
  belongs_to :tenant
  belongs_to :customer
  belongs_to :assigned_user, class_name: "User", optional: true
  has_many :property_inquiries, dependent: :destroy
  has_many :rooms, through: :property_inquiries
  has_many :customer_activities, dependent: :destroy
  has_many :customer_accesses, dependent: :nullify

  # Enums
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

  # Callbacks
  before_save :track_deal_status_change

  # Scopes
  scope :recent, -> { order(created_at: :desc) }
  scope :active_deals, -> { where.not(deal_status: [ :contracted, :lost ]) }
  scope :by_deal_status, ->(status) { where(deal_status: status) }
  scope :by_priority, ->(priority) { where(priority: priority) }

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
    save!

    customer_activities.create!(
      customer: customer,
      user: user,
      activity_type: :status_change,
      direction: :internal,
      subject: "#{deal_status_label}に変更",
      content: reason.present? ? "理由: #{reason}" : nil
    )
  end

  private

  def track_deal_status_change
    if deal_status_changed?
      self.deal_status_changed_at = Time.current
    end
  end
end
