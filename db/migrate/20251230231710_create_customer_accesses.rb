class CreateCustomerAccesses < ActiveRecord::Migration[8.0]
  def change
    create_table :customer_accesses do |t|
      t.references :property_publication, null: false, foreign_key: true
      t.string :access_token, null: false
      t.string :customer_name, null: false
      t.string :customer_email, null: false
      t.string :customer_phone
      t.string :password_digest
      t.datetime :expires_at
      t.integer :status, default: 0, null: false
      t.text :notes

      # アクセス統計
      t.integer :view_count, default: 0, null: false
      t.datetime :last_accessed_at
      t.datetime :first_accessed_at
      t.jsonb :access_history, default: []

      t.timestamps
    end

    add_index :customer_accesses, :access_token, unique: true
    add_index :customer_accesses, :customer_email
    add_index :customer_accesses, [:property_publication_id, :status]
  end
end
