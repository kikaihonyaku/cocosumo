class AddAssignedUserToInquiries < ActiveRecord::Migration[8.0]
  def change
    add_reference :inquiries, :assigned_user, foreign_key: { to_table: :users }, null: true
  end
end
