class MessageTracking < ApplicationRecord
  belongs_to :customer_activity

  validates :token, presence: true, uniqueness: true
  validates :destination_url, presence: true

  before_create :generate_token

  def record_click!
    activity = customer_activity
    metadata = activity.metadata || {}
    metadata["line_link_clicked_at"] ||= Time.current.to_i
    metadata["line_click_count"] = (metadata["line_click_count"] || 0) + 1
    metadata["line_last_clicked_at"] = Time.current.to_i
    activity.update_column(:metadata, metadata)
  end

  private

  def generate_token
    self.token = SecureRandom.urlsafe_base64(16) if token.blank?
  end
end
