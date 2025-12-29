class AddScheduleFieldsToPropertyPublications < ActiveRecord::Migration[8.0]
  def change
    add_column :property_publications, :scheduled_publish_at, :datetime
    add_column :property_publications, :scheduled_unpublish_at, :datetime
  end
end
