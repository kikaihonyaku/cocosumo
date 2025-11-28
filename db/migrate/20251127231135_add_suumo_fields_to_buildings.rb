class AddSuumoFieldsToBuildings < ActiveRecord::Migration[8.0]
  def change
    add_column :buildings, :built_month, :integer
    add_column :buildings, :has_elevator, :boolean
    add_column :buildings, :has_bicycle_parking, :boolean
    add_column :buildings, :has_parking, :boolean
    add_column :buildings, :parking_spaces, :integer
  end
end
