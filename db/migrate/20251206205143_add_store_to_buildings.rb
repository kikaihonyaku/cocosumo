class AddStoreToBuildings < ActiveRecord::Migration[8.0]
  def change
    add_reference :buildings, :store, null: true, foreign_key: true
  end
end
