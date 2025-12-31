class AddCustomerMessageToCustomerAccesses < ActiveRecord::Migration[8.0]
  def change
    add_column :customer_accesses, :customer_message, :text
  end
end
