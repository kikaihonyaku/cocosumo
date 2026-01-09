class AdminAuditLog < ApplicationRecord
  belongs_to :user
  belongs_to :tenant, optional: true

  validates :action, presence: true

  ACTIONS = %w[
    create update delete
    impersonate_start impersonate_end
    suspend reactivate
    login logout
    tenant_switch
  ].freeze

  scope :recent, -> { order(created_at: :desc) }
  scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
  scope :by_action, ->(action) { where(action: action) }

  def self.log_action(user, action, resource = nil, extra_data = {})
    return unless user

    create!(
      user: user,
      tenant_id: resource.is_a?(Tenant) ? resource.id : resource&.try(:tenant_id),
      action: action,
      resource_type: resource&.class&.name,
      resource_id: resource&.id,
      changes: extra_data[:changes] || {},
      metadata: extra_data.except(:changes),
      ip_address: Thread.current[:request_ip],
      user_agent: Thread.current[:request_user_agent]
    )
  end
end
