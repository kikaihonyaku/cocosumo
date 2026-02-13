class CreateMessageTrackings < ActiveRecord::Migration[8.0]
  def change
    create_table :message_trackings do |t|
      t.references :customer_activity, null: false, foreign_key: true
      t.string :token, null: false, index: { unique: true }
      t.string :destination_url, null: false
      t.timestamps
    end
  end
end
