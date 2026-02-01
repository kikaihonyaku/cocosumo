class Station < ApplicationRecord
  belongs_to :railway_line
  has_many :building_stations, dependent: :destroy
  has_many :buildings, through: :building_stations

  validates :code, presence: true, uniqueness: true
  validates :name, presence: true

  scope :active, -> { where(is_active: true) }
  scope :ordered, -> { order(:display_order, :name) }

  scope :search_by_name, ->(query) {
    where("stations.name ILIKE :q OR stations.name_kana ILIKE :q", q: "%#{query}%")
  }

  def display_name
    "#{railway_line.name} #{name}駅"
  end
end
