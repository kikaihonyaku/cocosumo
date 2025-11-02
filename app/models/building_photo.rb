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

    # サービスの種類に応じて適切なURLを返す
    if photo.service.is_a?(ActiveStorage::Service::DiskService)
      # Diskサービスの場合は相対パスを返す
      Rails.application.routes.url_helpers.rails_blob_path(photo, only_path: true)
    else
      # R2などのクラウドストレージの場合はURLを返す
      photo.url
    end
  rescue ArgumentError => e
    # URL生成エラーの場合はログに記録してnilを返す
    Rails.logger.error("Failed to generate photo URL: #{e.message}")
    nil
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
