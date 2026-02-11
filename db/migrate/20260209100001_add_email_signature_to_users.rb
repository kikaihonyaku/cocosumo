class AddEmailSignatureToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :email_signature, :text
  end
end
