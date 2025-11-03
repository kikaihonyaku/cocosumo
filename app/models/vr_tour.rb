class VrTour < ApplicationRecord
  # Associations
  belongs_to :room
  has_many :vr_scenes, dependent: :destroy
  has_one_attached :minimap_image
  belongs_to :minimap_room_photo, class_name: 'RoomPhoto', optional: true

  # Validations
  validates :title, presence: true

  # Serialize config as JSON
  serialize :config, coder: JSON

  # Enum for status
  enum :status, { draft: 0, published: 1, archived: 2 }, default: :draft

  # Generate embed code
  def embed_code(width: 800, height: 600)
    "<iframe src=\"#{embed_url}\" width=\"#{width}\" height=\"#{height}\" frameborder=\"0\" allowfullscreen></iframe>"
  end

  # Embed URL
  def embed_url
    Rails.application.routes.url_helpers.embed_vr_tour_url(self)
  end

  # Get initial scene
  def initial_scene
    if config&.dig('initial_scene_id')
      vr_scenes.find_by(id: config['initial_scene_id'])
    else
      vr_scenes.first
    end
  end

  # Get minimap image URL
  def minimap_image_url
    # 既存の部屋写真を使用する場合は、その写真URLを優先
    if minimap_room_photo.present?
      return minimap_room_photo.photo_url
    end

    # アップロードされたミニマップ画像を使用
    return nil unless minimap_image.attached?

    if Rails.env.production?
      minimap_image.url
    else
      Rails.application.routes.url_helpers.rails_blob_path(minimap_image, only_path: true)
    end
  end

  # Get scenes count
  def scenes_count
    vr_scenes.count
  end

  # Get first scene photo URL (prioritize scene photo over minimap)
  def thumbnail_url
    # シーンの写真を優先
    first_scene = vr_scenes.first
    if first_scene&.photo_url
      first_scene.photo_url
    else
      minimap_image_url
    end
  end
end
