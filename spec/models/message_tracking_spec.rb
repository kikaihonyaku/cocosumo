# frozen_string_literal: true

require 'rails_helper'

RSpec.describe MessageTracking, type: :model do
  let(:tenant) { create(:tenant) }
  let(:customer) { create(:customer, tenant: tenant) }
  let(:inquiry) { tenant.inquiries.create!(customer: customer) }
  let(:activity) do
    customer.customer_activities.create!(
      activity_type: :line_message,
      direction: :outbound,
      inquiry: inquiry,
      content: "テスト"
    )
  end

  describe 'validations' do
    it 'is valid with valid attributes' do
      tracking = MessageTracking.new(
        customer_activity: activity,
        destination_url: "https://example.com"
      )
      expect(tracking).to be_valid
    end

    it 'requires a destination_url' do
      tracking = MessageTracking.new(customer_activity: activity, destination_url: nil)
      expect(tracking).not_to be_valid
    end

    it 'requires a customer_activity' do
      tracking = MessageTracking.new(destination_url: "https://example.com")
      expect(tracking).not_to be_valid
    end
  end

  describe 'token generation' do
    it 'auto-generates a token on create' do
      tracking = MessageTracking.create!(
        customer_activity: activity,
        destination_url: "https://example.com"
      )
      expect(tracking.token).to be_present
      expect(tracking.token.length).to be >= 16
    end

    it 'generates unique tokens' do
      t1 = MessageTracking.create!(customer_activity: activity, destination_url: "https://example.com")
      t2 = MessageTracking.create!(customer_activity: activity, destination_url: "https://example.com")
      expect(t1.token).not_to eq(t2.token)
    end
  end

  describe '#record_click!' do
    let(:tracking) do
      MessageTracking.create!(
        customer_activity: activity,
        destination_url: "https://example.com"
      )
    end

    it 'records first click timestamp' do
      tracking.record_click!
      activity.reload
      expect(activity.metadata["line_link_clicked_at"]).to be_present
      expect(activity.metadata["line_click_count"]).to eq(1)
    end

    it 'increments click count on subsequent clicks' do
      tracking.record_click!
      tracking.record_click!
      activity.reload
      expect(activity.metadata["line_click_count"]).to eq(2)
    end

    it 'preserves first click timestamp' do
      tracking.record_click!
      first_click = activity.reload.metadata["line_link_clicked_at"]

      sleep 0.01
      tracking.record_click!
      activity.reload
      expect(activity.metadata["line_link_clicked_at"]).to eq(first_click)
    end

    it 'updates last clicked timestamp' do
      tracking.record_click!
      first_last = activity.reload.metadata["line_last_clicked_at"]

      sleep 0.01
      tracking.record_click!
      activity.reload
      expect(activity.metadata["line_last_clicked_at"]).to be >= first_last
    end
  end
end
