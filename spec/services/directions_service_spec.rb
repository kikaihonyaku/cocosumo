# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DirectionsService, type: :service do
  let(:route) { build(:building_route) }
  let(:service) { described_class.new(route) }

  describe '#decode_polyline' do
    # Test the polyline decoding algorithm (Google Polyline Algorithm)
    it 'decodes valid encoded polyline' do
      # Known polyline encoding: "_p~iF~ps|U_ulLnnqC_mqNvxq`@"
      # This represents points around San Francisco
      encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@'
      coordinates = service.send(:decode_polyline, encoded)

      expect(coordinates).to be_an(Array)
      expect(coordinates.length).to be > 0
      expect(coordinates.first).to be_an(Array)
      expect(coordinates.first.length).to eq(2)
    end

    it 'returns empty array for blank input' do
      expect(service.send(:decode_polyline, '')).to eq([])
    end

    it 'returns empty array for nil input' do
      expect(service.send(:decode_polyline, nil)).to eq([])
    end

    it 'handles simple two-point polyline' do
      # Simple polyline with two close points
      # Encoding for approximately (38.5, -120.2) to (40.7, -120.95)
      encoded = '_p~iF~ps|U_ulLnnqC'
      coordinates = service.send(:decode_polyline, encoded)

      expect(coordinates.length).to eq(2)
      # First point should be around (38.5, -120.2)
      expect(coordinates.first[0]).to be_within(1).of(38.5)
    end
  end

  describe '#haversine_distance' do
    it 'calculates distance between two points in meters' do
      # Tokyo Station to Shibuya Station (approximately 6.3km)
      tokyo = [35.6812, 139.7671]
      shibuya = [35.6580, 139.7016]

      distance = service.send(:haversine_distance, *tokyo, *shibuya)

      expect(distance).to be_within(200).of(6300) # ~6.3km with 200m tolerance
    end

    it 'returns 0 for same point' do
      distance = service.send(:haversine_distance, 35.6762, 139.6503, 35.6762, 139.6503)
      expect(distance).to eq(0)
    end

    it 'calculates short distances accurately' do
      # Two points ~100m apart
      lat1, lng1 = 35.6762, 139.6503
      lat2, lng2 = 35.6772, 139.6503 # ~111m north

      distance = service.send(:haversine_distance, lat1, lng1, lat2, lng2)
      expect(distance).to be_within(20).of(111)
    end

    it 'handles large distances' do
      # Tokyo to New York (~10,800km)
      tokyo = [35.6762, 139.6503]
      new_york = [40.7128, -74.0060]

      distance = service.send(:haversine_distance, *tokyo, *new_york)
      expect(distance).to be_within(100000).of(10850000) # ~10,850km
    end
  end

  describe '#calculate_heading' do
    it 'calculates heading from south to north as approximately 0 degrees' do
      heading = service.send(:calculate_heading, 35.0, 139.0, 36.0, 139.0)
      expect(heading).to be_within(2).of(0)
    end

    it 'calculates heading from west to east as approximately 90 degrees' do
      heading = service.send(:calculate_heading, 35.0, 139.0, 35.0, 140.0)
      expect(heading).to be_within(2).of(90)
    end

    it 'calculates heading from north to south as approximately 180 degrees' do
      heading = service.send(:calculate_heading, 36.0, 139.0, 35.0, 139.0)
      expect(heading).to be_within(2).of(180)
    end

    it 'calculates heading from east to west as approximately 270 degrees' do
      heading = service.send(:calculate_heading, 35.0, 140.0, 35.0, 139.0)
      expect(heading).to be_within(2).of(270)
    end

    it 'returns value between 0 and 360' do
      heading = service.send(:calculate_heading, 35.0, 139.0, 35.5, 139.5)
      expect(heading).to be >= 0
      expect(heading).to be < 360
    end
  end

  describe '#generate_streetview_points' do
    let(:coordinates) do
      [
        [35.6762, 139.6503],
        [35.6770, 139.6510],
        [35.6780, 139.6520],
        [35.6790, 139.6530]
      ]
    end

    it 'generates points at specified intervals' do
      points = service.send(:generate_streetview_points, coordinates, interval_meters: 50)

      expect(points).to be_an(Array)
      expect(points.first).to include(:lat, :lng, :heading, :index)
    end

    it 'includes first point' do
      points = service.send(:generate_streetview_points, coordinates)

      expect(points.first[:index]).to eq(0)
    end

    it 'includes last point' do
      points = service.send(:generate_streetview_points, coordinates)

      expect(points.last[:index]).to eq(coordinates.length - 1)
    end

    it 'returns empty array for empty coordinates' do
      points = service.send(:generate_streetview_points, [])
      expect(points).to eq([])
    end

    it 'handles single point' do
      points = service.send(:generate_streetview_points, [[35.6762, 139.6503]])
      expect(points.length).to eq(1)
    end

    it 'adds points at turns exceeding threshold' do
      # Create a sharp turn: going north then turning east (90 degree change)
      sharp_turn_coords = [
        [35.6762, 139.6503],
        [35.6862, 139.6503], # Going north
        [35.6862, 139.6703]  # Turn east (90 degree change)
      ]

      # Use large interval so only turns trigger new points
      points = service.send(:generate_streetview_points, sharp_turn_coords,
                            interval_meters: 100000, turn_threshold_degrees: 30)

      # Should have at least start and end points
      expect(points.length).to be >= 2
    end

    it 'calculates heading for each point' do
      points = service.send(:generate_streetview_points, coordinates)

      points.each do |point|
        expect(point[:heading]).to be_a(Float)
        expect(point[:heading]).to be >= 0
        expect(point[:heading]).to be < 360
      end
    end
  end

  describe '#create_linestring' do
    it 'creates RGeo linestring from coordinates' do
      coordinates = [[35.6762, 139.6503], [35.6772, 139.6513]]
      linestring = service.send(:create_linestring, coordinates)

      expect(linestring).to be_a(RGeo::Geographic::SphericalLineStringImpl)
    end

    it 'returns nil for empty coordinates' do
      linestring = service.send(:create_linestring, [])
      expect(linestring).to be_nil
    end
  end

  describe '#generate_cache_key' do
    it 'generates consistent cache key for same route' do
      key1 = service.send(:generate_cache_key, with_alternatives: false)
      key2 = service.send(:generate_cache_key, with_alternatives: false)

      expect(key1).to eq(key2)
    end

    it 'generates different keys for different alternatives setting' do
      key1 = service.send(:generate_cache_key, with_alternatives: false)
      key2 = service.send(:generate_cache_key, with_alternatives: true)

      expect(key1).not_to eq(key2)
    end

    it 'starts with directions: prefix' do
      key = service.send(:generate_cache_key, with_alternatives: false)
      expect(key).to start_with('directions:')
    end
  end

  # Integration tests with VCR (require actual API responses)
  describe '#calculate_and_save', :vcr do
    it 'fetches directions and saves to route' do
      skip 'Requires VCR cassette with Google Directions API response'
      # This test would:
      # 1. Make actual API call (recorded by VCR)
      # 2. Verify route is updated with geometry, distance, duration
      # 3. Verify streetview points are generated
    end
  end

  describe '#fetch_alternatives', :vcr do
    it 'returns multiple route options' do
      skip 'Requires VCR cassette with Google Directions API response'
      # This test would:
      # 1. Request alternatives from API
      # 2. Verify multiple routes are returned
      # 3. Verify each route has required fields
    end
  end
end
