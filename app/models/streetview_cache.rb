# frozen_string_literal: true

class StreetviewCache < ApplicationRecord
  # デフォルトのキャッシュ有効期限（30日）
  DEFAULT_EXPIRY_DAYS = 30

  validates :location, presence: true

  # スコープ
  scope :valid, -> { where('expires_at > ?', Time.current) }
  scope :expired, -> { where('expires_at <= ?', Time.current) }

  # 指定位置のキャッシュを検索（近傍検索）
  scope :near_location, ->(lat, lng, radius_meters = 10) {
    factory = RGeo::Geographic.spherical_factory(srid: 4326)
    point = factory.point(lng, lat)
    where("ST_DWithin(location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)",
          lng, lat, radius_meters)
  }

  # キャッシュが有効かどうか
  def valid?
    expires_at.present? && expires_at > Time.current
  end

  # 緯度経度をハッシュで返す
  def latlng
    return nil unless location

    { lat: location.y, lng: location.x }
  end

  # 緯度経度を設定
  def latlng=(coords)
    return unless coords.is_a?(Hash) && coords[:lat] && coords[:lng]

    factory = RGeo::Geographic.spherical_factory(srid: 4326)
    self.location = factory.point(coords[:lng].to_f, coords[:lat].to_f)
  end

  class << self
    # キャッシュを検索（有効なもののみ）
    def find_cached(lat, lng, heading = nil, tolerance = 10)
      cache = near_location(lat, lng, tolerance).valid.first

      # heading が指定されている場合は方向もチェック
      if cache && heading.present? && cache.heading.present?
        heading_diff = (cache.heading - heading).abs
        heading_diff = 360 - heading_diff if heading_diff > 180
        return nil if heading_diff > 30 # 30度以上の差があれば別キャッシュ
      end

      cache
    end

    # メタデータからキャッシュを作成または更新
    def create_or_update_from_metadata(lat, lng, heading, metadata)
      factory = RGeo::Geographic.spherical_factory(srid: 4326)
      location = factory.point(lng, lat)

      cache = find_or_initialize_by(pano_id: metadata['pano_id'])
      cache.assign_attributes(
        location: location,
        heading: heading,
        capture_date: parse_capture_date(metadata['date']),
        expires_at: DEFAULT_EXPIRY_DAYS.days.from_now
      )
      cache.save!
      cache
    end

    # 期限切れキャッシュを削除
    def cleanup_expired
      expired.delete_all
    end

    private

    def parse_capture_date(date_string)
      return nil unless date_string

      # Google Street View APIの日付形式: "2023-05" など
      Date.parse("#{date_string}-01")
    rescue ArgumentError
      nil
    end
  end
end
