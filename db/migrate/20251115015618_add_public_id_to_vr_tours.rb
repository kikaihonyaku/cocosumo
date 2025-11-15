class AddPublicIdToVrTours < ActiveRecord::Migration[8.0]
  def change
    add_column :vr_tours, :public_id, :string
    add_index :vr_tours, :public_id, unique: true
  end
end
