class PropertyPublication < ApplicationRecord
  include Discard::Model

  # Associations
  belongs_to :room
  has_many :property_publication_photos, -> { order(:display_order) }, dependent: :destroy
  has_many :room_photos, through: :property_publication_photos
  has_many :property_publication_vr_tours, -> { order(:display_order) }, dependent: :destroy
  has_many :vr_tours, through: :property_publication_vr_tours
  has_many :property_publication_virtual_stagings, -> { order(:display_order) }, dependent: :destroy
  has_many :virtual_stagings, through: :property_publication_virtual_stagings
  has_many :property_inquiries, dependent: :destroy
  has_many :customer_accesses, dependent: :destroy
  has_many :presentation_accesses, dependent: :destroy
  belongs_to :created_by, class_name: 'User', optional: true
  belongs_to :updated_by, class_name: 'User', optional: true

  # Delegations for easier access
  delegate :building, to: :room
  delegate :tenant, to: :building

  # Validations
  validates :publication_id, presence: true, uniqueness: true
  validates :title, presence: true
  validates :status, presence: true

  # Callbacks
  before_validation :generate_publication_id, on: :create

  # Enum for status
  enum :status, { draft: 0, published: 1 }, default: :draft

  # Enum for template_type
  enum :template_type, { template0: 3, template1: 0, template2: 1, template3: 2 }, default: :template1

  # Scopes
  scope :published, -> { where(status: :published) }
  scope :draft, -> { where(status: :draft) }
  scope :scheduled_to_publish, -> { where.not(scheduled_publish_at: nil) }
  scope :scheduled_to_unpublish, -> { where.not(scheduled_unpublish_at: nil) }
  scope :expired, -> { where('expires_at IS NOT NULL AND expires_at < ?', Time.current) }
  scope :not_expired, -> { where('expires_at IS NULL OR expires_at >= ?', Time.current) }

  # Publish the property publication
  def publish!
    update!(status: :published, published_at: Time.current)
  end

  # Unpublish the property publication
  def unpublish!
    update!(status: :draft, published_at: nil)
  end

  # パスワード保護関連
  def password_protected?
    access_password.present?
  end

  def authenticate_password(password)
    return true unless password_protected?
    access_password == password
  end

  # 有効期限関連
  def expired?
    expires_at.present? && expires_at < Time.current
  end

  def accessible?
    published? && !expired?
  end

  # 詳細アナリティクス更新
  def track_detailed_analytics(device_type: nil, referrer: nil)
    return unless published?

    # デバイス統計
    if device_type.present?
      stats = device_stats || {}
      stats[device_type] = (stats[device_type] || 0) + 1
      update_column(:device_stats, stats)
    end

    # リファラー統計
    if referrer.present?
      stats = referrer_stats || {}
      # リファラーからドメインを抽出
      domain = begin
        URI.parse(referrer).host || 'direct'
      rescue
        'direct'
      end
      stats[domain] = (stats[domain] || 0) + 1
      update_column(:referrer_stats, stats)
    end

    # 時間帯統計
    hour = Time.current.hour.to_s
    stats = hourly_stats || {}
    stats[hour] = (stats[hour] || 0) + 1
    update_column(:hourly_stats, stats)
  end

  # Get public URL
  def public_url
    return nil unless published?
    base_url = Thread.current[:request_base_url] || tenant_base_url
    "#{base_url}/property/#{publication_id}"
  rescue => e
    Rails.logger.error "Error generating public_url: #{e.message}"
    nil
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

  # Get QR code data URL
  def qr_code_data_url(host: nil)
    return nil unless published?
    require 'rqrcode'

    # Build full URL for QR code
    base_url = host || ENV['APP_HOST'] || 'http://localhost:3000'
    full_url = "#{base_url}/property/#{publication_id}"

    qr = RQRCode::QRCode.new(full_url)
    png = qr.as_png(
      bit_depth: 1,
      border_modules: 4,
      color_mode: ChunkyPNG::COLOR_GRAYSCALE,
      color: 'black',
      file: nil,
      fill: 'white',
      module_px_size: 6,
      resize_exactly_to: false,
      resize_gte_to: false,
      size: 240
    )
    "data:image/png;base64,#{Base64.strict_encode64(png.to_s)}"
  rescue => e
    Rails.logger.error "Error generating QR code: #{e.message}"
    nil
  end

  # Get visible fields (with defaults)
  def visible_fields_with_defaults
    defaults = {
      'building_name' => true,
      'address' => true,
      'building_type' => true,
      'structure' => true,
      'built_year' => true,
      'floors' => true,
      'room_number' => true,
      'floor' => true,
      'room_type' => true,
      'area' => true,
      'rent' => true,
      'management_fee' => true,
      'deposit' => true,
      'key_money' => true,
      'facilities' => true,
      'description' => true
    }
    defaults.merge(visible_fields || {})
  end

  # Get the first photo URL for thumbnail
  def thumbnail_url
    property_publication_photos.first&.room_photo&.photo_url
  end

  # Get OGP image URL for social sharing
  # Returns the first photo URL or a default OGP image
  def og_image_url(host: nil)
    return nil unless published?

    first_photo = property_publication_photos.first&.room_photo
    return nil unless first_photo&.photo&.attached?

    base_url = host || ENV['APP_HOST'] || 'http://localhost:3000'

    # 画像URLを取得
    photo_url = first_photo.photo_url
    return nil unless photo_url

    # 絶対URLに変換
    if photo_url.start_with?('http')
      photo_url
    else
      "#{base_url}#{photo_url}"
    end
  end

  # OGP用のメタデータを一括取得
  def og_metadata(host: nil)
    {
      title: title,
      description: catch_copy || pr_text&.gsub(/<[^>]*>/, '')&.truncate(160) || "#{title}の物件情報",
      image: og_image_url(host: host),
      url: public_url ? "#{host || ENV['APP_HOST'] || 'http://localhost:3000'}#{public_url}" : nil,
      type: 'website',
      site_name: 'CoCoスモ',
      locale: 'ja_JP'
    }
  end

  # Duplicate the property publication
  def duplicate
    new_publication = dup
    new_publication.publication_id = nil # Will be regenerated
    new_publication.title = "#{title} (コピー)"
    new_publication.status = :draft
    new_publication.published_at = nil
    new_publication.created_at = nil
    new_publication.updated_at = nil

    ActiveRecord::Base.transaction do
      new_publication.save!

      # Duplicate photos
      property_publication_photos.each do |photo|
        new_publication.property_publication_photos.create!(
          room_photo_id: photo.room_photo_id,
          comment: photo.comment,
          display_order: photo.display_order
        )
      end

      # Duplicate VR tours
      property_publication_vr_tours.each do |vr_tour|
        new_publication.property_publication_vr_tours.create!(
          vr_tour_id: vr_tour.vr_tour_id,
          display_order: vr_tour.display_order
        )
      end

      # Duplicate virtual stagings
      property_publication_virtual_stagings.each do |staging|
        new_publication.property_publication_virtual_stagings.create!(
          virtual_staging_id: staging.virtual_staging_id,
          display_order: staging.display_order
        )
      end
    end

    new_publication
  end

  private

  def generate_publication_id
    return if publication_id.present?

    loop do
      # Generate a random 12-character alphanumeric ID
      self.publication_id = SecureRandom.alphanumeric(12).downcase
      break unless PropertyPublication.exists?(publication_id: publication_id)
    end
  end
end
