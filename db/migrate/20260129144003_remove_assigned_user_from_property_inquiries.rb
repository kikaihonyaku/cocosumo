class RemoveAssignedUserFromPropertyInquiries < ActiveRecord::Migration[8.0]
  def change
    remove_column :property_inquiries, :assigned_user_id, :bigint
  end
end
