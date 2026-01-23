# frozen_string_literal: true

class GeocodeBuildingJob < ApplicationJob
  queue_as :default

  # Retry with exponential backoff for rate limiting
  retry_on StandardError, wait: :polynomially_longer, attempts: 5

  def perform(building_id)
    building = Building.find_by(id: building_id)
    return unless building
    return if building.location.present?
    return if building.address.blank?

    Rails.logger.info "[GeocodeBuildingJob] Geocoding building #{building_id}: #{building.address}"

    # Perform geocoding
    results = Geocoder.search(building.address)

    if results.present? && (result = results.first)
      building.update_columns(
        location: "POINT(#{result.longitude} #{result.latitude})"
      )
      Rails.logger.info "[GeocodeBuildingJob] Success: #{building.name} -> (#{result.latitude}, #{result.longitude})"
    else
      Rails.logger.warn "[GeocodeBuildingJob] No results for: #{building.address}"
    end
  rescue Geocoder::OverQueryLimitError => e
    Rails.logger.error "[GeocodeBuildingJob] Rate limit exceeded, will retry: #{e.message}"
    raise
  rescue StandardError => e
    Rails.logger.error "[GeocodeBuildingJob] Error geocoding building #{building_id}: #{e.message}"
    raise
  end
end
