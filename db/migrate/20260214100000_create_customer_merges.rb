class CreateCustomerMerges < ActiveRecord::Migration[8.0]
  def change
    create_table :customer_merges do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :primary_customer, null: false, foreign_key: { to_table: :customers }
      t.references :performed_by, null: false, foreign_key: { to_table: :users }
      t.references :undone_by, foreign_key: { to_table: :users }

      t.jsonb :secondary_snapshot, null: false, default: {}
      t.jsonb :primary_snapshot, null: false, default: {}

      t.string :merge_reason
      t.integer :status, null: false, default: 0
      t.datetime :undone_at

      t.timestamps
    end

    add_index :customer_merges, [:tenant_id, :created_at]
  end
end
