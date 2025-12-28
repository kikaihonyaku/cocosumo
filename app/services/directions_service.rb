# frozen_string_literal: true

require 'net/http'
require 'json'

class DirectionsService
  GOOGLE_DIRECTIONS_API_URL = 'https://maps.googleapis.com/maps/api/directions/json'
  CACHE_EXPIRY = 7.days

  class DirectionsError < StandardError; end

  def initialize(route)
    @route = route
    @api_key = ENV['GOOGLE_MAPS_API_KEY'] || ENV['VITE_GOOGLE_MAPS_API_KEY']
  end

  # 経路を計算してルートに保存
  def calculate_and_save
    response = call_directions_api
    raise DirectionsError, "Directions API error: #{response['status']}" unless response['status'] == 'OK'

    route_data = response['routes'].first
    leg = route_data['legs'].first
    overview_polyline = route_data['overview_polyline']['points']

    # ポリラインをデコードしてLineStringに変換
    coordinates = decode_polyline(overview_polyline)
    linestring = create_linestring(coordinates)

    # ストリートビューポイントを生成
    sv_points = generate_streetview_points(coordinates)

    @route.update!(
      route_geometry: linestring,
      distance_meters: leg['distance']['value'],
      duration_seconds: leg['duration']['value'],
      directions_response: response,
      encoded_polyline: overview_polyline,
      streetview_points: sv_points
    )

    true
  rescue StandardError => e
    Rails.logger.error("DirectionsService error: #{e.message}")
    Rails.logger.error(e.backtrace.first(10).join("\n"))
    false
  end

  # 経路上のストリートビューポイントを取得
  def streetview_points(interval_meters: 10)
    return @route.streetview_points if @route.streetview_points.present?

    return [] unless @route.encoded_polyline.present?

    coordinates = decode_polyline(@route.encoded_polyline)
    generate_streetview_points(coordinates, interval_meters: interval_meters)
  end

  # 経路候補を取得（保存しない）
  def fetch_alternatives
    response = call_directions_api(with_alternatives: true)
    raise DirectionsError, "Directions API error: #{response['status']}" unless response['status'] == 'OK'

    response['routes'].map.with_index do |route_data, index|
      leg = route_data['legs'].first
      {
        index: index,
        distance_meters: leg['distance']['value'],
        distance_text: leg['distance']['text'],
        duration_seconds: leg['duration']['value'],
        duration_text: leg['duration']['text'],
        encoded_polyline: route_data['overview_polyline']['points'],
        summary: route_data['summary'] || '',
        warnings: route_data['warnings'] || []
      }
    end
  end

  # 選択された経路候補を保存
  def save_selected_route(selected_index)
    response = call_directions_api(with_alternatives: true)
    raise DirectionsError, "Directions API error: #{response['status']}" unless response['status'] == 'OK'
    raise DirectionsError, "選択された経路が見つかりません" unless response['routes'][selected_index]

    route_data = response['routes'][selected_index]
    leg = route_data['legs'].first
    overview_polyline = route_data['overview_polyline']['points']

    # ポリラインをデコードしてLineStringに変換
    coordinates = decode_polyline(overview_polyline)
    linestring = create_linestring(coordinates)

    # ストリートビューポイントを生成
    sv_points = generate_streetview_points(coordinates)

    @route.update!(
      route_geometry: linestring,
      distance_meters: leg['distance']['value'],
      duration_seconds: leg['duration']['value'],
      directions_response: { 'routes' => [route_data], 'status' => 'OK' },
      encoded_polyline: overview_polyline,
      streetview_points: sv_points
    )

    true
  rescue StandardError => e
    Rails.logger.error("DirectionsService#save_selected_route error: #{e.message}")
    Rails.logger.error(e.backtrace.first(10).join("\n"))
    raise
  end

  private

  def call_directions_api(with_alternatives: false)
    # キャッシュをチェック
    cache_key = generate_cache_key(with_alternatives: with_alternatives)
    cached = Rails.cache.read(cache_key)
    return cached if cached

    uri = URI(GOOGLE_DIRECTIONS_API_URL)
    params = build_api_params
    params[:alternatives] = 'true' if with_alternatives
    uri.query = URI.encode_www_form(params)

    response = Net::HTTP.get_response(uri)
    raise DirectionsError, "HTTP error: #{response.code}" unless response.is_a?(Net::HTTPSuccess)

    result = JSON.parse(response.body)

    # 成功時はキャッシュ
    Rails.cache.write(cache_key, result, expires_in: CACHE_EXPIRY) if result['status'] == 'OK'

    result
  end

  def build_api_params
    params = {
      origin: format_latlng(@route.origin),
      destination: format_latlng(@route.destination),
      mode: @route.travel_mode || 'walking',
      key: @api_key,
      language: 'ja'
    }

    # 経由点がある場合
    if @route.waypoints.present? && @route.waypoints.any?
      waypoints = @route.waypoints.map { |w| "#{w['lat']},#{w['lng']}" }
      params[:waypoints] = waypoints.join('|')
    end

    params
  end

  def format_latlng(point)
    "#{point.y},#{point.x}"
  end

  def generate_cache_key(with_alternatives: false)
    key_source = {
      origin: format_latlng(@route.origin),
      destination: format_latlng(@route.destination),
      waypoints: @route.waypoints,
      mode: @route.travel_mode,
      alternatives: with_alternatives
    }
    "directions:#{Digest::SHA256.hexdigest(key_source.to_json)}"
  end

  # Google Polyline Algorithm のデコード
  # https://developers.google.com/maps/documentation/utilities/polylinealgorithm
  def decode_polyline(encoded)
    return [] if encoded.blank?

    points = []
    index = 0
    lat = 0
    lng = 0

    while index < encoded.length
      # Decode latitude
      shift = 0
      result = 0
      loop do
        b = encoded[index].ord - 63
        index += 1
        result |= (b & 0x1f) << shift
        shift += 5
        break if b < 0x20
      end
      lat += (result & 1).nonzero? ? ~(result >> 1) : (result >> 1)

      # Decode longitude
      shift = 0
      result = 0
      loop do
        b = encoded[index].ord - 63
        index += 1
        result |= (b & 0x1f) << shift
        shift += 5
        break if b < 0x20
      end
      lng += (result & 1).nonzero? ? ~(result >> 1) : (result >> 1)

      points << [lat / 1e5, lng / 1e5]
    end

    points
  end

  def create_linestring(coordinates)
    return nil if coordinates.empty?

    factory = RGeo::Geographic.spherical_factory(srid: 4326)
    points = coordinates.map { |lat, lng| factory.point(lng, lat) }
    factory.line_string(points)
  end

  # 経路上を一定間隔でサンプリングしてストリートビュー用ポイントを生成
  # interval_meters: ポイント間の最小距離（メートル）
  # turn_threshold_degrees: 方向変化がこの角度以上の場合は距離に関係なくポイントを追加
  def generate_streetview_points(coordinates, interval_meters: 10, turn_threshold_degrees: 30)
    return [] if coordinates.empty?

    points = []
    accumulated_distance = 0
    last_point = nil
    last_heading = nil

    coordinates.each_with_index do |(lat, lng), index|
      if last_point
        distance = haversine_distance(last_point[:lat], last_point[:lng], lat, lng)
        accumulated_distance += distance

        # 現在の進行方向を計算
        current_heading = calculate_heading(last_point[:lat], last_point[:lng], lat, lng)

        # 方向変化を計算（前回のheadingがある場合）
        heading_change = 0
        if last_heading
          heading_change = (current_heading - last_heading).abs
          # 180度を超える場合は360度から引いて正規化（例: 350° → 10° は10度の変化）
          heading_change = 360 - heading_change if heading_change > 180
        end

        # 距離条件 OR 方向変化条件でポイントを追加
        if accumulated_distance >= interval_meters || heading_change >= turn_threshold_degrees
          points << {
            lat: lat.round(6),
            lng: lng.round(6),
            heading: current_heading.round(1),
            index: index
          }
          accumulated_distance = 0
        end

        last_heading = current_heading
      else
        # 最初のポイント
        next_point = coordinates[index + 1]
        heading = next_point ? calculate_heading(lat, lng, next_point[0], next_point[1]) : 0
        points << {
          lat: lat.round(6),
          lng: lng.round(6),
          heading: heading.round(1),
          index: index
        }
        last_heading = heading
      end

      last_point = { lat: lat, lng: lng }
    end

    # 最後のポイントを追加（まだ追加されていない場合）
    if coordinates.length > 1 && (points.empty? || points.last[:index] != coordinates.length - 1)
      last_coord = coordinates.last
      prev_coord = coordinates[-2]
      heading = calculate_heading(prev_coord[0], prev_coord[1], last_coord[0], last_coord[1])
      points << {
        lat: last_coord[0].round(6),
        lng: last_coord[1].round(6),
        heading: heading.round(1),
        index: coordinates.length - 1
      }
    end

    points
  end

  # Haversine formula で2点間の距離を計算（メートル）
  def haversine_distance(lat1, lng1, lat2, lng2)
    r = 6371000 # 地球の半径（メートル）

    phi1 = lat1 * Math::PI / 180
    phi2 = lat2 * Math::PI / 180
    delta_phi = (lat2 - lat1) * Math::PI / 180
    delta_lambda = (lng2 - lng1) * Math::PI / 180

    a = Math.sin(delta_phi / 2)**2 +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(delta_lambda / 2)**2
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    r * c
  end

  # 2点間の方位角（heading）を計算（度）
  def calculate_heading(lat1, lng1, lat2, lng2)
    phi1 = lat1 * Math::PI / 180
    phi2 = lat2 * Math::PI / 180
    delta_lambda = (lng2 - lng1) * Math::PI / 180

    x = Math.sin(delta_lambda) * Math.cos(phi2)
    y = Math.cos(phi1) * Math.sin(phi2) -
        Math.sin(phi1) * Math.cos(phi2) * Math.cos(delta_lambda)

    heading = Math.atan2(x, y) * 180 / Math::PI
    (heading + 360) % 360
  end
end
