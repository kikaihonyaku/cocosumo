# frozen_string_literal: true

require 'rails_helper'

RSpec.describe LineTemplate, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:tenant) }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:content) }
  end

  describe 'enums' do
    it { is_expected.to define_enum_for(:message_type).with_values(text: 0, image: 1, flex: 2).with_prefix(true) }
  end

  describe 'scopes' do
    let(:tenant) { create(:tenant) }

    describe '.kept' do
      it 'excludes discarded templates' do
        kept = create(:line_template, tenant: tenant)
        discarded = create(:line_template, tenant: tenant, discarded_at: Time.current)

        expect(LineTemplate.kept).to include(kept)
        expect(LineTemplate.kept).not_to include(discarded)
      end
    end

    describe '.ordered' do
      it 'orders by position then name' do
        t3 = create(:line_template, tenant: tenant, name: "C", position: 2)
        t1 = create(:line_template, tenant: tenant, name: "A", position: 1)
        t2 = create(:line_template, tenant: tenant, name: "B", position: 1)

        expect(LineTemplate.ordered).to eq([t1, t2, t3])
      end
    end
  end
end
