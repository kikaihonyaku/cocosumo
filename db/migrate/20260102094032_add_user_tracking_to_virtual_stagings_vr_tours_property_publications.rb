class AddUserTrackingToVirtualStagingsVrToursPropertyPublications < ActiveRecord::Migration[8.0]
  def change
    # virtual_stagings
    add_reference :virtual_stagings, :created_by, foreign_key: { to_table: :users }, null: true
    add_reference :virtual_stagings, :updated_by, foreign_key: { to_table: :users }, null: true

    # vr_tours
    add_reference :vr_tours, :created_by, foreign_key: { to_table: :users }, null: true
    add_reference :vr_tours, :updated_by, foreign_key: { to_table: :users }, null: true

    # property_publications
    add_reference :property_publications, :created_by, foreign_key: { to_table: :users }, null: true
    add_reference :property_publications, :updated_by, foreign_key: { to_table: :users }, null: true
  end
end
