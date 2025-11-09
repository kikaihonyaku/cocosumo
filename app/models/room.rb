class Room < ApplicationRecord
  # Associations
  belongs_to :building
  has_many :room_photos, dependent: :destroy
  has_many :ai_generated_images, dependent: :destroy
  has_many :vr_tours, dependent: :destroy
  has_many :virtual_stagings, dependent: :destroy
  has_many :property_publications, dependent: :destroy

  # Validations
  validates :room_number, presence: true
  validates :floor, presence: true, numericality: { only_integer: true }
  validates :area, numericality: { greater_than: 0 }, allow_nil: true
  validates :rent, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  # Enum for room status
  enum :status, { vacant: 0, occupied: 1, reserved: 2, maintenance: 3 }, default: :vacant

  # Enum for room types
  enum :room_type, {
    studio: 'studio',
    one_bedroom: '1K',
    one_dk: '1DK',
    one_ldk: '1LDK',
    two_bedroom: '2K',
    two_dk: '2DK',
    two_ldk: '2LDK',
    three_bedroom: '3K',
    three_dk: '3DK',
    three_ldk: '3LDK',
    other: 'other'
  }, prefix: true

  # ステータス表示用
  def status_label
    case status
    when 'vacant' then '空室'
    when 'occupied' then '入居中'
    when 'reserved' then '予約済'
    when 'maintenance' then 'メンテナンス中'
    else status
    end
  end

  # 部屋タイプ表示用
  def room_type_label
    case room_type
    when 'studio' then 'ワンルーム'
    when 'one_bedroom' then '1K'
    when 'one_dk' then '1DK'
    when 'one_ldk' then '1LDK'
    when 'two_bedroom' then '2K'
    when 'two_dk' then '2DK'
    when 'two_ldk' then '2LDK'
    when 'three_bedroom' then '3K'
    when 'three_dk' then '3DK'
    when 'three_ldk' then '3LDK'
    when 'other' then 'その他'
    else room_type
    end
  end
end
