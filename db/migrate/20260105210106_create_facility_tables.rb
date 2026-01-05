class CreateFacilityTables < ActiveRecord::Migration[8.0]
  def change
    # 設備マスタテーブル
    create_table :facilities do |t|
      t.string :code, null: false
      t.string :name, null: false
      t.string :category, null: false
      t.integer :display_order, default: 0
      t.boolean :is_popular, default: false
      t.boolean :is_active, default: true
      t.timestamps
    end
    add_index :facilities, :code, unique: true
    add_index :facilities, :category
    add_index :facilities, [:is_popular, :display_order]

    # 同義語テーブル
    create_table :facility_synonyms do |t|
      t.references :facility, null: false, foreign_key: true
      t.string :synonym, null: false
      t.timestamps
    end
    add_index :facility_synonyms, :synonym, unique: true

    # 部屋-設備中間テーブル
    create_table :room_facilities do |t|
      t.references :room, null: false, foreign_key: true
      t.references :facility, null: false, foreign_key: true
      t.string :raw_text
      t.timestamps
    end
    add_index :room_facilities, [:room_id, :facility_id], unique: true

    # 未マッチ設備テーブル
    create_table :unmatched_facilities do |t|
      t.references :room, null: false, foreign_key: true
      t.string :raw_text, null: false
      t.integer :occurrence_count, default: 1
      t.string :status, default: 'pending'
      t.references :mapped_to_facility, foreign_key: { to_table: :facilities }
      t.timestamps
    end
    add_index :unmatched_facilities, :raw_text
    add_index :unmatched_facilities, [:status, :occurrence_count]
  end
end
