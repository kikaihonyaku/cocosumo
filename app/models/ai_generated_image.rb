class AiGeneratedImage < ApplicationRecord
  # Associations
  belongs_to :room
  belongs_to :original_photo, class_name: 'RoomPhoto', optional: true
  has_one_attached :source_image
  has_one_attached :generated_image

  # Validations
  validates :generation_type, presence: true

  # Enum for generation types
  enum :generation_type, {
    unfurnished: 'unfurnished',
    furnished: 'furnished',
    modern: 'modern',
    traditional: 'traditional'
  }, prefix: true

  # Enum for status
  enum :status, { pending: 0, processing: 1, completed: 2, failed: 3 }, default: :pending
end
