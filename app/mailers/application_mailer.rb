class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch('MAILER_FROM_ADDRESS', 'noreply@cocosumo.space')
  layout "mailer"

  private

  # テナント対応のベースURLを生成
  # tenant: Tenantオブジェクトまたはサブドメイン文字列
  def tenant_base_url(tenant)
    subdomain = tenant.is_a?(Tenant) ? tenant.subdomain : tenant
    base_domain = ENV.fetch('APP_BASE_DOMAIN', 'cocosumo.space')
    protocol = Rails.env.production? ? 'https' : (ENV['APP_PROTOCOL'] || 'http')

    if subdomain.present?
      "#{protocol}://#{subdomain}.#{base_domain}"
    else
      "#{protocol}://#{base_domain}"
    end
  end
end
