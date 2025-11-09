class PropertyPublicationVirtualStaging < ApplicationRecord
  # Associations
  belongs_to :property_publication
  belongs_to :virtual_staging

  # Validations
  validates :property_publication_id, uniqueness: { scope: :virtual_staging_id }
  validates :display_order, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  # Scopes
  default_scope -> { order(:display_order) }
end
