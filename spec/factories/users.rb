# frozen_string_literal: true

FactoryBot.define do
  factory :user do
    tenant
    sequence(:email) { |n| "user#{n}@example.com" }
    sequence(:name) { |n| "User #{n}" }
    password { 'password123' }
    role { :member }

    trait :admin do
      role { :admin }
    end

    trait :super_admin do
      role { :super_admin }
    end
  end
end
