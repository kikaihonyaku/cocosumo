class AddContentFormatToCustomerActivities < ActiveRecord::Migration[8.0]
  def change
    add_column :customer_activities, :content_format, :string, default: "text", null: false
  end
end
