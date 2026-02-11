class AddMetadataToCustomerActivities < ActiveRecord::Migration[8.0]
  def change
    add_column :customer_activities, :metadata, :jsonb, default: {}
  end
end
