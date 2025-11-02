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
    living: 'living',
    kitchen: 'kitchen',
    bathroom: 'bathroom',
    floor_plan: 'floor_plan',
    exterior: 'exterior',
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
end
