class RoomPhoto < ApplicationRecord
  # Associations
  belongs_to :room
  has_one_attached :photo
  has_many :ai_generated_images, foreign_key: :room_photo_id, dependent: :destroy

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

  # Check if this photo has any dependencies that prevent it from being moved
  def has_dependencies?
    dependency_names.any?
  end

  # Get names of all dependencies
  def dependency_names
    names = []
    names << 'AI生成画像' if AiGeneratedImage.exists?(room_photo_id: id)
    names << 'VRシーン' if VrScene.exists?(room_photo_id: id)
    names << 'バーチャルステージング' if VirtualStaging.where(before_photo_id: id).or(VirtualStaging.where(after_photo_id: id)).exists?
    names << '物件公開ページ' if PropertyPublicationPhoto.exists?(room_photo_id: id)
    names << 'VRツアーミニマップ' if VrTour.exists?(minimap_room_photo_id: id)
    names
  end

  def photo_url
    return nil unless photo.attached?

    # サービス名で判断（クラス定数を使わない）
    service_name = photo.service.class.name

    if service_name.include?('Disk')
      # Diskサービスの場合は相対パスを返す
      Rails.application.routes.url_helpers.rails_blob_path(photo, only_path: true)
    else
      # R2などのクラウドストレージの場合はURLを返す
      photo.url
    end
  rescue ArgumentError => e
    # URL生成エラーの場合はログに記録してnilを返す
    Rails.logger.error("Failed to generate photo URL for photo #{id}: #{e.message}")
    nil
  rescue StandardError => e
    # その他のエラーもキャッチ
    Rails.logger.error("Unexpected error generating photo URL for photo #{id}: #{e.class} - #{e.message}")
    nil
  end
end
