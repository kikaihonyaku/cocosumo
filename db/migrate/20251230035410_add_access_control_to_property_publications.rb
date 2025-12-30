class AddAccessControlToPropertyPublications < ActiveRecord::Migration[8.0]
  def change
    add_column :property_publications, :access_password, :string
    add_column :property_publications, :expires_at, :datetime
  end
end
