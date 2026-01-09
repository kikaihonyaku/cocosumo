class AddTenantManagementFields < ActiveRecord::Migration[8.0]
  def change
    # テナントテーブル拡張
    add_column :tenants, :status, :integer, default: 0, null: false
    add_column :tenants, :plan, :string, default: 'basic'
    add_column :tenants, :max_users, :integer, default: 10
    add_column :tenants, :max_buildings, :integer, default: 100
    add_column :tenants, :created_by_id, :bigint
    add_column :tenants, :suspended_at, :datetime
    add_column :tenants, :suspended_reason, :text

    add_index :tenants, :status
    add_foreign_key :tenants, :users, column: :created_by_id

    # 監査ログテーブル作成
    create_table :admin_audit_logs do |t|
      t.references :user, null: false, foreign_key: true
      t.references :tenant, foreign_key: true
      t.string :action, null: false
      t.string :resource_type
      t.bigint :resource_id
      t.jsonb :changes, default: {}
      t.jsonb :metadata, default: {}
      t.string :ip_address
      t.string :user_agent
      t.datetime :created_at, null: false
    end

    add_index :admin_audit_logs, [:user_id, :created_at]
    add_index :admin_audit_logs, [:tenant_id, :created_at]
    add_index :admin_audit_logs, [:resource_type, :resource_id]
    add_index :admin_audit_logs, :action
  end
end
