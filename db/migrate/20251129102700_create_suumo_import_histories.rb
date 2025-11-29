class CreateSuumoImportHistories < ActiveRecord::Migration[8.0]
  def change
    create_table :suumo_import_histories do |t|
      t.references :tenant, null: false, foreign_key: true
      t.string :url, null: false
      t.string :status, null: false, default: "pending"
      t.datetime :started_at
      t.datetime :completed_at
      t.integer :buildings_created, default: 0
      t.integer :buildings_updated, default: 0
      t.integer :rooms_created, default: 0
      t.integer :rooms_updated, default: 0
      t.integer :images_downloaded, default: 0
      t.integer :images_skipped, default: 0
      t.integer :error_count, default: 0
      t.text :log_data
      t.json :options
      t.text :error_message

      t.timestamps
    end

    add_index :suumo_import_histories, :status
    add_index :suumo_import_histories, :started_at
  end
end
