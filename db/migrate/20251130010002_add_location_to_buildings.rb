# frozen_string_literal: true

class AddLocationToBuildings < ActiveRecord::Migration[8.0]
  def change
    # Add PostGIS geometry column for location (SRID 4326 = WGS84)
    add_column :buildings, :location, :st_point, srid: 4326, geographic: true

    # Add spatial index for fast geospatial queries
    add_index :buildings, :location, using: :gist
  end
end
