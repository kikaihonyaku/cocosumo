# frozen_string_literal: true

FactoryBot.define do
  factory :customer do
    tenant
    sequence(:name) { |n| "Customer #{n}" }
    sequence(:email) { |n| "customer#{n}@example.com" }
    phone { "090-1234-5678" }
    deal_status { :new_inquiry }
    priority { :normal }
    status { :active }
  end
end
