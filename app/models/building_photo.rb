class BuildingPhoto < ApplicationRecord
  # Associations
  belongs_to :building
  has_one_attached :photo

  # Validations
  validates :photo_type, presence: true
  validates :display_order, numericality: { only_integer: true }, allow_nil: true

  # Enum for photo types
  enum :photo_type, {
    exterior: 'exterior',
    entrance: 'entrance',
    common_area: 'common_area',
    parking: 'parking',
    surroundings: 'surroundings',
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

  def url
    photo_url
  end

  def image_url
    photo_url
  end

  def thumbnail_url
    photo_url
  end
end
