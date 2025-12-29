class AddSourceTrackingToPropertyInquiries < ActiveRecord::Migration[8.0]
  def change
    add_column :property_inquiries, :source, :string
    add_column :property_inquiries, :utm_source, :string
    add_column :property_inquiries, :utm_medium, :string
    add_column :property_inquiries, :utm_campaign, :string
    add_column :property_inquiries, :referrer, :string
  end
end
