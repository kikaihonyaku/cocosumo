class CustomerAccess < ApplicationRecord
  # bcryptによるパスワードハッシュ化
  has_secure_password validations: false

  # Associations
  belongs_to :property_publication
  has_many :customer_routes, dependent: :destroy

  # Delegations
  delegate :room, to: :property_publication
  delegate :building, to: :room
  delegate :tenant, to: :building

  # Validations
  validates :access_token, presence: true, uniqueness: true
  validates :customer_name, presence: true
  validates :customer_email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 6 }, allow_nil: true

  # Callbacks
  before_validation :generate_access_token, on: :create

  # Enums
  enum :status, { active: 0, revoked: 1, expired: 2 }, default: :active

  # Scopes
  scope :valid, -> { active.where("expires_at IS NULL OR expires_at > ?", Time.current) }
  scope :expired_by_date, -> { where("expires_at IS NOT NULL AND expires_at <= ?", Time.current) }
  scope :for_publication, ->(publication_id) { where(property_publication_id: publication_id) }
  scope :by_email, ->(email) { where(customer_email: email) }
  scope :recent, -> { order(created_at: :desc) }

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
    "/customer/#{access_token}"
  end

  # アクセス記録
  def record_access!(device_type: nil, ip_address: nil, user_agent: nil)
    now = Time.current

    # 基本統計更新
    self.first_accessed_at ||= now
    self.last_accessed_at = now
    increment!(:view_count)

    # アクセス履歴追加（直近100件まで保持）
    history_entry = {
      accessed_at: now.iso8601,
      device_type: device_type,
      ip_address: ip_address&.to_s&.first(50),
      user_agent: user_agent&.to_s&.first(200)
    }

    current_history = access_history || []
    current_history.unshift(history_entry)
    self.access_history = current_history.first(100)
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

  # フォーマット済み有効期限
  def formatted_expires_at
    return nil unless expires_at
    expires_at.strftime("%Y年%m月%d日 %H:%M")
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
      self.access_token = SecureRandom.urlsafe_base64(16)
      break unless CustomerAccess.exists?(access_token: access_token)
    end
  end
end
