class CreateRooms < ActiveRecord::Migration[8.0]
  def change
    create_table :rooms do |t|
      t.references :building, null: false, foreign_key: true
      t.string :room_number
      t.integer :floor
      t.string :room_type
      t.decimal :area
      t.decimal :rent
      t.integer :status
      t.text :description

      t.timestamps
    end
  end
end
