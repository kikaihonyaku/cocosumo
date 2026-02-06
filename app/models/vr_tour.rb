class VrTour < ApplicationRecord
  include UniqueIdGeneration

  # ID衝突時のリトライ
  retry_on_unique_violation :public_id

  # Associations
  belongs_to :room
  has_many :vr_scenes, dependent: :destroy
  has_many :property_publication_vr_tours, dependent: :destroy
  has_one_attached :minimap_image
  belongs_to :minimap_room_photo, class_name: 'RoomPhoto', optional: true
  belongs_to :created_by, class_name: 'User', optional: true
  belongs_to :updated_by, class_name: 'User', optional: true

  # Validations
  validates :title, presence: true
  validates :public_id, presence: true, uniqueness: true

  # Callbacks
  before_validation :generate_public_id, on: :create

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

  # 公開URL生成
  def public_url
    return nil unless published?
    base_url = Thread.current[:request_base_url] || tenant_base_url
    "#{base_url}/vr/#{public_id}"
  end

  # テナント情報
  def tenant
    room&.building&.tenant
  end

  # テナント対応のベースURL（リクエストコンテキストがない場合のフォールバック）
  def tenant_base_url
    base_domain = ENV.fetch('APP_BASE_DOMAIN', 'cocosumo.space')
    protocol = Rails.env.production? ? 'https' : (ENV['APP_PROTOCOL'] || 'http')
    subdomain = tenant&.subdomain

    if subdomain.present?
      "#{protocol}://#{subdomain}.#{base_domain}"
    else
      "#{protocol}://#{base_domain}"
    end
  end

  private

  def generate_public_id
    return if public_id.present?

    # DBユニーク制約があるため、衝突時はActiveRecord::RecordNotUniqueで
    # リトライされる。ここではベストエフォートでユニーク性を確認
    self.public_id = SecureRandom.alphanumeric(12).downcase
  end
end
