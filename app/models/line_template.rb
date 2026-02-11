class LineTemplate < ApplicationRecord
  include Discard::Model

  belongs_to :tenant

  enum :message_type, { text: 0, image: 1, flex: 2 }, prefix: true

  validates :name, :content, presence: true

  scope :ordered, -> { order(:position, :name) }
end
