class SchoolDistrict < ApplicationRecord
  belongs_to :map_layer, optional: true

  # バリデーション - geomがある場合はそちらを優先
  validate :geometry_or_geom_present

  # スコープ
  scope :by_prefecture, ->(prefecture) { where(prefecture: prefecture) }
  scope :by_city, ->(city) { where(city: city) }
  scope :elementary_schools, -> { where(school_type: '小学校') }
  scope :junior_high_schools, -> { where(school_type: '中学校') }

  # === GIS Scopes ===

  # Find school districts containing a point
  # @param lng [Float] Longitude
  # @param lat [Float] Latitude
  scope :containing_point, ->(lng, lat) {
    where(
      "ST_Contains(geom::geometry, ST_SetSRID(ST_MakePoint(?, ?), 4326))",
      lng, lat
    )
  }

  # Find school districts intersecting with a polygon
  scope :intersecting_polygon, ->(polygon_wkt) {
    where(
      "ST_Intersects(geom::geometry, ST_GeomFromText(?, 4326))",
      polygon_wkt
    )
  }

  # Find school districts within bounding box
  scope :within_bounds, ->(sw_lat, sw_lng, ne_lat, ne_lng) {
    where(
      "ST_Intersects(geom::geometry, ST_MakeEnvelope(?, ?, ?, ?, 4326))",
      sw_lng, sw_lat, ne_lng, ne_lat
    )
  }

  # === Instance Methods ===

  # GeoJSON形式で返す
  def to_geojson_feature
    {
      type: 'Feature',
      geometry: geom_as_geojson || geometry,
      properties: {
        id: id,
        name: name,
        school_name: school_name,
        school_code: school_code,
        prefecture: prefecture,
        city: city,
        school_type: school_type
      }
    }
  end

  # 複数の学区をGeoJSON FeatureCollectionとして返す
  def self.to_geojson_feature_collection(districts = all)
    {
      type: 'FeatureCollection',
      features: districts.map(&:to_geojson_feature)
    }
  end

  # Convert PostGIS geometry to GeoJSON hash
  def geom_as_geojson
    return nil unless geom

    # RGeoオブジェクトをGeoJSONに変換
    RGeo::GeoJSON.encode(geom)
  end

  # Calculate area in square meters
  def area_sq_meters
    return nil unless geom

    self.class.where(id: id)
      .select("ST_Area(geom::geography) AS area")
      .first&.attributes&.dig("area")
  end

  # Check if a point is within this school district
  def contains_point?(lng, lat)
    return false unless geom

    self.class.where(id: id)
      .where("ST_Contains(geom::geometry, ST_SetSRID(ST_MakePoint(?, ?), 4326))", lng, lat)
      .exists?
  end

  # Get all buildings within this school district
  def buildings(tenant = nil)
    query = Building.where(
      "ST_Contains(?, location::geometry)",
      geom
    )
    query = query.where(tenant: tenant) if tenant
    query
  end

  private

  def geometry_or_geom_present
    if geometry.blank? && geom.blank?
      errors.add(:base, "geometry or geom must be present")
    end
  end
end
