class CreatePropertyInquiries < ActiveRecord::Migration[8.0]
  def change
    create_table :property_inquiries do |t|
      t.references :property_publication, null: false, foreign_key: true
      t.string :name, null: false
      t.string :email, null: false
      t.string :phone
      t.text :message, null: false

      t.timestamps
    end

    add_index :property_inquiries, :created_at
  end
end
