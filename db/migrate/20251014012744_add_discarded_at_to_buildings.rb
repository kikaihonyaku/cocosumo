class AddDiscardedAtToBuildings < ActiveRecord::Migration[8.0]
  def change
    add_column :buildings, :discarded_at, :datetime
    add_index :buildings, :discarded_at
  end
end
