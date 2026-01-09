class AddProfileFieldsToUsers < ActiveRecord::Migration[8.0]
  def change
    # 必要な項目
    add_column :users, :phone, :string
    add_column :users, :avatar_url, :string
    add_column :users, :active, :boolean, default: true, null: false
    add_column :users, :last_login_at, :datetime

    # あったら良い項目
    add_reference :users, :store, foreign_key: true
    add_column :users, :position, :string
    add_column :users, :employee_code, :string
    add_column :users, :notification_settings, :jsonb, default: {}
    add_column :users, :password_changed_at, :datetime
    add_column :users, :failed_login_count, :integer, default: 0, null: false
    add_column :users, :locked_at, :datetime

    # インデックス
    add_index :users, :employee_code
    add_index :users, :active
  end
end
