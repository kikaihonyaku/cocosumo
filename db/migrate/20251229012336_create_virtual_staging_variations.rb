class CreateVirtualStagingVariations < ActiveRecord::Migration[8.0]
  def change
    create_table :virtual_staging_variations do |t|
      t.references :virtual_staging, null: false, foreign_key: true
      t.references :after_photo, null: false, foreign_key: { to_table: :room_photos }
      t.string :style_name, null: false
      t.integer :display_order, default: 0

      t.timestamps
    end

    add_index :virtual_staging_variations, [:virtual_staging_id, :display_order], name: 'index_vs_variations_on_staging_and_order'
  end
end
