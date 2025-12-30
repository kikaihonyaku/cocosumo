# frozen_string_literal: true

FactoryBot.define do
  factory :building do
    tenant
    sequence(:name) { |n| "Building #{n}" }
    sequence(:address) { |n| "東京都渋谷区渋谷#{n}-1-1" }
    building_type { 'apartment' }
    total_units { 10 }

    transient do
      lat { 35.6762 }
      lng { 139.6503 }
    end

    after(:build) do |building, evaluator|
      if evaluator.lat && evaluator.lng
        building.location = "POINT(#{evaluator.lng} #{evaluator.lat})"
      end
    end

    trait :mansion do
      building_type { 'mansion' }
    end

    trait :house do
      building_type { 'house' }
    end

    trait :office do
      building_type { 'office' }
    end

    trait :with_rooms do
      transient do
        rooms_count { 3 }
      end

      after(:create) do |building, evaluator|
        create_list(:room, evaluator.rooms_count, building: building)
      end
    end

    trait :with_vacant_rooms do
      transient do
        vacant_count { 2 }
        occupied_count { 1 }
      end

      after(:create) do |building, evaluator|
        create_list(:room, evaluator.vacant_count, building: building, status: :vacant)
        create_list(:room, evaluator.occupied_count, building: building, status: :occupied)
      end
    end
  end
end
