class CreateStreetviewCaches < ActiveRecord::Migration[8.0]
  def change
    create_table :streetview_caches do |t|
      t.st_point :location, geographic: true, null: false
      t.decimal :heading, precision: 6, scale: 2
      t.decimal :pitch, precision: 5, scale: 2, default: 0
      t.integer :fov, default: 90
      t.string :pano_id
      t.date :capture_date
      t.datetime :expires_at

      t.timestamps
    end

    add_index :streetview_caches, :location, using: :gist
    add_index :streetview_caches, :pano_id, unique: true
    add_index :streetview_caches, :expires_at
  end
end
