class RemoveDealFieldsFromCustomers < ActiveRecord::Migration[8.0]
  def change
    remove_column :customers, :deal_status, :integer, default: 0
    remove_column :customers, :deal_status_changed_at, :datetime
    remove_column :customers, :assigned_user_id, :bigint
    remove_column :customers, :lost_reason, :string
    remove_column :customers, :priority, :integer, default: 1
  end
end
