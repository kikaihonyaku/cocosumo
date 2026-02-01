# frozen_string_literal: true

class ApplicationMailbox < ActionMailbox::Base
  # {subdomain}-reply-{customer_id}-{inquiry_id}-{store_id}@inbound.cocosumo.space -> CustomerReplyMailbox
  # Example: test-reply-1-1-3@inbound.cocosumo.space
  routing(/-reply-\d+-\d+(?:-\d+)?@/i => :customer_reply)

  # 新形式: {subdomain}-s{store_id}-inquiry-{portal}@inbound.cocosumo.space -> PortalInquiryMailbox
  # 旧形式: {subdomain}-inquiry-{portal}@inbound.cocosumo.space（後方互換）
  # Example: test-s3-inquiry-suumo@inbound.cocosumo.space
  routing(/-inquiry-(suumo|athome|homes|lifull)@/i => :portal_inquiry)

  # 新形式: {subdomain}-s{store_id}-inquiry@inbound.cocosumo.space -> PropertyInquiryMailbox
  # 旧形式: {subdomain}-inquiry@inbound.cocosumo.space（後方互換）
  # Example: test-s3-inquiry@inbound.cocosumo.space
  routing(/-inquiry@/i => :property_inquiry)

  # Default: bounce unrecognized emails
  routing :all => :bounces
end
