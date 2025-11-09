class CreatePropertyPublications < ActiveRecord::Migration[8.0]
  def change
    create_table :property_publications do |t|
      t.references :room, null: false, foreign_key: true
      t.string :publication_id, null: false
      t.string :title
      t.text :catch_copy
      t.text :pr_text
      t.integer :status, default: 0, null: false
      t.json :visible_fields
      t.datetime :published_at
      t.datetime :discarded_at

      t.timestamps
    end

    add_index :property_publications, :publication_id, unique: true
    add_index :property_publications, :discarded_at
    add_index :property_publications, :status
  end
end
