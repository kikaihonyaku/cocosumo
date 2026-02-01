class CreateEmailTemplates < ActiveRecord::Migration[8.0]
  def change
    create_table :email_templates do |t|
      t.references :tenant, null: false, foreign_key: true
      t.string :name, null: false
      t.string :subject, null: false
      t.text :body, null: false
      t.integer :position, default: 0
      t.datetime :discarded_at

      t.timestamps
    end
  end
end
