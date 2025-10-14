class CreateVrScenes < ActiveRecord::Migration[8.0]
  def change
    create_table :vr_scenes do |t|
      t.references :vr_tour, null: false, foreign_key: true
      t.references :room_photo, null: false, foreign_key: true
      t.string :title
      t.integer :display_order
      t.text :initial_view
      t.text :hotspots
      t.text :minimap_position

      t.timestamps
    end

    add_index :vr_scenes, :display_order
  end
end
