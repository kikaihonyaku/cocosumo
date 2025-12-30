# frozen_string_literal: true

FactoryBot.define do
  factory :building_route do
    building
    tenant { building.tenant }
    name { '駅まで' }
    route_type { 'station' }
    travel_mode { 'walking' }

    after(:build) do |route|
      factory = RGeo::Geographic.spherical_factory(srid: 4326)
      route.origin ||= factory.point(139.6503, 35.6762)
      route.destination ||= factory.point(139.7003, 35.6862)
    end

    trait :calculated do
      distance_meters { 500 }
      duration_seconds { 360 }
      encoded_polyline { 'a~l~Fjk~uOwHJy@P' }

      after(:build) do |route|
        factory = RGeo::Geographic.spherical_factory(srid: 4326)
        points = [
          factory.point(139.6503, 35.6762),
          factory.point(139.6603, 35.6812),
          factory.point(139.7003, 35.6862)
        ]
        route.route_geometry = factory.line_string(points)
      end
    end

    trait :school do
      name { '学校まで' }
      route_type { 'school' }
    end

    trait :custom do
      name { 'カスタム経路' }
      route_type { 'custom' }
    end

    trait :by_car do
      travel_mode { 'driving' }
    end

    trait :by_transit do
      travel_mode { 'transit' }
    end
  end
end
