class CreateCustomerActivities < ActiveRecord::Migration[8.0]
  def change
    create_table :customer_activities do |t|
      t.references :customer, null: false, foreign_key: true
      t.references :user, null: true, foreign_key: true
      t.integer :activity_type, null: false, default: 0
      t.integer :direction, null: false, default: 0
      t.string :subject
      t.text :content
      t.references :property_inquiry, null: true, foreign_key: true
      t.references :customer_access, null: true, foreign_key: true
      t.references :property_publication, null: true, foreign_key: true
      t.timestamps

      t.index [:customer_id, :created_at]
      t.index :activity_type
    end
  end
end
