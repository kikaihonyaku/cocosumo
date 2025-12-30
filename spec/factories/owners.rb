# frozen_string_literal: true

FactoryBot.define do
  factory :owner do
    tenant
    building
    sequence(:name) { |n| "Owner #{n}" }
    sequence(:email) { |n| "owner#{n}@example.com" }
    phone { '090-1234-5678' }
    is_primary { false }

    trait :primary do
      is_primary { true }
    end
  end
end
