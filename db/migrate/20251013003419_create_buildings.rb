class CreateBuildings < ActiveRecord::Migration[8.0]
  def change
    create_table :buildings do |t|
      t.references :tenant, null: false, foreign_key: true
      t.string :name
      t.string :address
      t.decimal :latitude
      t.decimal :longitude
      t.string :building_type
      t.integer :total_units
      t.text :description

      t.timestamps
    end
  end
end
