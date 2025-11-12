class AddCommentToPropertyPublicationPhotos < ActiveRecord::Migration[8.0]
  def change
    add_column :property_publication_photos, :comment, :text
  end
end
