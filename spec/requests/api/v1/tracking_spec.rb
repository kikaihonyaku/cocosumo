# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Tracking', type: :request do
  let(:tenant) { create(:tenant) }
  let(:customer) { create(:customer, tenant: tenant) }
  let(:inquiry) { tenant.inquiries.create!(customer: customer) }
  let(:activity) do
    customer.customer_activities.create!(
      activity_type: :line_message,
      direction: :outbound,
      inquiry: inquiry,
      content: "物件カード"
    )
  end
  let(:tracking) do
    MessageTracking.create!(
      customer_activity: activity,
      destination_url: "https://cocosumo.jp/property/abc123"
    )
  end

  describe 'GET /api/v1/t/:token' do
    it 'redirects to destination URL' do
      get "/api/v1/t/#{tracking.token}"

      expect(response).to have_http_status(:redirect)
      expect(response).to redirect_to("https://cocosumo.jp/property/abc123")
    end

    it 'records click in activity metadata' do
      get "/api/v1/t/#{tracking.token}"

      activity.reload
      expect(activity.metadata["line_link_clicked_at"]).to be_present
      expect(activity.metadata["line_click_count"]).to eq(1)
    end

    it 'increments click count on repeated clicks' do
      get "/api/v1/t/#{tracking.token}"
      get "/api/v1/t/#{tracking.token}"

      activity.reload
      expect(activity.metadata["line_click_count"]).to eq(2)
    end

    it 'returns not found for invalid token' do
      get '/api/v1/t/invalid_token'
      expect(response).to have_http_status(:not_found)
    end
  end
end
