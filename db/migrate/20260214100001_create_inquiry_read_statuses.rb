class CreateInquiryReadStatuses < ActiveRecord::Migration[8.0]
  def change
    create_table :inquiry_read_statuses do |t|
      t.references :user, null: false, foreign_key: true
      t.references :inquiry, null: false, foreign_key: true
      t.datetime :last_read_at, null: false

      t.timestamps
    end

    add_index :inquiry_read_statuses, [ :user_id, :inquiry_id ], unique: true
  end
end
