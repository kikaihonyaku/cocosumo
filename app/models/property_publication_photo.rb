class PropertyPublicationPhoto < ApplicationRecord
  # Associations
  belongs_to :property_publication
  belongs_to :room_photo

  # Validations
  validates :property_publication_id, uniqueness: { scope: :room_photo_id }
  validates :display_order, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  # Scopes
  default_scope -> { order(:display_order) }
end
