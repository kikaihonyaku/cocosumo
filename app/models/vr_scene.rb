class VrScene < ApplicationRecord
  # Associations
  belongs_to :vr_tour
  belongs_to :room_photo

  # Validations
  validates :title, presence: true
  validates :display_order, numericality: { only_integer: true }, allow_nil: true

  # Serialize JSON fields
  serialize :initial_view, coder: JSON
  serialize :hotspots, coder: JSON
  serialize :minimap_position, coder: JSON

  # Default scope - order by display_order
  default_scope -> { order(display_order: :asc) }

  # Get photo URL
  def photo_url
    return nil unless room_photo&.photo&.attached?

    if Rails.env.production?
      room_photo.photo.url
    else
      Rails.application.routes.url_helpers.rails_blob_path(room_photo.photo, only_path: true)
    end
  end
end
