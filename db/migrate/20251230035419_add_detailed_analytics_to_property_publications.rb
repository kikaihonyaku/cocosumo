class AddDetailedAnalyticsToPropertyPublications < ActiveRecord::Migration[8.0]
  def change
    add_column :property_publications, :device_stats, :jsonb, default: {}
    add_column :property_publications, :referrer_stats, :jsonb, default: {}
    add_column :property_publications, :hourly_stats, :jsonb, default: {}
  end
end
