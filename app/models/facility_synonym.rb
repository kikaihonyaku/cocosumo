class FacilitySynonym < ApplicationRecord
  belongs_to :facility

  validates :synonym, presence: true, uniqueness: true
end
