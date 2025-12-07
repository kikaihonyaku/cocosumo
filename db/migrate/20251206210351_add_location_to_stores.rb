class AddLocationToStores < ActiveRecord::Migration[8.0]
  def change
    add_column :stores, :latitude, :decimal, precision: 10, scale: 7
    add_column :stores, :longitude, :decimal, precision: 10, scale: 7
    add_column :stores, :location, :st_point, geographic: true, srid: 4326

    add_index :stores, :location, using: :gist
  end
end
