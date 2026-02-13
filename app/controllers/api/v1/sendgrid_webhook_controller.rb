class Api::V1::SendgridWebhookController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :verify_webhook_signature

  # POST /api/v1/sendgrid/webhook
  def receive
    events = JSON.parse(request.body.read)
    events.each { |event| process_event(event) }
    head :ok
  rescue JSON::ParserError
    head :bad_request
  end

  private

  def verify_webhook_signature
    verification_key = ENV["SENDGRID_WEBHOOK_VERIFICATION_KEY"]
    return if verification_key.blank? # Skip verification if key not configured

    signature = request.headers["X-Twilio-Email-Event-Webhook-Signature"]
    timestamp = request.headers["X-Twilio-Email-Event-Webhook-Timestamp"]

    unless signature.present? && timestamp.present?
      head :unauthorized
      return
    end

    payload = timestamp + request.body.read
    request.body.rewind

    expected = OpenSSL::PKey::EC.new(Base64.decode64(verification_key))
    digest = OpenSSL::Digest::SHA256.new
    unless expected.dsa_verify_asn1(digest.digest(payload), Base64.decode64(signature))
      head :unauthorized
    end
  rescue OpenSSL::PKey::ECError, ArgumentError
    head :unauthorized
  end

  def process_event(event)
    unique_args = event["unique_args"]
    return unless unique_args.is_a?(Hash)

    activity_id = unique_args["activity_id"]
    return unless activity_id

    activity = CustomerActivity.find_by(id: activity_id)
    return unless activity

    metadata = activity.metadata || {}

    case event["event"]
    when "delivered"
      metadata["email_delivered_at"] ||= event["timestamp"]
    when "open"
      metadata["email_opened_at"] ||= event["timestamp"]
      metadata["email_open_count"] = (metadata["email_open_count"] || 0) + 1
      metadata["email_last_opened_at"] = event["timestamp"]
    when "click"
      metadata["email_clicked_at"] ||= event["timestamp"]
      metadata["email_click_count"] = (metadata["email_click_count"] || 0) + 1
      metadata["email_last_clicked_at"] = event["timestamp"]
      metadata["email_clicked_url"] = event["url"]
    when "bounce"
      metadata["email_bounced_at"] = event["timestamp"]
      metadata["email_bounce_reason"] = event["reason"]
    when "dropped"
      metadata["email_dropped_at"] = event["timestamp"]
      metadata["email_drop_reason"] = event["reason"]
    end

    activity.update_column(:metadata, metadata)
  end
end
