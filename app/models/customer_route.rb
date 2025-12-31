class CustomerRoute < ApplicationRecord
  require 'net/http'
  require 'json'

  GOOGLE_DIRECTIONS_API_URL = 'https://maps.googleapis.com/maps/api/directions/json'

  belongs_to :customer_access

  # バリデーション
  validates :name, presence: true
  validates :travel_mode, inclusion: { in: %w[walking transit driving] }
  validates :destination_lat, :destination_lng, presence: true, if: :calculated?

  # 1つのcustomer_accessにつき最大4件まで
  validate :max_routes_per_customer_access, on: :create

  # スコープ
  scope :ordered, -> { order(:display_order, :created_at) }
  scope :calculated, -> { where(calculated: true) }

  # 経路計算
  def calculate_route!
    return false unless destination_lat && destination_lng

    building = customer_access.property_publication.room.building
    return false unless building&.latitude && building&.longitude

    self.origin_lat = building.latitude
    self.origin_lng = building.longitude

    # Google Directions APIで経路計算
    result = call_directions_api

    if result && result['status'] == 'OK'
      route_data = result['routes'].first
      leg = route_data['legs'].first

      self.distance_meters = leg['distance']['value']
      self.duration_seconds = leg['duration']['value']
      self.encoded_polyline = route_data['overview_polyline']['points']
      self.calculated = true
      save
    else
      Rails.logger.error("CustomerRoute directions API error: #{result&.dig('status')}")
      false
    end
  rescue StandardError => e
    Rails.logger.error("CustomerRoute calculate_route! error: #{e.message}")
    false
  end

  private

  def call_directions_api
    api_key = ENV['GOOGLE_MAPS_API_KEY'] || ENV['VITE_GOOGLE_MAPS_API_KEY']
    return nil unless api_key

    uri = URI(GOOGLE_DIRECTIONS_API_URL)
    params = {
      origin: "#{origin_lat},#{origin_lng}",
      destination: "#{destination_lat},#{destination_lng}",
      mode: travel_mode || 'walking',
      key: api_key,
      language: 'ja'
    }
    uri.query = URI.encode_www_form(params)

    response = Net::HTTP.get_response(uri)
    return nil unless response.is_a?(Net::HTTPSuccess)

    JSON.parse(response.body)
  end

  public

  # 経路情報をJSON形式で返す
  def as_route_json
    {
      id: id,
      name: name,
      destination_name: destination_name,
      destination_address: destination_address,
      destination_lat: destination_lat,
      destination_lng: destination_lng,
      origin_lat: origin_lat,
      origin_lng: origin_lng,
      travel_mode: travel_mode,
      distance_meters: distance_meters,
      duration_seconds: duration_seconds,
      encoded_polyline: encoded_polyline,
      calculated: calculated,
      display_order: display_order,
      is_customer_route: true,  # お客様が追加した経路であることを示すフラグ
      created_at: created_at
    }
  end

  private

  def max_routes_per_customer_access
    if customer_access && customer_access.customer_routes.count >= 4
      errors.add(:base, '登録できる経路は最大4件までです')
    end
  end
end
