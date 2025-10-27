class CreateBuildingPhotos < ActiveRecord::Migration[8.0]
  def change
    create_table :building_photos do |t|
      t.references :building, null: false, foreign_key: true
      t.string :photo_type
      t.text :caption
      t.integer :display_order

      t.timestamps
    end
  end
end
