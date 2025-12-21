# frozen_string_literal: true

require 'net/http'
require 'json'

class StreetviewService
  METADATA_API_URL = 'https://maps.googleapis.com/maps/api/streetview/metadata'
  IMAGE_API_URL = 'https://maps.googleapis.com/maps/api/streetview'
  METADATA_CACHE_EXPIRY = 24.hours

  class StreetviewError < StandardError; end

  def initialize
    @api_key = ENV['GOOGLE_MAPS_API_KEY'] || ENV['VITE_GOOGLE_MAPS_API_KEY']
  end

  # 指定位置のストリートビューメタデータを取得
  def get_metadata(lat, lng, radius: 50)
    cache_key = "sv_metadata:#{lat.round(5)}:#{lng.round(5)}:#{radius}"
    cached = Rails.cache.read(cache_key)
    return cached if cached

    uri = URI(METADATA_API_URL)
    uri.query = URI.encode_www_form(
      location: "#{lat},#{lng}",
      radius: radius,
      key: @api_key
    )

    response = Net::HTTP.get_response(uri)
    raise StreetviewError, "HTTP error: #{response.code}" unless response.is_a?(Net::HTTPSuccess)

    result = JSON.parse(response.body)

    # 成功時はキャッシュ
    Rails.cache.write(cache_key, result, expires_in: METADATA_CACHE_EXPIRY) if result['status'] == 'OK'

    result
  end

  # ストリートビュー静止画像のURLを生成
  def image_url(lat, lng, heading:, pitch: 0, fov: 90, size: '640x360')
    params = {
      location: "#{lat},#{lng}",
      heading: heading,
      pitch: pitch,
      fov: fov,
      size: size,
      key: @api_key
    }

    "#{IMAGE_API_URL}?#{URI.encode_www_form(params)}"
  end

  # 経路上のストリートビューポイントのメタデータを一括取得
  def get_points_metadata(points)
    points.map do |point|
      metadata = get_metadata(point[:lat], point[:lng])
      next nil unless metadata['status'] == 'OK'

      {
        lat: point[:lat],
        lng: point[:lng],
        heading: point[:heading],
        pano_id: metadata['pano_id'],
        capture_date: metadata['date'],
        location: metadata['location']
      }
    rescue StandardError => e
      Rails.logger.warn("Failed to get streetview metadata for #{point}: #{e.message}")
      nil
    end.compact
  end

  # ストリートビューが利用可能かチェック
  def available?(lat, lng, radius: 50)
    metadata = get_metadata(lat, lng, radius: radius)
    metadata['status'] == 'OK'
  rescue StandardError
    false
  end

  # キャッシュを作成または更新
  def cache_point(lat, lng, heading)
    metadata = get_metadata(lat, lng)
    return nil unless metadata['status'] == 'OK'

    StreetviewCache.create_or_update_from_metadata(lat, lng, heading, metadata)
  end
end
