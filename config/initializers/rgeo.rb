# frozen_string_literal: true

# RGeo Factory configuration for PostGIS
# SRID 4326 = WGS84 (standard GPS coordinate system)
RGeo::ActiveRecord::SpatialFactoryStore.instance.tap do |factory_store|
  # Geographic factory for geography types (distance in meters)
  factory_store.register(
    RGeo::Geographic.spherical_factory(srid: 4326),
    geo_type: "geography"
  )

  # Geographic factory for Point type
  factory_store.register(
    RGeo::Geographic.spherical_factory(srid: 4326),
    geo_type: "geography",
    sql_type: "geography(Point,4326)"
  )

  # Geographic factory for MultiPolygon type
  factory_store.register(
    RGeo::Geographic.spherical_factory(srid: 4326),
    geo_type: "geography",
    sql_type: "geography(MultiPolygon,4326)"
  )

  # Cartesian factory for geometry types (planar calculations)
  factory_store.register(
    RGeo::Cartesian.factory(srid: 4326),
    geo_type: "geometry"
  )
end
