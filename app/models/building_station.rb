class BuildingStation < ApplicationRecord
  belongs_to :building
  belongs_to :station

  validates :building_id, uniqueness: { scope: :station_id }

  scope :ordered, -> { order(:display_order) }
end
