class CreateCustomers < ActiveRecord::Migration[8.0]
  def change
    create_table :customers do |t|
      t.references :tenant, null: false, foreign_key: true
      t.string :email
      t.string :line_user_id
      t.string :name, null: false
      t.string :phone
      t.text :notes
      t.integer :status, default: 0, null: false
      t.datetime :last_contacted_at
      t.timestamps

      t.index [:tenant_id, :email], unique: true, where: "email IS NOT NULL AND email != ''"
      t.index [:tenant_id, :line_user_id], unique: true, where: "line_user_id IS NOT NULL"
    end
  end
end
