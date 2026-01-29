class RefactorInquiryDomain < ActiveRecord::Migration[8.0]
  def change
    # inquiries からフィールド削除
    remove_column :inquiries, :deal_status, :integer
    remove_column :inquiries, :deal_status_changed_at, :datetime
    remove_column :inquiries, :priority, :integer
    remove_column :inquiries, :assigned_user_id, :bigint
    remove_column :inquiries, :lost_reason, :string

    # inquiries に新 status 追加
    add_column :inquiries, :status, :integer, default: 0, null: false
    add_index :inquiries, :status

    # property_inquiries にフィールド追加
    add_column :property_inquiries, :deal_status, :integer, default: 0, null: false
    add_column :property_inquiries, :deal_status_changed_at, :datetime
    add_column :property_inquiries, :priority, :integer, default: 1, null: false
    add_column :property_inquiries, :assigned_user_id, :bigint
    add_column :property_inquiries, :lost_reason, :string

    add_index :property_inquiries, :deal_status
    add_index :property_inquiries, :priority
    add_index :property_inquiries, :assigned_user_id
    add_foreign_key :property_inquiries, :users, column: :assigned_user_id
  end
end
