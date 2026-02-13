class LineConfig < ApplicationRecord
  belongs_to :tenant

  encrypts :channel_id, :channel_secret, :channel_token

  validates :channel_id, :channel_secret, :channel_token, presence: true
  validates :friend_add_url, format: { with: /\Ahttps:\/\/(line\.me|lin\.ee)\//,
    message: "はLINEのURL（https://line.me/ または https://lin.ee/）を指定してください" },
    allow_blank: true

  def configured?
    channel_id.present? && channel_secret.present? && channel_token.present? && active?
  end

  def line_guidance_available?
    friend_add_url.present? && active?
  end
end
