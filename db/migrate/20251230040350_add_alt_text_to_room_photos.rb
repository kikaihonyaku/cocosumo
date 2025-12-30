class AddAltTextToRoomPhotos < ActiveRecord::Migration[8.0]
  def change
    add_column :room_photos, :alt_text, :text
  end
end
