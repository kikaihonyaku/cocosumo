class SendLineMessageJob < ApplicationJob
  queue_as :default

  retry_on LineMessageService::DeliveryError, wait: :polynomially_longer, attempts: 3
  discard_on LineMessageService::NotConfiguredError

  # @param tenant_id [Integer]
  # @param line_user_id [String]
  # @param message [Hash] LINE message object (type, text, etc.)
  # @param activity_id [Integer, nil] 送信結果を記録するActivityのID
  def perform(tenant_id, line_user_id, message, activity_id: nil)
    tenant = Tenant.find(tenant_id)
    service = LineMessageService.new(tenant)

    response = service.client.push_message(line_user_id, message)

    unless response.is_a?(Net::HTTPSuccess)
      error_msg = begin
        JSON.parse(response.body)["message"]
      rescue
        response.body
      end

      if activity_id
        activity = CustomerActivity.find_by(id: activity_id)
        activity&.update(metadata: (activity.metadata || {}).merge("error" => error_msg))
      end

      raise LineMessageService::DeliveryError, "LINE送信エラー: #{error_msg}"
    end
  end
end
