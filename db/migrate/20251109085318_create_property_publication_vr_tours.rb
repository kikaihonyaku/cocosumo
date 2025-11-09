class CreatePropertyPublicationVrTours < ActiveRecord::Migration[8.0]
  def change
    create_table :property_publication_vr_tours do |t|
      t.references :property_publication, null: false, foreign_key: true
      t.references :vr_tour, null: false, foreign_key: true
      t.integer :display_order, default: 0, null: false

      t.timestamps
    end

    add_index :property_publication_vr_tours,
              [:property_publication_id, :vr_tour_id],
              unique: true,
              name: 'index_pub_vr_tours_on_pub_and_vr_tour'
    add_index :property_publication_vr_tours, :display_order
  end
end
