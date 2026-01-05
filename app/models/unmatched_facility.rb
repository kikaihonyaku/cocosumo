class UnmatchedFacility < ApplicationRecord
  belongs_to :room
  belongs_to :mapped_to_facility, class_name: 'Facility', optional: true

  validates :raw_text, presence: true

  enum :status, {
    pending: 'pending',
    mapped: 'mapped',
    ignored: 'ignored'
  }, default: :pending

  scope :pending_review, -> { where(status: :pending).order(occurrence_count: :desc) }
end
