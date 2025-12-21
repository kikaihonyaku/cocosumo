# frozen_string_literal: true

class BuildingRoute < ApplicationRecord
  belongs_to :building
  belongs_to :tenant

  # 経路タイプ
  ROUTE_TYPES = %w[station school custom].freeze

  # 移動手段
  TRAVEL_MODES = %w[walking driving transit bicycling].freeze

  validates :name, presence: true
  validates :route_type, presence: true, inclusion: { in: ROUTE_TYPES }
  validates :travel_mode, inclusion: { in: TRAVEL_MODES }, allow_nil: true

  # スコープ
  scope :by_type, ->(type) { where(route_type: type) }
  scope :default_routes, -> { where(is_default: true) }
  scope :ordered, -> { order(:display_order, :created_at) }

  # 出発地の緯度経度をハッシュで返す
  def origin_latlng
    return nil unless origin

    { lat: origin.y, lng: origin.x }
  end

  # 目的地の緯度経度をハッシュで返す
  def destination_latlng
    return nil unless destination

    { lat: destination.y, lng: destination.x }
  end

  # 出発地を設定
  def origin_latlng=(coords)
    return unless coords.is_a?(Hash) && coords[:lat] && coords[:lng]

    factory = RGeo::Geographic.spherical_factory(srid: 4326)
    self.origin = factory.point(coords[:lng].to_f, coords[:lat].to_f)
  end

  # 目的地を設定
  def destination_latlng=(coords)
    return unless coords.is_a?(Hash) && coords[:lat] && coords[:lng]

    factory = RGeo::Geographic.spherical_factory(srid: 4326)
    self.destination = factory.point(coords[:lng].to_f, coords[:lat].to_f)
  end

  # 経路データが計算済みかどうか
  def calculated?
    route_geometry.present? && encoded_polyline.present?
  end

  # 距離を人間が読める形式で返す
  def formatted_distance
    return nil unless distance_meters

    if distance_meters >= 1000
      "#{(distance_meters / 1000.0).round(1)}km"
    else
      "#{distance_meters}m"
    end
  end

  # 所要時間を人間が読める形式で返す
  def formatted_duration
    return nil unless duration_seconds

    minutes = (duration_seconds / 60.0).ceil
    if minutes >= 60
      hours = minutes / 60
      mins = minutes % 60
      "#{hours}時間#{mins}分"
    else
      "#{minutes}分"
    end
  end

  # 経路タイプのラベル
  def route_type_label
    case route_type
    when 'station'
      '駅まで'
    when 'school'
      '学校まで'
    else
      'カスタム'
    end
  end

  # JSONシリアライズ用
  def as_json(options = {})
    super(options).merge(
      'origin_latlng' => origin_latlng,
      'destination_latlng' => destination_latlng,
      'formatted_distance' => formatted_distance,
      'formatted_duration' => formatted_duration,
      'route_type_label' => route_type_label,
      'calculated' => calculated?
    )
  end
end
