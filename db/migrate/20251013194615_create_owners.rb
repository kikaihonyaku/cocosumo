class CreateOwners < ActiveRecord::Migration[8.0]
  def change
    create_table :owners do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :building, null: false, foreign_key: true
      t.string :name
      t.string :phone
      t.string :email
      t.string :address
      t.text :notes
      t.boolean :is_primary, default: false, null: false

      t.timestamps
    end
  end
end
