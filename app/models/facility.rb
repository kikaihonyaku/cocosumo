class Facility < ApplicationRecord
  has_many :facility_synonyms, dependent: :destroy
  has_many :room_facilities, dependent: :destroy
  has_many :rooms, through: :room_facilities

  validates :code, presence: true, uniqueness: true
  validates :name, presence: true
  validates :category, presence: true

  # カテゴリ定義
  CATEGORIES = {
    'kitchen' => 'キッチン',
    'bath_toilet' => 'バス・トイレ',
    'cooling_heating' => '冷暖房・空調',
    'security' => 'セキュリティ',
    'storage' => '収納',
    'communication' => '通信・放送',
    'laundry' => '洗濯',
    'interior' => '内装・設備',
    'building' => '共用設備',
    'other' => 'その他'
  }.freeze

  scope :active, -> { where(is_active: true) }
  scope :popular, -> { where(is_popular: true) }
  scope :by_category, ->(category) { where(category: category) }
  scope :ordered, -> { order(:category, :display_order) }

  def category_label
    CATEGORIES[category] || category
  end
end
