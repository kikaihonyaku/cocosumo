class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.references :tenant, null: false, foreign_key: true
      t.string :email
      t.string :name
      t.string :password_digest
      t.integer :role
      t.string :auth_provider
      t.string :auth_uid

      t.timestamps
    end
  end
end
