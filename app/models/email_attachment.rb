class EmailAttachment < ApplicationRecord
  belongs_to :customer_activity

  has_one_attached :file

  validates :filename, presence: true
  validates :byte_size, numericality: { less_than_or_equal_to: 10.megabytes }, allow_nil: true
end
