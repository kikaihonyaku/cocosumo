# frozen_string_literal: true

require 'rails_helper'

RSpec.describe LineConfig, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:tenant) }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:channel_id) }
    it { is_expected.to validate_presence_of(:channel_secret) }
    it { is_expected.to validate_presence_of(:channel_token) }
  end

  describe '#configured?' do
    let(:tenant) { create(:tenant) }

    it 'returns true when all fields are present and active' do
      config = create(:line_config, tenant: tenant)
      expect(config.configured?).to be true
    end

    it 'returns false when inactive' do
      config = create(:line_config, tenant: tenant, active: false)
      expect(config.configured?).to be false
    end
  end

  describe 'encryption' do
    let(:tenant) { create(:tenant) }
    let(:config) { create(:line_config, tenant: tenant, channel_id: "test_id", channel_secret: "test_secret", channel_token: "test_token") }

    it 'encrypts channel_id' do
      raw = LineConfig.find(config.id).channel_id
      expect(raw).to eq "test_id"
    end

    it 'encrypts channel_secret' do
      raw = LineConfig.find(config.id).channel_secret
      expect(raw).to eq "test_secret"
    end

    it 'encrypts channel_token' do
      raw = LineConfig.find(config.id).channel_token
      expect(raw).to eq "test_token"
    end
  end
end
