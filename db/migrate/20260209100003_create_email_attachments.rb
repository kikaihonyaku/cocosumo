class CreateEmailAttachments < ActiveRecord::Migration[8.0]
  def change
    create_table :email_attachments do |t|
      t.references :customer_activity, null: false, foreign_key: true
      t.string :filename, null: false
      t.string :content_type
      t.integer :byte_size
      t.timestamps
    end
  end
end
