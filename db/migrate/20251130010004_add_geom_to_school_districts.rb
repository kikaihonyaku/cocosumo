# frozen_string_literal: true

class AddGeomToSchoolDistricts < ActiveRecord::Migration[8.0]
  def change
    # Add PostGIS geometry column for school district boundaries
    add_column :school_districts, :geom, :st_multi_polygon, srid: 4326, geographic: true

    # Add spatial index for fast geospatial queries
    add_index :school_districts, :geom, using: :gist
  end
end
