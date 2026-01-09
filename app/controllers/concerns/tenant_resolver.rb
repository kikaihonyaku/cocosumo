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
    # production: tenant1.example.com -> tenant1
    request.subdomain.presence
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
