class CreatePresentationAccesses < ActiveRecord::Migration[8.0]
  def change
    create_table :presentation_accesses do |t|
      t.references :property_publication, null: false, foreign_key: true
      t.string :access_token, null: false
      t.string :title
      t.string :password_digest
      t.datetime :expires_at
      t.integer :status, default: 0, null: false
      t.text :notes
      t.jsonb :step_config, default: {}
      t.integer :view_count, default: 0, null: false
      t.datetime :last_accessed_at
      t.datetime :first_accessed_at
      t.jsonb :access_history, default: []

      t.timestamps
    end

    add_index :presentation_accesses, :access_token, unique: true
    add_index :presentation_accesses, [:property_publication_id, :status]
  end
end
