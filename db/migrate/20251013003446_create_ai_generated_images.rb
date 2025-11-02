class CreateAiGeneratedImages < ActiveRecord::Migration[8.0]
  def change
    create_table :ai_generated_images do |t|
      t.references :room, null: false, foreign_key: true
      t.references :room_photo, null: false, foreign_key: true
      t.string :source_image_path
      t.string :generated_image_path
      t.string :generation_type
      t.text :prompt
      t.integer :status

      t.timestamps
    end
  end
end
