module TenantResolver
  extend ActiveSupport::Concern

  included do
    before_action :resolve_tenant_from_subdomain
    before_action :store_request_info
  end

  private

  def resolve_tenant_from_subdomain
    subdomain = extract_subdomain
    return if subdomain.blank? || reserved_subdomain?(subdomain)

    @resolved_tenant = Tenant.active.find_by(subdomain: subdomain)
  end

  def extract_subdomain
    # lvh.me: tenant1.lvh.me -> tenant1
    # production: tenant1.cocosumo.space -> tenant1
    # sslip.io: tenant1.192.168.0.14.sslip.io -> tenant1
    host = request.host
    if host.end_with?('.sslip.io')
      # sslip.io: remove IP and sslip.io part, take first segment
      parts = host.delete_suffix('.sslip.io').split('.')
      # tenant1.192.168.0.14 -> parts = ["tenant1", "192", "168", "0", "14"]
      parts.first if parts.size > 4
    else
      request.subdomain.presence
    end
  end

  def reserved_subdomain?(subdomain)
    %w[www admin api app mail ftp ssh assets].include?(subdomain)
  end

  def store_request_info
    Thread.current[:request_ip] = request.remote_ip
    Thread.current[:request_user_agent] = request.user_agent
    Thread.current[:request_base_url] = "#{request.protocol}#{request.host_with_port}"
  end
end
