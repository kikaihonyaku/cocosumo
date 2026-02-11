class EmailDraft < ApplicationRecord
  belongs_to :tenant
  belongs_to :user
  belongs_to :customer
  belongs_to :inquiry, optional: true

  has_many_attached :draft_attachments

  validates :body_format, inclusion: { in: %w[text html] }

  scope :recent, -> { order(updated_at: :desc) }
end
