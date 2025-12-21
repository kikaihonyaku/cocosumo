class Building < ApplicationRecord
  include Discard::Model

  # Associations
  belongs_to :tenant
  belongs_to :store, optional: true
  has_many :rooms, dependent: :destroy
  has_many :owners, dependent: :destroy
  has_many :building_photos, dependent: :destroy
  has_many :building_routes, dependent: :destroy
  has_one_attached :exterior_image
  has_many_attached :photos

  # Geocoding - Set location from address
  geocoded_by :address do |obj, results|
    if (result = results.first)
      obj.location = "POINT(#{result.longitude} #{result.latitude})"
    end
  end
  after_validation :geocode, if: ->(obj) { obj.new_record? && obj.address.present? && obj.location.blank? }

  # Validations
  validates :name, presence: true
  validates :address, presence: true
  validates :building_type, presence: true

  # Enum for building types
  enum :building_type, {
    apartment: 'apartment',
    mansion: 'mansion',
    house: 'house',
    office: 'office'
  }, prefix: true

  # === GIS Scopes ===

  # Search buildings within rectangular bounds
  # @param sw_lat [Float] Southwest latitude
  # @param sw_lng [Float] Southwest longitude
  # @param ne_lat [Float] Northeast latitude
  # @param ne_lng [Float] Northeast longitude
  scope :within_bounds, ->(sw_lat, sw_lng, ne_lat, ne_lng) {
    where(
      "ST_Within(location::geometry, ST_MakeEnvelope(?, ?, ?, ?, 4326))",
      sw_lng, sw_lat, ne_lng, ne_lat
    )
  }

  # Search buildings within a polygon
  # @param polygon_wkt [String] WKT format polygon
  scope :within_polygon, ->(polygon_wkt) {
    where(
      "ST_Within(location::geometry, ST_GeomFromText(?, 4326))",
      polygon_wkt
    )
  }

  # Search buildings within radius from a point (in meters)
  # @param lat [Float] Center latitude
  # @param lng [Float] Center longitude
  # @param radius_meters [Integer] Radius in meters
  scope :within_radius, ->(lat, lng, radius_meters) {
    where(
      "ST_DWithin(location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)",
      lng, lat, radius_meters
    )
  }

  # Order by distance from a point
  # @param lat [Float] Reference latitude
  # @param lng [Float] Reference longitude
  scope :order_by_distance, ->(lat, lng) {
    select("buildings.*, ST_Distance(location, ST_SetSRID(ST_MakePoint(#{lng.to_f}, #{lat.to_f}), 4326)::geography) AS distance_meters")
      .order("distance_meters ASC")
  }

  # Get nearest N buildings
  scope :nearest, ->(lat, lng, limit = 5) {
    order_by_distance(lat, lng).limit(limit)
  }

  # === Instance Methods ===

  # Get latitude (backward compatibility)
  def latitude
    location&.y || read_attribute(:latitude)
  end

  # Get longitude (backward compatibility)
  def longitude
    location&.x || read_attribute(:longitude)
  end

  # Set latitude (backward compatibility)
  def latitude=(val)
    write_attribute(:latitude, val)
    update_location_from_coords
  end

  # Set longitude (backward compatibility)
  def longitude=(val)
    write_attribute(:longitude, val)
    update_location_from_coords
  end

  # Calculate distance to a point (in meters)
  def distance_to(lat, lng)
    return nil unless location

    self.class.where(id: id)
      .select("ST_Distance(location, ST_SetSRID(ST_MakePoint(#{lng.to_f}, #{lat.to_f}), 4326)::geography) AS dist")
      .first&.attributes&.dig("dist")
  end

  # Get school districts containing this building
  def school_districts
    return SchoolDistrict.none unless location

    SchoolDistrict.containing_point(longitude, latitude)
  end

  # Calculate vacant rooms count
  def vacant_rooms_count
    rooms.where(status: :vacant).count
  end

  # Calculate occupancy rate
  def occupancy_rate
    return 0 if total_units.zero?
    ((total_units - vacant_rooms_count).to_f / total_units * 100).round(1)
  end

  # 総戸数を返す（実際の部屋数）
  def room_cnt
    rooms.count
  end

  # 空室数を返す
  def free_cnt
    vacant_rooms_count
  end

  # 外観写真の枚数を返す
  # includes(:building_photos)でeager loadされている場合はメモリ上でカウント
  def exterior_photo_count
    if building_photos.loaded?
      building_photos.count { |p| p.photo_type == 'exterior' }
    else
      building_photos.where(photo_type: 'exterior').count
    end
  end

  # サムネイル画像のURL（外観写真の1枚目）を返す
  def thumbnail_url
    if building_photos.loaded?
      exterior_photo = building_photos.find { |p| p.photo_type == 'exterior' }
    else
      exterior_photo = building_photos.where(photo_type: 'exterior').first
    end
    exterior_photo&.photo_url
  end

  private

  def update_location_from_coords
    lat = read_attribute(:latitude)
    lng = read_attribute(:longitude)
    if lat.present? && lng.present?
      self.location = "POINT(#{lng} #{lat})"
    end
  end
end
