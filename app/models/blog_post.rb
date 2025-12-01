class BlogPost < ApplicationRecord
  # Validations
  validates :public_id, presence: true, uniqueness: true
  validates :title, presence: true
  validates :content, presence: true
  validates :status, presence: true

  # Callbacks
  before_validation :generate_public_id, on: :create

  # Enum for status
  enum :status, { draft: 0, published: 1 }, default: :draft

  # Scopes
  scope :published, -> { where(status: :published).order(published_at: :desc) }
  scope :recent, ->(limit = 3) { published.limit(limit) }

  # Publish the blog post
  def publish!
    update!(status: :published, published_at: Time.current)
  end

  # Unpublish the blog post
  def unpublish!
    update!(status: :draft, published_at: nil)
  end

  # Get public URL
  def public_url
    return nil unless published?
    "/blog/#{public_id}"
  end

  private

  def generate_public_id
    return if public_id.present?

    loop do
      self.public_id = SecureRandom.alphanumeric(12).downcase
      break unless BlogPost.exists?(public_id: public_id)
    end
  end
end
