class Store < ApplicationRecord
  belongs_to :tenant
  has_many :buildings, dependent: :nullify

  validates :name, presence: true

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

  private

  def update_location_from_coords
    lat = @pending_latitude || latitude
    lng = @pending_longitude || longitude
    if lat.present? && lng.present?
      self.location = "POINT(#{lng} #{lat})"
    end
  end
end
