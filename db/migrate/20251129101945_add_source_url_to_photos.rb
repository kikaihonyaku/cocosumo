class AddSourceUrlToPhotos < ActiveRecord::Migration[8.0]
  def change
    add_column :building_photos, :source_url, :string
    add_column :room_photos, :source_url, :string
    add_index :building_photos, [:building_id, :source_url], unique: true, where: "source_url IS NOT NULL"
    add_index :room_photos, [:room_id, :source_url], unique: true, where: "source_url IS NOT NULL"
  end
end
