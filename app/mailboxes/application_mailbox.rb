# frozen_string_literal: true

class ApplicationMailbox < ActionMailbox::Base
  # {subdomain}-inquiry-{portal}@inbound.cocosumo.space -> PortalInquiryMailbox
  # Example: test-inquiry-suumo@inbound.cocosumo.space
  routing(/-inquiry-(suumo|athome|homes|lifull)@/i => :portal_inquiry)

  # {subdomain}-inquiry@inbound.cocosumo.space -> PropertyInquiryMailbox
  # Example: test-inquiry@inbound.cocosumo.space
  routing(/-inquiry@/i => :property_inquiry)

  # Default: bounce unrecognized emails
  routing :all => :bounces
end
