class CreatePropertyPublicationPhotos < ActiveRecord::Migration[8.0]
  def change
    create_table :property_publication_photos do |t|
      t.references :property_publication, null: false, foreign_key: true
      t.references :room_photo, null: false, foreign_key: true
      t.integer :display_order, default: 0, null: false

      t.timestamps
    end

    add_index :property_publication_photos,
              [:property_publication_id, :room_photo_id],
              unique: true,
              name: 'index_pub_photos_on_pub_and_photo'
    add_index :property_publication_photos, :display_order
  end
end
