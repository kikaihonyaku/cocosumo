class CreatePropertyPublicationVirtualStagings < ActiveRecord::Migration[8.0]
  def change
    create_table :property_publication_virtual_stagings do |t|
      t.references :property_publication, null: false, foreign_key: true
      t.references :virtual_staging, null: false, foreign_key: true
      t.integer :display_order, default: 0, null: false

      t.timestamps
    end

    add_index :property_publication_virtual_stagings,
              [:property_publication_id, :virtual_staging_id],
              unique: true,
              name: 'index_pub_virtual_stagings_on_pub_and_vs'
    add_index :property_publication_virtual_stagings, :display_order
  end
end
