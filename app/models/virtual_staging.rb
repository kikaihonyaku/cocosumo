class VirtualStaging < ApplicationRecord
  include UniqueIdGeneration

  # ID衝突時のリトライ
  retry_on_unique_violation :public_id

  belongs_to :room
  belongs_to :before_photo, class_name: 'RoomPhoto', foreign_key: :before_photo_id
  belongs_to :after_photo, class_name: 'RoomPhoto', foreign_key: :after_photo_id
  belongs_to :created_by, class_name: 'User', optional: true
  belongs_to :updated_by, class_name: 'User', optional: true
  has_many :variations, class_name: 'VirtualStagingVariation', dependent: :destroy
  has_many :property_publication_virtual_stagings, dependent: :destroy

  # ステータス管理
  enum :status, { draft: 0, published: 1 }, default: :draft

  # バリデーション
  validates :title, presence: true
  validates :before_photo_id, presence: true
  validates :after_photo_id, presence: true
  validates :public_id, presence: true, uniqueness: true

  # コールバック
  before_validation :generate_public_id, on: :create

  # スコープ
  scope :published, -> { where(status: :published) }
  scope :draft, -> { where(status: :draft) }

  # Before画像のURL取得
  def before_photo_url
    before_photo&.photo_url
  end

  # After画像のURL取得
  def after_photo_url
    after_photo&.photo_url
  end

  # サムネイル画像（Before画像を使用）
  def thumbnail_url
    before_photo_url
  end

  # 公開URL生成
  def public_url
    return nil unless published?
    base_url = Thread.current[:request_base_url] || tenant_base_url
    "#{base_url}/virtual-staging/#{public_id}"
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
