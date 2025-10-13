class VrTour < ApplicationRecord
  # Associations
  belongs_to :room

  # Validations
  validates :title, presence: true

  # Serialize config as JSON
  serialize :config, coder: JSON

  # Enum for status
  enum :status, { draft: 0, published: 1, archived: 2 }, default: :draft

  # Generate embed code
  def embed_code(width: 800, height: 600)
    "<iframe src=\"#{embed_url}\" width=\"#{width}\" height=\"#{height}\" frameborder=\"0\" allowfullscreen></iframe>"
  end

  # Embed URL
  def embed_url
    Rails.application.routes.url_helpers.embed_vr_tour_url(self)
  end
end
