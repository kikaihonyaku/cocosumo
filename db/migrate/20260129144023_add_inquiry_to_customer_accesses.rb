class AddInquiryToCustomerAccesses < ActiveRecord::Migration[8.0]
  def change
    add_reference :customer_accesses, :inquiry, null: true, foreign_key: true
  end
end
