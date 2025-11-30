# frozen_string_literal: true

class MigrateBuildingsCoordinates < ActiveRecord::Migration[8.0]
  def up
    # Migrate existing latitude/longitude to location geometry
    execute <<-SQL
      UPDATE buildings
      SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
    SQL
  end

  def down
    # Restore latitude/longitude from location
    execute <<-SQL
      UPDATE buildings
      SET
        latitude = ST_Y(location::geometry),
        longitude = ST_X(location::geometry)
      WHERE location IS NOT NULL;
    SQL
  end
end
