class PresentationAccess < ApplicationRecord
  # bcryptによるパスワードハッシュ化
  has_secure_password validations: false

  # Associations
  belongs_to :property_publication

  # Delegations
  delegate :room, to: :property_publication
  delegate :building, to: :room
  delegate :tenant, to: :building

  # Validations
  validates :access_token, presence: true, uniqueness: true
  validates :password, length: { minimum: 4 }, allow_nil: true

  # Callbacks
  before_validation :generate_access_token, on: :create

  # Enums
  enum :status, { active: 0, revoked: 1, expired: 2 }, default: :active

  # Scopes
  scope :valid, -> { active.where("expires_at IS NULL OR expires_at > ?", Time.current) }
  scope :expired_by_date, -> { where("expires_at IS NOT NULL AND expires_at <= ?", Time.current) }
  scope :for_publication, ->(publication_id) { where(property_publication_id: publication_id) }
  scope :recent, -> { order(created_at: :desc) }

  # デフォルトステップ構成
  STEPS = %w[neighborhood building room vr notes].freeze
  STEP_LABELS = {
    "neighborhood" => "周辺環境",
    "building" => "建物情報",
    "room" => "部屋情報",
    "vr" => "VR・写真",
    "notes" => "注意事項"
  }.freeze

  # パスワード保護されているか
  def password_protected?
    password_digest.present?
  end

  # パスワード認証（bcrypt使用）
  def authenticate_password(password)
    return true unless password_protected?
    authenticate(password)
  end

  # 有効期限チェック
  def expired?
    expires_at.present? && expires_at < Time.current
  end

  # アクセス可能かどうか
  def accessible?
    active? && !expired?
  end

  # 公開URL生成
  def public_url
    base_url = Thread.current[:request_base_url] || tenant_base_url
    "#{base_url}/present/#{access_token}"
  end

  # テナント対応のベースURL（リクエストコンテキストがない場合のフォールバック）
  def tenant_base_url
    base_domain = ENV.fetch('APP_BASE_DOMAIN', 'cocosumo.space')
    protocol = Rails.env.production? ? 'https' : (ENV['APP_PROTOCOL'] || 'http')
    subdomain = tenant&.subdomain

    if subdomain.present?
      "#{protocol}://#{subdomain}.#{base_domain}"
    else
      "#{protocol}://#{base_domain}"
    end
  end

  # アクセス記録
  def record_access!(device_type: nil, ip_address: nil, user_agent: nil)
    now = Time.current

    self.first_accessed_at ||= now
    self.last_accessed_at = now
    increment!(:view_count)

    history_entry = {
      accessed_at: now.iso8601,
      device_type: device_type,
      ip_address: ip_address&.to_s&.first(50),
      user_agent: user_agent&.to_s&.first(200)
    }

    current_history = access_history || []
    current_history.unshift(history_entry)
    self.access_history = current_history.first(50)
    save!
  end

  # 取り消し
  def revoke!
    update!(status: :revoked)
  end

  # 有効期限延長
  def extend_expiry!(new_expires_at)
    update!(expires_at: new_expires_at, status: :active)
  end

  # 有効期限切れを一括更新（バッチ処理用）
  def self.mark_expired!
    expired_by_date.active.update_all(status: :expired)
  end

  # ステップ設定取得（デフォルト値込み）
  def effective_step_config
    default_config = STEPS.each_with_index.to_h do |step, i|
      [step, { "enabled" => true, "order" => i + 1, "talking_points" => [] }]
    end
    default_config.deep_merge(step_config || {})
  end

  # 有効なステップを順序通りに取得
  def ordered_steps
    effective_step_config
      .select { |_, config| config["enabled"] }
      .sort_by { |_, config| config["order"] }
      .map { |step, config| { key: step, label: STEP_LABELS[step], config: config } }
  end

  # 残り日数
  def days_until_expiry
    return nil unless expires_at
    ((expires_at - Time.current) / 1.day).ceil
  end

  private

  def generate_access_token
    return if access_token.present?

    loop do
      self.access_token = SecureRandom.urlsafe_base64(12)
      break unless PresentationAccess.exists?(access_token: access_token)
    end
  end
end
