class AddAnnotationsToVirtualStagings < ActiveRecord::Migration[8.0]
  def change
    add_column :virtual_stagings, :annotations, :json, default: []
  end
end
