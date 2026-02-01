class Store < ApplicationRecord
  belongs_to :tenant
  has_many :buildings, dependent: :nullify
  has_many :users

  validates :name, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true

  # Geocoding - Set location from address
  geocoded_by :address do |obj, results|
    if (result = results.first)
      obj.location = "POINT(#{result.longitude} #{result.latitude})"
    end
  end
  after_validation :geocode, if: ->(obj) { obj.address.present? && obj.address_changed? && obj.location.blank? }

  scope :ordered, -> { order(:name) }
  scope :with_location, -> { where.not(location: nil) }

  # Get latitude from location
  def latitude
    location&.y
  end

  # Get longitude from location
  def longitude
    location&.x
  end

  # Set latitude
  def latitude=(val)
    @pending_latitude = val
    update_location_from_coords
  end

  # Set longitude
  def longitude=(val)
    @pending_longitude = val
    update_location_from_coords
  end

  # メール問い合わせ用のメールアドレスを返す
  def inquiry_email_address
    "#{tenant.subdomain}-s#{id}-inquiry@inbound.cocosumo.space"
  end

  # ポータル別メール問い合わせ用のメールアドレスを返す
  def portal_inquiry_email_address(portal)
    "#{tenant.subdomain}-s#{id}-inquiry-#{portal}@inbound.cocosumo.space"
  end

  # 全ポータルの問い合わせ用メールアドレスを返す
  def portal_inquiry_email_addresses
    { suumo: portal_inquiry_email_address(:suumo) }
  end

  private

  def update_location_from_coords
    lat = @pending_latitude || latitude
    lng = @pending_longitude || longitude
    if lat.present? && lng.present?
      self.location = "POINT(#{lng} #{lat})"
    end
  end
end
