# frozen_string_literal: true

module RgeoHelpers
  def create_point(lat, lng)
    factory = RGeo::Geographic.spherical_factory(srid: 4326)
    factory.point(lng, lat)
  end

  def create_linestring(coordinates)
    factory = RGeo::Geographic.spherical_factory(srid: 4326)
    points = coordinates.map { |lat, lng| factory.point(lng, lat) }
    factory.line_string(points)
  end
end

RSpec.configure do |config|
  config.include RgeoHelpers
end
