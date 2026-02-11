class CreateLineTemplates < ActiveRecord::Migration[8.0]
  def change
    create_table :line_templates do |t|
      t.references :tenant, null: false, foreign_key: true
      t.string :name, null: false
      t.integer :message_type, default: 0, null: false
      t.text :content, null: false
      t.string :image_url
      t.string :flex_alt_text
      t.integer :position
      t.datetime :discarded_at

      t.timestamps
    end

    add_index :line_templates, :discarded_at
    add_index :line_templates, [:tenant_id, :discarded_at]
  end
end
