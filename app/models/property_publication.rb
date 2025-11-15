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

  # Publish the property publication
  def publish!
    update!(status: :published, published_at: Time.current)
  end

  # Unpublish the property publication
  def unpublish!
    update!(status: :draft, published_at: nil)
  end

  # Get public URL
  def public_url
    return nil unless published?
    # Use path instead of url to avoid host requirement
    "/property/#{publication_id}"
  rescue => e
    Rails.logger.error "Error generating public_url: #{e.message}"
    nil
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
