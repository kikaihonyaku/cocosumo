class CreateInquiries < ActiveRecord::Migration[8.0]
  def change
    create_table :inquiries do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :customer, null: false, foreign_key: true
      t.bigint :assigned_user_id
      t.integer :deal_status, null: false, default: 0
      t.datetime :deal_status_changed_at
      t.integer :priority, null: false, default: 1
      t.string :lost_reason
      t.text :notes

      t.timestamps
    end

    add_foreign_key :inquiries, :users, column: :assigned_user_id
    add_index :inquiries, :assigned_user_id
    add_index :inquiries, :deal_status
    add_index :inquiries, :priority
  end
end
