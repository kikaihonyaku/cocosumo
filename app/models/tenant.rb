class Tenant < ApplicationRecord
  # Associations
  has_many :users, dependent: :destroy
  has_many :buildings, dependent: :destroy
  has_many :stores, dependent: :destroy
  has_many :map_layers, dependent: :destroy
  has_many :customers, dependent: :destroy
  has_many :admin_audit_logs
  has_many :bulk_import_histories
  belongs_to :created_by, class_name: 'User', optional: true

  # Enums
  enum :status, { active: 0, suspended: 1, deleted: 2 }, default: :active

  # Validations
  validates :name, presence: true
  validates :subdomain, presence: true, uniqueness: true,
            format: { with: /\A[a-z0-9]([a-z0-9-]*[a-z0-9])?\z/,
                      message: 'は英小文字、数字、ハイフンのみ使用可能です' }
  validates :subdomain, exclusion: {
    in: %w[www admin api app mail ftp ssh assets],
    message: 'は予約されています'
  }

  # Scopes
  scope :ordered, -> { order(created_at: :desc) }

  # Serialize settings as JSON
  serialize :settings, coder: JSON

  # Methods
  def suspend!(reason: nil, by_user: nil)
    update!(status: :suspended, suspended_at: Time.current, suspended_reason: reason)
    AdminAuditLog.log_action(by_user, 'suspend', self, { reason: reason }) if by_user
  end

  def reactivate!(by_user: nil)
    update!(status: :active, suspended_at: nil, suspended_reason: nil)
    AdminAuditLog.log_action(by_user, 'reactivate', self) if by_user
  end

  def statistics
    {
      users_count: users.count,
      buildings_count: buildings.kept.count,
      rooms_count: Room.joins(:building).where(buildings: { tenant_id: id }).count,
      stores_count: stores.count
    }
  end
end
