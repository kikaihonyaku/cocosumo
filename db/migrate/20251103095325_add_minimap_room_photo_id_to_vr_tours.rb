class AddMinimapRoomPhotoIdToVrTours < ActiveRecord::Migration[8.0]
  def change
    add_column :vr_tours, :minimap_room_photo_id, :integer
    add_index :vr_tours, :minimap_room_photo_id
    add_foreign_key :vr_tours, :room_photos, column: :minimap_room_photo_id
  end
end
