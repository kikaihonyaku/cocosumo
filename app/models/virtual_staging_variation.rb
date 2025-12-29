class VirtualStagingVariation < ApplicationRecord
  belongs_to :virtual_staging
  belongs_to :after_photo, class_name: 'RoomPhoto'

  validates :style_name, presence: true
  validates :display_order, numericality: { only_integer: true }, allow_nil: true

  default_scope { order(display_order: :asc) }

  def after_photo_url
    after_photo&.photo_url
  end
end
