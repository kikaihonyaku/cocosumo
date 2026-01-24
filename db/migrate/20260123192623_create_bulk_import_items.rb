# frozen_string_literal: true

class CreateBulkImportItems < ActiveRecord::Migration[8.0]
  def change
    create_table :bulk_import_items do |t|
      t.references :bulk_import_history, null: false, foreign_key: true
      t.string :status, default: 'pending', null: false
      t.string :original_filename, null: false
      t.jsonb :extracted_data, default: {}
      t.jsonb :edited_data, default: {}
      t.jsonb :similar_buildings, default: []
      t.bigint :selected_building_id
      t.bigint :created_building_id
      t.bigint :created_room_id
      t.text :error_message
      t.integer :display_order, default: 0

      t.timestamps
    end

    add_index :bulk_import_items, :status
    add_foreign_key :bulk_import_items, :buildings, column: :selected_building_id, on_delete: :nullify
    add_foreign_key :bulk_import_items, :buildings, column: :created_building_id, on_delete: :nullify
    add_foreign_key :bulk_import_items, :rooms, column: :created_room_id, on_delete: :nullify
  end
end
