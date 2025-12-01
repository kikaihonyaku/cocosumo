class CreateBlogPosts < ActiveRecord::Migration[8.0]
  def change
    create_table :blog_posts do |t|
      t.string :public_id, null: false
      t.string :title, null: false
      t.text :summary
      t.text :content, null: false
      t.string :thumbnail_url
      t.string :commit_hash
      t.integer :status, default: 0, null: false
      t.datetime :published_at

      t.timestamps
    end

    add_index :blog_posts, :public_id, unique: true
    add_index :blog_posts, [:status, :published_at]
  end
end
