class RailwayLine < ApplicationRecord
  has_many :stations, dependent: :destroy

  validates :code, presence: true, uniqueness: true
  validates :name, presence: true
  validates :company, presence: true
  validates :company_code, presence: true

  scope :active, -> { where(is_active: true) }
  scope :ordered, -> { order(:display_order, :name) }
  scope :by_company, -> { order(:company_code, :display_order) }
end
