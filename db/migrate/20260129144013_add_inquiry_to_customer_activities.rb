class AddInquiryToCustomerActivities < ActiveRecord::Migration[8.0]
  def change
    add_reference :customer_activities, :inquiry, null: false, foreign_key: true
  end
end
