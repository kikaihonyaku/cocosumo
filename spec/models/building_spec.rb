# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Building, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:tenant) }
    it { is_expected.to belong_to(:store).optional }
    it { is_expected.to have_many(:rooms).dependent(:destroy) }
    it { is_expected.to have_many(:owners).dependent(:destroy) }
    it { is_expected.to have_many(:building_routes).dependent(:destroy) }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:address) }
    it { is_expected.to validate_presence_of(:building_type) }
  end

  describe 'enums' do
    it { is_expected.to define_enum_for(:building_type).with_values(apartment: 'apartment', mansion: 'mansion', house: 'house', office: 'office').with_prefix(true) }
  end

  describe '.within_bounds' do
    let!(:tenant) { create(:tenant) }
    let!(:building_inside) { create(:building, tenant: tenant, lat: 35.68, lng: 139.75) }
    let!(:building_outside) { create(:building, tenant: tenant, lat: 35.50, lng: 139.50) }

    it 'returns buildings within rectangular bounds' do
      result = described_class.within_bounds(35.65, 139.70, 35.70, 139.80)
      expect(result).to include(building_inside)
      expect(result).not_to include(building_outside)
    end

    it 'returns empty when no buildings in bounds' do
      result = described_class.within_bounds(40.0, 140.0, 41.0, 141.0)
      expect(result).to be_empty
    end
  end

  describe '.within_radius' do
    let!(:tenant) { create(:tenant) }
    let!(:building_near) { create(:building, tenant: tenant, lat: 35.6762, lng: 139.6503) }
    let!(:building_far) { create(:building, tenant: tenant, lat: 36.0, lng: 140.0) }

    it 'returns buildings within specified radius' do
      result = described_class.within_radius(35.6762, 139.6503, 1000) # 1km
      expect(result).to include(building_near)
      expect(result).not_to include(building_far)
    end
  end

  describe '.nearest' do
    let!(:tenant) { create(:tenant) }
    let!(:building1) { create(:building, tenant: tenant, lat: 35.6762, lng: 139.6503) }
    let!(:building2) { create(:building, tenant: tenant, lat: 35.6770, lng: 139.6510) }
    let!(:building3) { create(:building, tenant: tenant, lat: 35.6800, lng: 139.6600) }

    it 'returns nearest buildings limited by count' do
      result = described_class.nearest(35.6762, 139.6503, 2)
      expect(result.count).to eq(2)
      expect(result.first).to eq(building1)
    end
  end

  describe '#latitude and #longitude' do
    let(:building) { create(:building, lat: 35.6762, lng: 139.6503) }

    it 'returns latitude from location point' do
      expect(building.latitude).to be_within(0.0001).of(35.6762)
    end

    it 'returns longitude from location point' do
      expect(building.longitude).to be_within(0.0001).of(139.6503)
    end
  end

  describe '#vacant_rooms_count' do
    let(:building) { create(:building) }

    before do
      create_list(:room, 2, building: building, status: :occupied)
      create_list(:room, 3, building: building, status: :vacant)
    end

    it 'returns count of vacant rooms' do
      expect(building.vacant_rooms_count).to eq(3)
    end
  end

  describe '#occupancy_rate' do
    context 'with rooms' do
      let(:building) { create(:building, total_units: 10) }

      before do
        create_list(:room, 7, building: building, status: :occupied)
        create_list(:room, 3, building: building, status: :vacant)
      end

      it 'calculates correct occupancy rate' do
        expect(building.occupancy_rate).to eq(70.0)
      end
    end

    context 'with no units' do
      let(:building) { create(:building, total_units: 0) }

      it 'returns 0' do
        expect(building.occupancy_rate).to eq(0)
      end
    end
  end

  describe '#room_cnt' do
    let(:building) { create(:building) }

    before do
      create_list(:room, 5, building: building)
    end

    it 'returns total room count' do
      expect(building.room_cnt).to eq(5)
    end
  end

  describe '#free_cnt' do
    let(:building) { create(:building) }

    before do
      create_list(:room, 2, building: building, status: :vacant)
      create_list(:room, 3, building: building, status: :occupied)
    end

    it 'returns vacant room count' do
      expect(building.free_cnt).to eq(2)
    end
  end

  describe 'Discard (soft delete)' do
    let(:building) { create(:building) }

    it 'can be discarded' do
      building.discard
      expect(building.discarded?).to be true
    end

    it 'can be undiscarded' do
      building.discard
      building.undiscard
      expect(building.discarded?).to be false
    end

    it 'is excluded from default scope when discarded' do
      building.discard
      expect(described_class.kept).not_to include(building)
    end
  end
end
