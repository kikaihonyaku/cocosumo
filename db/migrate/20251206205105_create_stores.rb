class CreateStores < ActiveRecord::Migration[8.0]
  def change
    create_table :stores do |t|
      t.references :tenant, null: false, foreign_key: true
      t.string :name, null: false
      t.string :address

      t.timestamps
    end
  end
end
