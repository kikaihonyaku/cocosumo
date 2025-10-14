class RoomPhoto < ApplicationRecord
  # Associations
  belongs_to :room
  has_one_attached :photo
  has_many :ai_generated_images, foreign_key: :original_photo_id, dependent: :destroy

  # Validations
  validates :photo_type, presence: true
  validates :display_order, numericality: { only_integer: true }, allow_nil: true

  # Enum for photo types
  enum :photo_type, {
    interior: 'interior',
    exterior: 'exterior',
    bathroom: 'bathroom',
    kitchen: 'kitchen',
    other: 'other'
  }, prefix: true

  # Default scope
  default_scope -> { order(display_order: :asc) }

  # Methods
  def photo_url
    return nil unless photo.attached?

    if Rails.env.production?
      photo.url
    else
      Rails.application.routes.url_helpers.rails_blob_path(photo, only_path: true)
    end
  end
end
