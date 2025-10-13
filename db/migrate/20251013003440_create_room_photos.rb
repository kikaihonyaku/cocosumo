class CreateRoomPhotos < ActiveRecord::Migration[8.0]
  def change
    create_table :room_photos do |t|
      t.references :room, null: false, foreign_key: true
      t.string :photo_type
      t.string :file_path
      t.text :caption
      t.integer :display_order

      t.timestamps
    end
  end
end
