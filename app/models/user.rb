class User < ApplicationRecord
  # Associations
  belongs_to :tenant
  belongs_to :store

  # Secure password
  has_secure_password validations: false

  # Enums
  enum :role, { member: 0, admin: 1, super_admin: 2 }, default: :member

  # Validations
  validates :email, presence: true, uniqueness: { scope: :tenant_id }
  validates :name, presence: true
  validates :password, length: { minimum: 6 }, allow_nil: true, if: -> { auth_provider.nil? }
  validates :phone, format: { with: /\A[\d\-+]+\z/, message: "は数字とハイフンのみ使用できます" }, allow_blank: true

  # Scopes
  scope :admins, -> { where(role: [:admin, :super_admin]) }
  scope :active, -> { where(active: true) }
  scope :inactive, -> { where(active: false) }
  scope :locked, -> { where.not(locked_at: nil) }
  scope :unlocked, -> { where(locked_at: nil) }

  # アカウントロック関連
  MAX_FAILED_LOGIN_ATTEMPTS = 5
  LOCK_DURATION = 30.minutes

  def locked?
    locked_at.present? && locked_at > LOCK_DURATION.ago
  end

  def lock!
    update!(locked_at: Time.current)
  end

  def unlock!
    update!(locked_at: nil, failed_login_count: 0)
  end

  def increment_failed_login!
    increment!(:failed_login_count)
    lock! if failed_login_count >= MAX_FAILED_LOGIN_ATTEMPTS
  end

  def reset_failed_login!
    update!(failed_login_count: 0) if failed_login_count > 0
  end

  def record_login!
    update!(last_login_at: Time.current)
    reset_failed_login!
  end

  # パスワード変更時に日時を記録
  def password=(new_password)
    super
    self.password_changed_at = Time.current if new_password.present?
  end

  # アカウントが有効かどうか
  def can_login?
    active? && !locked?
  end

  # 通知設定のヘルパー
  def notification_enabled?(type)
    notification_settings&.dig(type.to_s) != false
  end

  def update_notification_setting(type, enabled)
    self.notification_settings ||= {}
    self.notification_settings[type.to_s] = enabled
    save
  end
end
