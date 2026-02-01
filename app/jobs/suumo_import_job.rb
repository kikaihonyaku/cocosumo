# frozen_string_literal: true

class SuumoImportJob < ApplicationJob
  queue_as :default

  # Retry settings
  retry_on StandardError, wait: 5.seconds, attempts: 3

  def perform(tenant_id:, url:, options: {}, history_id: nil)
    Rails.logger.info "[SuumoImportJob] Starting import for tenant #{tenant_id}"
    Rails.logger.info "[SuumoImportJob] URL: #{url}"
    Rails.logger.info "[SuumoImportJob] Options: #{options}"

    history = SuumoImportHistory.find_by(id: history_id)
    history&.start!

    tenant = Tenant.find(tenant_id)

    service = Suumo::ScraperService.new(
      tenant: tenant,
      options: options.symbolize_keys
    )

    stats = service.scrape(url)

    Rails.logger.info "[SuumoImportJob] Completed. Stats: #{stats}"

    history&.complete!(stats)

    stats
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.error "[SuumoImportJob] Tenant not found: #{tenant_id}"
    history&.fail!(e.message)
    raise
  rescue Suumo::ScraperService::ScrapingError => e
    Rails.logger.error "[SuumoImportJob] Scraping error: #{e.message}"
    history&.fail!(e.message)
    raise
  rescue StandardError => e
    Rails.logger.error "[SuumoImportJob] Unexpected error: #{e.message}"
    Rails.logger.error e.backtrace.first(10).join("\n")
    history&.fail!(e.message)
    raise
  end
end
