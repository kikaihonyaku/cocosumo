class CreateRailwayLinesAndStations < ActiveRecord::Migration[8.0]
  def change
    create_table :railway_lines do |t|
      t.string :code, null: false
      t.string :name, null: false
      t.string :company, null: false
      t.string :company_code, null: false
      t.string :color
      t.integer :display_order, default: 0
      t.boolean :is_active, default: true

      t.timestamps
    end

    add_index :railway_lines, :code, unique: true
    add_index :railway_lines, :company_code
    add_index :railway_lines, :is_active

    create_table :stations do |t|
      t.references :railway_line, null: false, foreign_key: true
      t.string :code, null: false
      t.string :name, null: false
      t.string :name_kana
      t.st_point :location, geographic: true
      t.integer :display_order, default: 0
      t.boolean :is_active, default: true

      t.timestamps
    end

    add_index :stations, :code, unique: true
    add_index :stations, :name
    add_index :stations, :is_active
    add_index :stations, :location, using: :gist

    create_table :building_stations do |t|
      t.references :building, null: false, foreign_key: true
      t.references :station, null: false, foreign_key: true
      t.integer :walking_minutes
      t.integer :display_order, default: 0
      t.string :raw_text

      t.timestamps
    end

    add_index :building_stations, [:building_id, :station_id], unique: true
  end
end
