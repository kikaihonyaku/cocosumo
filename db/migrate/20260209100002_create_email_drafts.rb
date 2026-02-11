class CreateEmailDrafts < ActiveRecord::Migration[8.0]
  def change
    create_table :email_drafts do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.references :customer, null: false, foreign_key: true
      t.references :inquiry, foreign_key: true
      t.string :subject
      t.text :body
      t.string :body_format, default: "html", null: false
      t.jsonb :metadata, default: {}
      t.timestamps
    end

    add_index :email_drafts, [:user_id, :customer_id], name: "index_email_drafts_on_user_customer"
  end
end
