class Building < ApplicationRecord
  # Associations
  belongs_to :tenant
  has_many :rooms, dependent: :destroy
  has_many :owners, dependent: :destroy
  has_one_attached :exterior_image
  has_many_attached :photos

  # Validations
  validates :name, presence: true
  validates :address, presence: true
  validates :latitude, :longitude, presence: true, numericality: true
  validates :building_type, presence: true

  # Enum for building types
  enum :building_type, {
    apartment: 'apartment',
    mansion: 'mansion',
    house: 'house',
    office: 'office'
  }, prefix: true

  # Calculate vacant rooms count
  def vacant_rooms_count
    rooms.where(status: :vacant).count
  end

  # Calculate occupancy rate
  def occupancy_rate
    return 0 if total_units.zero?
    ((total_units - vacant_rooms_count).to_f / total_units * 100).round(1)
  end

  # 総戸数を返す（実際の部屋数）
  def room_cnt
    rooms.count
  end

  # 空室数を返す
  def free_cnt
    vacant_rooms_count
  end
end
