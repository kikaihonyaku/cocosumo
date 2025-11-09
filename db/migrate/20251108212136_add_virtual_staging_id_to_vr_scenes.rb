class AddVirtualStagingIdToVrScenes < ActiveRecord::Migration[8.0]
  def change
    add_column :vr_scenes, :virtual_staging_id, :integer
    add_index :vr_scenes, :virtual_staging_id
    add_foreign_key :vr_scenes, :virtual_stagings, column: :virtual_staging_id
  end
end
