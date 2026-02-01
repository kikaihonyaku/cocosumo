class EmailTemplate < ApplicationRecord
  belongs_to :tenant

  validates :name, :subject, :body, presence: true

  scope :kept, -> { where(discarded_at: nil) }
  scope :ordered, -> { order(:position, :name) }
end
