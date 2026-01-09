class RemoveFacilitiesFromRooms < ActiveRecord::Migration[8.0]
  def change
    remove_column :rooms, :facilities, :text
  end
end
