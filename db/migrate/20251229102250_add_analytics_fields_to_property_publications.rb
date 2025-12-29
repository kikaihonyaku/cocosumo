class AddAnalyticsFieldsToPropertyPublications < ActiveRecord::Migration[8.0]
  def change
    add_column :property_publications, :max_scroll_depth, :integer
    add_column :property_publications, :avg_session_duration, :integer
  end
end
