class CreateLineConfigs < ActiveRecord::Migration[8.0]
  def change
    create_table :line_configs do |t|
      t.references :tenant, null: false, foreign_key: true, index: { unique: true }
      t.string :channel_id
      t.string :channel_secret
      t.string :channel_token
      t.boolean :webhook_verified, default: false, null: false
      t.text :greeting_message
      t.string :rich_menu_id
      t.boolean :active, default: true, null: false

      t.timestamps
    end
  end
end
