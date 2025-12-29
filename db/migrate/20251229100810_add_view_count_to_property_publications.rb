class AddViewCountToPropertyPublications < ActiveRecord::Migration[8.0]
  def change
    add_column :property_publications, :view_count, :integer, default: 0, null: false
  end
end
