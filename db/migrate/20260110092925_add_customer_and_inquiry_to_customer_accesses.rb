class AddCustomerAndInquiryToCustomerAccesses < ActiveRecord::Migration[8.0]
  def change
    add_reference :customer_accesses, :customer, foreign_key: true
    add_reference :customer_accesses, :property_inquiry, foreign_key: true
  end
end
