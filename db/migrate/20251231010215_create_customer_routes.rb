class CreateCustomerRoutes < ActiveRecord::Migration[8.0]
  def change
    create_table :customer_routes do |t|
      t.references :customer_access, null: false, foreign_key: true
      t.string :name, null: false
      t.string :destination_name
      t.string :destination_address
      t.decimal :destination_lat, precision: 10, scale: 7
      t.decimal :destination_lng, precision: 10, scale: 7
      t.decimal :origin_lat, precision: 10, scale: 7
      t.decimal :origin_lng, precision: 10, scale: 7
      t.string :travel_mode, default: 'walking'
      t.integer :distance_meters
      t.integer :duration_seconds
      t.text :encoded_polyline
      t.boolean :calculated, default: false
      t.integer :display_order, default: 0

      t.timestamps
    end

    add_index :customer_routes, [:customer_access_id, :display_order]
  end
end
