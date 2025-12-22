class CreateAddressPoints < ActiveRecord::Migration[8.0]
  def change
    create_table :address_points do |t|
      t.references :map_layer, null: false, foreign_key: true
      t.string :prefecture
      t.string :city
      t.string :district
      t.string :block_number
      t.decimal :latitude, precision: 10, scale: 6
      t.decimal :longitude, precision: 10, scale: 6
      t.st_point :location, geographic: true
      t.boolean :representative, default: false

      t.timestamps
    end

    add_index :address_points, :location, using: :gist
    add_index :address_points, [:map_layer_id, :prefecture, :city]
  end
end
