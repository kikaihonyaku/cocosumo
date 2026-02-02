# frozen_string_literal: true

class ApplicationMailbox < ActionMailbox::Base
  # {subdomain}-reply-{customer_id}-{inquiry_id}-{store_id}@inbound.cocosumo.space -> CustomerReplyMailbox
  # Example: test-reply-1-1-3@inbound.cocosumo.space
  routing(/-reply-\d+-\d+(?:-\d+)?@/i => :customer_reply)

  # {subdomain}-{store_code}-inquiry-{portal}@inbound.cocosumo.space -> PortalInquiryMailbox
  # Example: test-main01-inquiry-suumo@inbound.cocosumo.space
  routing(/-inquiry-(suumo|athome|homes|lifull)@/i => :portal_inquiry)

  # {subdomain}-{store_code}-inquiry@inbound.cocosumo.space -> PropertyInquiryMailbox
  # Example: test-main01-inquiry@inbound.cocosumo.space
  routing(/-inquiry@/i => :property_inquiry)

  # Default: bounce unrecognized emails
  routing :all => :bounces
end
