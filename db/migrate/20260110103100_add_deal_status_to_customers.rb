class AddDealStatusToCustomers < ActiveRecord::Migration[8.0]
  def change
    add_column :customers, :deal_status, :integer, null: false, default: 0
    add_column :customers, :deal_status_changed_at, :datetime
    add_reference :customers, :assigned_user, foreign_key: { to_table: :users }
    add_column :customers, :lost_reason, :string
    add_column :customers, :expected_move_date, :date
    add_column :customers, :budget_min, :integer
    add_column :customers, :budget_max, :integer
    add_column :customers, :preferred_areas, :jsonb, default: []
    add_column :customers, :requirements, :text
    add_column :customers, :priority, :integer, null: false, default: 1

    add_index :customers, :deal_status
    add_index :customers, :priority
  end
end
