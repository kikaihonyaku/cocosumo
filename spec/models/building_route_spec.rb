# frozen_string_literal: true

require 'rails_helper'

RSpec.describe BuildingRoute, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:building) }
    it { is_expected.to belong_to(:tenant) }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:route_type) }
    it { is_expected.to validate_inclusion_of(:route_type).in_array(BuildingRoute::ROUTE_TYPES) }
    it { is_expected.to validate_inclusion_of(:travel_mode).in_array(BuildingRoute::TRAVEL_MODES) }
  end

  describe '#origin_latlng=' do
    let(:route) { build(:building_route) }

    it 'sets origin from hash with lat/lng' do
      route.origin_latlng = { lat: 35.6762, lng: 139.6503 }

      expect(route.origin).to be_present
      expect(route.origin.y).to be_within(0.0001).of(35.6762)
      expect(route.origin.x).to be_within(0.0001).of(139.6503)
    end

    it 'ignores invalid input (string)' do
      original_origin = route.origin
      route.origin_latlng = 'invalid'
      expect(route.origin).to eq(original_origin)
    end

    it 'ignores input missing lat' do
      original_origin = route.origin
      route.origin_latlng = { lng: 139.6503 }
      expect(route.origin).to eq(original_origin)
    end

    it 'ignores input missing lng' do
      original_origin = route.origin
      route.origin_latlng = { lat: 35.6762 }
      expect(route.origin).to eq(original_origin)
    end

    it 'converts string values to float' do
      route.origin_latlng = { lat: '35.6762', lng: '139.6503' }
      expect(route.origin.y).to be_within(0.0001).of(35.6762)
    end
  end

  describe '#destination_latlng=' do
    let(:route) { build(:building_route) }

    it 'sets destination from hash with lat/lng' do
      route.destination_latlng = { lat: 35.6862, lng: 139.7003 }

      expect(route.destination).to be_present
      expect(route.destination.y).to be_within(0.0001).of(35.6862)
      expect(route.destination.x).to be_within(0.0001).of(139.7003)
    end
  end

  describe '#origin_latlng' do
    let(:route) { build(:building_route) }

    it 'returns lat/lng hash' do
      result = route.origin_latlng
      expect(result).to be_a(Hash)
      expect(result[:lat]).to be_present
      expect(result[:lng]).to be_present
    end

    it 'returns nil when origin is not set' do
      route.origin = nil
      expect(route.origin_latlng).to be_nil
    end
  end

  describe '#destination_latlng' do
    let(:route) { build(:building_route) }

    it 'returns lat/lng hash' do
      result = route.destination_latlng
      expect(result).to be_a(Hash)
      expect(result[:lat]).to be_present
      expect(result[:lng]).to be_present
    end
  end

  describe '#calculated?' do
    it 'returns true when route has geometry and polyline' do
      route = build(:building_route, :calculated)
      expect(route.calculated?).to be true
    end

    it 'returns false when missing geometry' do
      route = build(:building_route, encoded_polyline: 'abc', route_geometry: nil)
      expect(route.calculated?).to be false
    end

    it 'returns false when missing polyline' do
      route = build(:building_route, encoded_polyline: nil)
      expect(route.calculated?).to be false
    end
  end

  describe '#formatted_distance' do
    it 'returns meters for short distances' do
      route = build(:building_route, distance_meters: 500)
      expect(route.formatted_distance).to eq('500m')
    end

    it 'returns kilometers for distances >= 1000m' do
      route = build(:building_route, distance_meters: 1500)
      expect(route.formatted_distance).to eq('1.5km')
    end

    it 'returns nil when distance is nil' do
      route = build(:building_route, distance_meters: nil)
      expect(route.formatted_distance).to be_nil
    end

    it 'rounds to one decimal place for kilometers' do
      route = build(:building_route, distance_meters: 2345)
      expect(route.formatted_distance).to eq('2.3km')
    end
  end

  describe '#formatted_duration' do
    it 'returns minutes for short durations' do
      route = build(:building_route, duration_seconds: 300)
      expect(route.formatted_duration).to eq('5分')
    end

    it 'returns hours and minutes for long durations' do
      route = build(:building_route, duration_seconds: 3900)
      expect(route.formatted_duration).to eq('1時間5分')
    end

    it 'returns nil when duration is nil' do
      route = build(:building_route, duration_seconds: nil)
      expect(route.formatted_duration).to be_nil
    end

    it 'rounds up to nearest minute' do
      route = build(:building_route, duration_seconds: 65)
      expect(route.formatted_duration).to eq('2分')
    end
  end

  describe '#route_type_label' do
    it 'returns 駅まで for station' do
      route = build(:building_route, route_type: 'station')
      expect(route.route_type_label).to eq('駅まで')
    end

    it 'returns 学校まで for school' do
      route = build(:building_route, route_type: 'school')
      expect(route.route_type_label).to eq('学校まで')
    end

    it 'returns カスタム for custom' do
      route = build(:building_route, route_type: 'custom')
      expect(route.route_type_label).to eq('カスタム')
    end
  end

  describe '#as_json' do
    let(:route) { build(:building_route, :calculated) }

    it 'includes computed fields' do
      json = route.as_json

      expect(json).to include(
        'origin_latlng',
        'destination_latlng',
        'formatted_distance',
        'formatted_duration',
        'route_type_label',
        'calculated'
      )
    end
  end

  describe 'scopes' do
    let(:building) { create(:building) }
    let!(:station_route) { create(:building_route, building: building, route_type: 'station') }
    let!(:school_route) { create(:building_route, :school, building: building) }

    describe '.by_type' do
      it 'filters by route type' do
        expect(described_class.by_type('station')).to include(station_route)
        expect(described_class.by_type('station')).not_to include(school_route)
      end
    end
  end
end
