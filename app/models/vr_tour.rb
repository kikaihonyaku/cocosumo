class VrTour < ApplicationRecord
  # Associations
  belongs_to :room
  has_many :vr_scenes, dependent: :destroy
  has_one_attached :minimap_image

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
end
