class AddCustomerToPropertyInquiries < ActiveRecord::Migration[8.0]
  def change
    add_reference :property_inquiries, :customer, foreign_key: true
    add_column :property_inquiries, :channel, :integer, default: 0, null: false
    add_index :property_inquiries, :channel
  end
end
