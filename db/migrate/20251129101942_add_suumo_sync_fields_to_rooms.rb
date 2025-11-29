class AddSuumoSyncFieldsToRooms < ActiveRecord::Migration[8.0]
  def change
    add_column :rooms, :suumo_room_code, :string
    add_column :rooms, :suumo_detail_url, :string
    add_column :rooms, :suumo_imported_at, :datetime
    add_index :rooms, :suumo_room_code, where: "suumo_room_code IS NOT NULL"
  end
end
