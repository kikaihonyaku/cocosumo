class PropertyInquiry < ApplicationRecord
  # Associations
  belongs_to :property_publication

  # Enums
  enum :source_type, { public_page: 0, customer_limited: 1 }, prefix: true
  enum :status, { unreplied: 0, replied: 1, no_reply_needed: 2 }, prefix: true

  # Validations
  validates :name, presence: true
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :message, presence: true

  # Scopes
  scope :recent, -> { order(created_at: :desc) }

  # Get formatted created time
  def formatted_created_at
    created_at.strftime('%Y年%m月%d日 %H:%M')
  end

  # Get formatted replied time
  def formatted_replied_at
    replied_at&.strftime('%Y年%m月%d日 %H:%M')
  end
end
