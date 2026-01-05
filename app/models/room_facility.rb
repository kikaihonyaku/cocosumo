class RoomFacility < ApplicationRecord
  belongs_to :room
  belongs_to :facility

  validates :room_id, uniqueness: { scope: :facility_id }
end
