class AddMapLayerIdToSchoolDistricts < ActiveRecord::Migration[8.0]
  def change
    add_reference :school_districts, :map_layer, null: true, foreign_key: true, index: true
  end
end
