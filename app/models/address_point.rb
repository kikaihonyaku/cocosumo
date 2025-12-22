class AddressPoint < ApplicationRecord
  belongs_to :map_layer

  validates :latitude, presence: true, numericality: { greater_than_or_equal_to: -90, less_than_or_equal_to: 90 }
  validates :longitude, presence: true, numericality: { greater_than_or_equal_to: -180, less_than_or_equal_to: 180 }

  # 保存前にlocationを設定
  before_save :set_location

  # 表示用のフルアドレスを生成
  def full_address
    [prefecture, city, district, block_number].compact.reject(&:blank?).join('')
  end

  # 表示用の名前（地番）
  def display_name
    if district.present? && block_number.present?
      "#{district}#{block_number}"
    elsif district.present?
      district
    else
      block_number || "#{latitude}, #{longitude}"
    end
  end

  # GeoJSON Feature形式で出力
  def to_geojson_feature
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [longitude.to_f, latitude.to_f]
      },
      properties: {
        id: id,
        name: display_name,
        full_address: full_address,
        prefecture: prefecture,
        city: city,
        district: district,
        block_number: block_number,
        representative: representative
      }
    }
  end

  # FeatureCollection形式で出力（クラスメソッド）
  def self.to_geojson_feature_collection(records)
    {
      type: 'FeatureCollection',
      features: records.map(&:to_geojson_feature)
    }
  end

  private

  def set_location
    if latitude.present? && longitude.present?
      self.location = "POINT(#{longitude} #{latitude})"
    end
  end
end
