class AddSavedFieldsToCustomerImageSimulations < ActiveRecord::Migration[8.0]
  def change
    add_reference :customer_image_simulations, :customer_access, null: true, foreign_key: true
    add_column :customer_image_simulations, :saved, :boolean, default: false, null: false
    add_column :customer_image_simulations, :title, :string
    add_column :customer_image_simulations, :source_photo_url, :text

    add_index :customer_image_simulations, [:customer_access_id, :saved],
              where: "saved = true",
              name: "idx_cis_customer_access_saved"
  end
end
