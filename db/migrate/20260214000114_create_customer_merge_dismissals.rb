class CreateCustomerMergeDismissals < ActiveRecord::Migration[8.0]
  def change
    create_table :customer_merge_dismissals do |t|
      t.references :tenant, null: false, foreign_key: true
      t.bigint :customer1_id, null: false
      t.bigint :customer2_id, null: false
      t.references :dismissed_by, null: false, foreign_key: { to_table: :users }
      t.string :reason
      t.timestamps
    end

    add_foreign_key :customer_merge_dismissals, :customers, column: :customer1_id
    add_foreign_key :customer_merge_dismissals, :customers, column: :customer2_id
    add_index :customer_merge_dismissals, [:tenant_id, :customer1_id, :customer2_id],
              unique: true, name: "idx_merge_dismissals_tenant_pair"
  end
end
