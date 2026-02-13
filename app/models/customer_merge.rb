class CustomerMerge < ApplicationRecord
  belongs_to :tenant
  belongs_to :primary_customer, class_name: "Customer"
  belongs_to :performed_by, class_name: "User"
  belongs_to :undone_by, class_name: "User", optional: true

  enum :status, { completed: 0, undone: 1 }, prefix: true

  validates :secondary_snapshot, presence: true
  validates :primary_snapshot, presence: true

  scope :recent, -> { order(created_at: :desc) }
end
