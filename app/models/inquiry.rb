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
end
