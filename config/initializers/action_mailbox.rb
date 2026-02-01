# frozen_string_literal: true

# Action Mailbox ingress password configuration
# This password is used to authenticate incoming emails from SendGrid
#
# Set the ACTION_MAILBOX_INGRESS_PASSWORD environment variable in production
#
# SendGrid Inbound Parse configuration:
#   - Receiving Domain: inbound.cocosumo.space
#   - Destination URL: https://actionmailbox:PASSWORD@cocosumo.space/rails/action_mailbox/sendgrid/inbound_emails
#
# Store email addresses: {subdomain}-s{store_id}-inquiry@inbound.cocosumo.space
#   Example: test-s3-inquiry@inbound.cocosumo.space
# Legacy format (backward compatible): {subdomain}-inquiry@inbound.cocosumo.space

if ENV['ACTION_MAILBOX_INGRESS_PASSWORD'].present?
  Rails.application.config.action_mailbox.ingress_password = ENV['ACTION_MAILBOX_INGRESS_PASSWORD']
end
