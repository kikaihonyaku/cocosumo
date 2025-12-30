# frozen_string_literal: true

FactoryBot.define do
  factory :room do
    building
    sequence(:room_number) { |n| "#{100 + n}" }
    floor { 1 }
    room_type { 'one_bedroom' }
    area { 25.5 }
    rent { 80000 }
    status { :vacant }
    management_fee { 5000 }
    deposit { 80000 }
    key_money { 80000 }

    trait :occupied do
      status { :occupied }
    end

    trait :vacant do
      status { :vacant }
    end

    trait :reserved do
      status { :reserved }
    end

    trait :maintenance do
      status { :maintenance }
    end

    trait :studio do
      room_type { 'studio' }
      area { 20.0 }
      rent { 60000 }
    end

    trait :one_ldk do
      room_type { 'one_ldk' }
      area { 35.0 }
      rent { 100000 }
    end

    trait :two_ldk do
      room_type { 'two_ldk' }
      area { 55.0 }
      rent { 150000 }
    end
  end
end
