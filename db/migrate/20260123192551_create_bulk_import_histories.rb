# frozen_string_literal: true

class CreateBulkImportHistories < ActiveRecord::Migration[8.0]
  def change
    create_table :bulk_import_histories do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :status, default: 'pending', null: false
      t.datetime :started_at
      t.datetime :completed_at
      t.integer :total_files, default: 0
      t.integer :analyzed_count, default: 0
      t.integer :buildings_created, default: 0
      t.integer :buildings_matched, default: 0
      t.integer :rooms_created, default: 0
      t.integer :error_count, default: 0
      t.text :log_data

      t.timestamps
    end

    add_index :bulk_import_histories, :status
    add_index :bulk_import_histories, :created_at
  end
end
