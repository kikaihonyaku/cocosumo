# frozen_string_literal: true

FactoryBot.define do
  factory :line_config do
    tenant
    channel_id { "1234567890" }
    channel_secret { "abcdef1234567890abcdef1234567890" }
    channel_token { "very_long_channel_access_token_string_here" }
    webhook_verified { false }
    active { true }
  end
end
