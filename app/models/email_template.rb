class EmailTemplate < ApplicationRecord
  belongs_to :tenant

  validates :name, :subject, :body, presence: true
  validates :body_format, inclusion: { in: %w[text html] }

  scope :kept, -> { where(discarded_at: nil) }
  scope :ordered, -> { order(:position, :name) }
end
