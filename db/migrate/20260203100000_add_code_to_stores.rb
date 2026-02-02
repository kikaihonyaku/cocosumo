class AddCodeToStores < ActiveRecord::Migration[8.0]
  def up
    # Step 1: Add nullable column
    add_column :stores, :code, :string, limit: 6

    # Step 2: Backfill existing records with "s{id}" as temporary code
    Store.reset_column_information
    Store.find_each do |store|
      store.update_column(:code, "s#{store.id}")
    end

    # Step 3: Add NOT NULL constraint and unique index
    change_column_null :stores, :code, false
    add_index :stores, [:tenant_id, :code], unique: true
  end

  def down
    remove_index :stores, [:tenant_id, :code]
    remove_column :stores, :code
  end
end
