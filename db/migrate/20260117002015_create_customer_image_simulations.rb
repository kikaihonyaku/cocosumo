class CreateCustomerImageSimulations < ActiveRecord::Migration[8.0]
  def change
    create_table :customer_image_simulations do |t|
      t.references :property_publication, null: false, foreign_key: true
      t.string :session_id, null: false
      t.string :source_photo_type, null: false
      t.bigint :source_photo_id, null: false
      t.text :prompt, null: false
      t.text :result_image_base64
      t.integer :status, default: 0, null: false
      t.string :error_message
      t.date :simulation_date, null: false
      t.string :ip_address

      t.timestamps
    end

    add_index :customer_image_simulations, [:property_publication_id, :simulation_date], name: 'idx_cis_publication_date'
    add_index :customer_image_simulations, :session_id
  end
end
