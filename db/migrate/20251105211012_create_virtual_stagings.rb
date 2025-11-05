class CreateVirtualStagings < ActiveRecord::Migration[8.0]
  def change
    create_table :virtual_stagings do |t|
      t.references :room, null: false, foreign_key: true
      t.string :title
      t.text :description
      t.integer :before_photo_id
      t.integer :after_photo_id
      t.integer :status, default: 0, null: false
      t.datetime :published_at

      t.timestamps
    end

    add_index :virtual_stagings, :before_photo_id
    add_index :virtual_stagings, :after_photo_id
    add_index :virtual_stagings, :status
    add_foreign_key :virtual_stagings, :room_photos, column: :before_photo_id
    add_foreign_key :virtual_stagings, :room_photos, column: :after_photo_id
  end
end
