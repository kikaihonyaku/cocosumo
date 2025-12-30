# frozen_string_literal: true

FactoryBot.define do
  factory :property_publication do
    room
    sequence(:title) { |n| "Property Publication #{n}" }
    status { :draft }
    template_type { :template1 }

    trait :published do
      status { :published }
      published_at { Time.current }
    end

    trait :with_password do
      access_password { 'secret123' }
    end

    trait :expired do
      expires_at { 1.day.ago }
    end

    trait :not_expired do
      expires_at { 1.day.from_now }
    end

    trait :scheduled_publish do
      scheduled_publish_at { 1.hour.from_now }
    end

    trait :scheduled_unpublish do
      status { :published }
      published_at { 1.day.ago }
      scheduled_unpublish_at { 1.hour.from_now }
    end

    trait :with_catch_copy do
      catch_copy { 'おすすめ物件！駅近で便利です。' }
    end

    trait :with_pr_text do
      pr_text { '<p>この物件は駅から徒歩5分の好立地です。</p>' }
    end
  end
end
