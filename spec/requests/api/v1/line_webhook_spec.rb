# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::LineWebhook', type: :request do
  let(:tenant) { create(:tenant) }
  let!(:line_config) { create(:line_config, tenant: tenant, channel_secret: "test_secret") }

  let(:signature) { "valid_signature" }
  let(:headers) do
    { 'HTTP_X_LINE_SIGNATURE' => signature, 'CONTENT_TYPE' => 'application/json' }
  end

  before do
    allow_any_instance_of(Line::Bot::Client).to receive(:validate_signature).and_return(true)
  end

  describe 'POST /api/v1/line/webhook/:tenant_subdomain' do
    context 'with message event' do
      let(:customer) { create(:customer, tenant: tenant, line_user_id: "U1234") }
      let(:inquiry) { tenant.inquiries.create!(customer: customer) }

      let(:body) do
        {
          events: [{
            type: "message",
            source: { type: "user", userId: "U1234" },
            message: { type: "text", id: "msg123", text: "物件を探しています" }
          }]
        }.to_json
      end

      before do
        customer
        inquiry
        allow_any_instance_of(Line::Bot::Client).to receive(:parse_events_from).and_return(
          [Line::Bot::Event::Message.new(JSON.parse(body)['events'].first)]
        )
      end

      it 'creates an inbound line_message activity' do
        expect {
          post "/api/v1/line/webhook/#{tenant.subdomain}", params: body, headers: headers
        }.to change(CustomerActivity, :count).by(1)

        expect(response).to have_http_status(:ok)

        activity = CustomerActivity.last
        expect(activity.activity_type).to eq("line_message")
        expect(activity.direction).to eq("inbound")
        expect(activity.content).to eq("物件を探しています")
      end
    end

    context 'with follow event' do
      let(:body) do
        {
          events: [{
            type: "follow",
            source: { type: "user", userId: "U_NEW_USER" }
          }]
        }.to_json
      end

      before do
        profile_response = instance_double(Net::HTTPOK)
        allow(profile_response).to receive(:is_a?).with(Net::HTTPSuccess).and_return(true)
        allow(profile_response).to receive(:body).and_return('{"displayName":"新規ユーザー","userId":"U_NEW_USER"}')
        allow_any_instance_of(Line::Bot::Client).to receive(:get_profile).and_return(profile_response)

        # No greeting message
        line_config.update!(greeting_message: nil)

        allow_any_instance_of(Line::Bot::Client).to receive(:parse_events_from).and_return(
          [Line::Bot::Event::Follow.new(JSON.parse(body)['events'].first)]
        )
      end

      it 'creates a new customer with line_user_id' do
        expect {
          post "/api/v1/line/webhook/#{tenant.subdomain}", params: body, headers: headers
        }.to change(Customer, :count).by(1)

        customer = Customer.last
        expect(customer.line_user_id).to eq("U_NEW_USER")
        expect(customer.name).to eq("新規ユーザー")
      end

      it 'records follow activity' do
        post "/api/v1/line/webhook/#{tenant.subdomain}", params: body, headers: headers

        activity = CustomerActivity.last
        expect(activity.subject).to eq("友だち追加")
        expect(activity.metadata["line_message_type"]).to eq("follow")
      end

      it 'sends greeting message when configured' do
        line_config.update!(greeting_message: "友だち追加ありがとう！")
        push_response = instance_double(Net::HTTPOK)
        allow(push_response).to receive(:is_a?).with(Net::HTTPSuccess).and_return(true)
        expect_any_instance_of(Line::Bot::Client).to receive(:push_message).with(
          "U_NEW_USER",
          { type: "text", text: "友だち追加ありがとう！" }
        ).and_return(push_response)

        post "/api/v1/line/webhook/#{tenant.subdomain}", params: body, headers: headers
      end
    end

    context 'with invalid signature' do
      before do
        allow_any_instance_of(Line::Bot::Client).to receive(:validate_signature).and_return(false)
      end

      it 'returns bad request' do
        post "/api/v1/line/webhook/#{tenant.subdomain}", params: '{}', headers: headers
        expect(response).to have_http_status(:bad_request)
      end
    end

    context 'with unknown tenant' do
      it 'returns not found' do
        post '/api/v1/line/webhook/nonexistent', params: '{}', headers: headers
        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
