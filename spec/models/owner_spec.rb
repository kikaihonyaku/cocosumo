# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Owner, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:tenant) }
    it { is_expected.to belong_to(:building) }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:name) }

    context 'email format' do
      it 'accepts valid email' do
        owner = build(:owner, email: 'test@example.com')
        expect(owner).to be_valid
      end

      it 'rejects invalid email' do
        owner = build(:owner, email: 'invalid-email')
        expect(owner).not_to be_valid
      end

      it 'allows blank email' do
        owner = build(:owner, email: '')
        expect(owner).to be_valid
      end

      it 'allows nil email' do
        owner = build(:owner, email: nil)
        expect(owner).to be_valid
      end
    end
  end

  describe '#ensure_single_primary_owner callback' do
    let(:building) { create(:building) }
    let!(:existing_primary) { create(:owner, :primary, building: building, tenant: building.tenant) }

    it 'removes primary flag from other owners when setting new primary' do
      new_primary = create(:owner, building: building, tenant: building.tenant, is_primary: true)

      existing_primary.reload
      expect(existing_primary.is_primary).to be false
      expect(new_primary.is_primary).to be true
    end

    it 'does not affect owners of other buildings' do
      other_building = create(:building, tenant: building.tenant)
      other_primary = create(:owner, :primary, building: other_building, tenant: building.tenant)

      create(:owner, building: building, tenant: building.tenant, is_primary: true)

      other_primary.reload
      expect(other_primary.is_primary).to be true
    end

    it 'allows multiple non-primary owners' do
      owner2 = create(:owner, building: building, tenant: building.tenant, is_primary: false)
      owner3 = create(:owner, building: building, tenant: building.tenant, is_primary: false)

      expect(existing_primary.reload.is_primary).to be true
      expect(owner2.is_primary).to be false
      expect(owner3.is_primary).to be false
    end

    it 'does not change primary when updating non-primary to non-primary' do
      non_primary = create(:owner, building: building, tenant: building.tenant, is_primary: false)
      non_primary.update!(name: 'Updated Name')

      expect(existing_primary.reload.is_primary).to be true
    end
  end

  describe 'scopes' do
    let(:building) { create(:building) }
    let!(:primary_owner) { create(:owner, :primary, building: building, tenant: building.tenant) }
    let!(:regular_owner) { create(:owner, building: building, tenant: building.tenant) }

    describe '.primary' do
      it 'returns only primary owners' do
        expect(described_class.primary).to include(primary_owner)
        expect(described_class.primary).not_to include(regular_owner)
      end
    end
  end
end
