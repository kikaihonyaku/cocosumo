class SchoolDistrict < ApplicationRecord
  belongs_to :map_layer, optional: true

  # バリデーション
  validates :name, presence: true
  validates :school_name, presence: true
  validates :prefecture, presence: true
  validates :geometry, presence: true

  # スコープ
  scope :by_prefecture, ->(prefecture) { where(prefecture: prefecture) }
  scope :by_city, ->(city) { where(city: city) }
  scope :elementary_schools, -> { where(school_type: '小学校') }
  scope :junior_high_schools, -> { where(school_type: '中学校') }

  # GeoJSON形式で返す
  def to_geojson_feature
    {
      type: 'Feature',
      geometry: geometry,
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
end
