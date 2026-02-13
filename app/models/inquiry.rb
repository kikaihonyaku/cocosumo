class Inquiry < ApplicationRecord
  # Temporary attribute for tracking who made the change
  attr_accessor :changed_by

  # Associations
  belongs_to :tenant
  belongs_to :customer
  belongs_to :assigned_user, class_name: "User", optional: true
  has_many :property_inquiries, dependent: :destroy
  has_many :rooms, through: :property_inquiries
  has_many :customer_activities, dependent: :destroy
  has_many :customer_accesses, dependent: :nullify
  has_many :inquiry_read_statuses, dependent: :delete_all

  # Callbacks
  after_update :record_status_change_activity, if: :saved_change_to_status?
  after_update :record_assigned_user_change_activity, if: :saved_change_to_assigned_user_id?

  # Enums
  enum :status, {
    active: 0,
    on_hold: 1,
    closed: 2
  }, default: :active

  # Scopes
  scope :recent, -> { order(created_at: :desc) }

  # ステータスラベル
  def status_label
    {
      "active" => "アクティブ",
      "on_hold" => "保留中",
      "closed" => "クローズ"
    }[status] || status
  end

  private

  # ステータス変更時のアクティビティ記録
  def record_status_change_activity
    old_status, _new_status = saved_change_to_status
    old_label = { "active" => "アクティブ", "on_hold" => "保留中", "closed" => "クローズ" }[old_status] || old_status

    customer_activities.create!(
      customer: customer,
      user: changed_by,
      activity_type: :status_change,
      direction: :internal,
      subject: "案件ステータスを「#{status_label}」に変更",
      content: "#{old_label} → #{status_label}"
    )
  end

  # 主担当者変更時のアクティビティ記録
  def record_assigned_user_change_activity
    old_user_id, new_user_id = saved_change_to_assigned_user_id
    old_user = User.find_by(id: old_user_id)
    new_user = User.find_by(id: new_user_id)

    old_name = old_user&.name || "未設定"
    new_name = new_user&.name || "未設定"

    customer_activities.create!(
      customer: customer,
      user: changed_by,
      activity_type: :assigned_user_change,
      direction: :internal,
      subject: "案件の主担当者を「#{new_name}」に変更",
      content: "#{old_name} → #{new_name}"
    )
  end
end
