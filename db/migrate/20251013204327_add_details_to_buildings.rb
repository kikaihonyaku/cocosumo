class AddDetailsToBuildings < ActiveRecord::Migration[8.0]
  def change
    add_column :buildings, :built_year, :integer
    add_column :buildings, :postcode, :string
    add_column :buildings, :structure, :string
    add_column :buildings, :floors, :integer
  end
end
