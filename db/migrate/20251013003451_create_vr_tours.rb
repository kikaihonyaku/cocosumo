class CreateVrTours < ActiveRecord::Migration[8.0]
  def change
    create_table :vr_tours do |t|
      t.references :room, null: false, foreign_key: true
      t.string :title
      t.text :description
      t.text :config
      t.integer :status
      t.datetime :published_at

      t.timestamps
    end
  end
end
