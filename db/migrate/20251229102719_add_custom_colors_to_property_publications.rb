class AddCustomColorsToPropertyPublications < ActiveRecord::Migration[8.0]
  def change
    add_column :property_publications, :primary_color, :string
    add_column :property_publications, :accent_color, :string
  end
end
