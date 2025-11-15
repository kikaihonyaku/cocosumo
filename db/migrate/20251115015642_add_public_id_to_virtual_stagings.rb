class AddPublicIdToVirtualStagings < ActiveRecord::Migration[8.0]
  def change
    add_column :virtual_stagings, :public_id, :string
    add_index :virtual_stagings, :public_id, unique: true
  end
end
