class AddAttributionToMapLayers < ActiveRecord::Migration[8.0]
  def change
    add_column :map_layers, :attribution, :text
  end
end
