class AddSourceTypeAndStatusToPropertyInquiries < ActiveRecord::Migration[8.0]
  def change
    add_column :property_inquiries, :source_type, :integer, default: 0
    add_column :property_inquiries, :source_url, :string, limit: 500
    add_column :property_inquiries, :status, :integer, default: 0
    add_column :property_inquiries, :replied_at, :datetime
    add_column :property_inquiries, :reply_message, :text

    add_index :property_inquiries, :source_type
    add_index :property_inquiries, :status
  end
end
