# frozen_string_literal: true

class MigrateSchoolDistrictsGeometry < ActiveRecord::Migration[8.0]
  def up
    # Migrate existing GeoJSON geometry to PostGIS geom column
    # Handle both Polygon and MultiPolygon types
    execute <<-SQL
      UPDATE school_districts
      SET geom = CASE
        WHEN (geometry->>'type') = 'Polygon' THEN
          ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(geometry::text), 4326))::geography
        WHEN (geometry->>'type') = 'MultiPolygon' THEN
          ST_SetSRID(ST_GeomFromGeoJSON(geometry::text), 4326)::geography
        ELSE
          NULL
      END
      WHERE geometry IS NOT NULL;
    SQL
  end

  def down
    # Convert PostGIS geometry back to GeoJSON
    execute <<-SQL
      UPDATE school_districts
      SET geometry = ST_AsGeoJSON(geom::geometry)::json
      WHERE geom IS NOT NULL;
    SQL
  end
end
