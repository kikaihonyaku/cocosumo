class AddSuumoSyncFieldsToBuildings < ActiveRecord::Migration[8.0]
  def change
    add_column :buildings, :external_key, :string
    add_column :buildings, :suumo_imported_at, :datetime
    add_index :buildings, [:tenant_id, :external_key], unique: true, where: "external_key IS NOT NULL"
  end
end
