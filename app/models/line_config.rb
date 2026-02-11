class LineConfig < ApplicationRecord
  belongs_to :tenant

  encrypts :channel_id, :channel_secret, :channel_token

  validates :channel_id, :channel_secret, :channel_token, presence: true

  def configured?
    channel_id.present? && channel_secret.present? && channel_token.present? && active?
  end
end
