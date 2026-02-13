# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::SendgridWebhook', type: :request do
  let(:tenant) { create(:tenant) }
  let(:customer) { create(:customer, tenant: tenant) }
  let(:inquiry) { tenant.inquiries.create!(customer: customer) }
  let(:activity) do
    customer.customer_activities.create!(
      activity_type: :email,
      direction: :outbound,
      inquiry: inquiry,
      subject: "テストメール",
      content: "テスト本文"
    )
  end

  let(:headers) { { 'CONTENT_TYPE' => 'application/json' } }

  # Skip signature verification for tests (no SENDGRID_WEBHOOK_VERIFICATION_KEY set)
  describe 'POST /api/v1/sendgrid/webhook' do
    context 'with delivered event' do
      let(:body) do
        [{
          "event" => "delivered",
          "timestamp" => 1707900000,
          "unique_args" => { "activity_id" => activity.id, "tenant_id" => tenant.id }
        }].to_json
      end

      it 'records delivery timestamp in metadata' do
        post '/api/v1/sendgrid/webhook', params: body, headers: headers
        expect(response).to have_http_status(:ok)

        activity.reload
        expect(activity.metadata["email_delivered_at"]).to eq(1707900000)
      end
    end

    context 'with open event' do
      let(:body) do
        [{
          "event" => "open",
          "timestamp" => 1707901000,
          "unique_args" => { "activity_id" => activity.id }
        }].to_json
      end

      it 'records open timestamp and count in metadata' do
        post '/api/v1/sendgrid/webhook', params: body, headers: headers
        expect(response).to have_http_status(:ok)

        activity.reload
        expect(activity.metadata["email_opened_at"]).to eq(1707901000)
        expect(activity.metadata["email_open_count"]).to eq(1)
        expect(activity.metadata["email_last_opened_at"]).to eq(1707901000)
      end

      it 'increments open count on subsequent opens' do
        activity.update_column(:metadata, {
          "email_opened_at" => 1707900500,
          "email_open_count" => 2,
          "email_last_opened_at" => 1707900800
        })

        post '/api/v1/sendgrid/webhook', params: body, headers: headers

        activity.reload
        expect(activity.metadata["email_opened_at"]).to eq(1707900500) # first open preserved
        expect(activity.metadata["email_open_count"]).to eq(3)
        expect(activity.metadata["email_last_opened_at"]).to eq(1707901000) # updated
      end
    end

    context 'with click event' do
      let(:body) do
        [{
          "event" => "click",
          "timestamp" => 1707902000,
          "url" => "https://cocosumo.jp/property/abc123",
          "unique_args" => { "activity_id" => activity.id }
        }].to_json
      end

      it 'records click data in metadata' do
        post '/api/v1/sendgrid/webhook', params: body, headers: headers
        expect(response).to have_http_status(:ok)

        activity.reload
        expect(activity.metadata["email_clicked_at"]).to eq(1707902000)
        expect(activity.metadata["email_click_count"]).to eq(1)
        expect(activity.metadata["email_clicked_url"]).to eq("https://cocosumo.jp/property/abc123")
      end
    end

    context 'with bounce event' do
      let(:body) do
        [{
          "event" => "bounce",
          "timestamp" => 1707903000,
          "reason" => "550 User not found",
          "unique_args" => { "activity_id" => activity.id }
        }].to_json
      end

      it 'records bounce data in metadata' do
        post '/api/v1/sendgrid/webhook', params: body, headers: headers
        expect(response).to have_http_status(:ok)

        activity.reload
        expect(activity.metadata["email_bounced_at"]).to eq(1707903000)
        expect(activity.metadata["email_bounce_reason"]).to eq("550 User not found")
      end
    end

    context 'with dropped event' do
      let(:body) do
        [{
          "event" => "dropped",
          "timestamp" => 1707904000,
          "reason" => "Bounced Address",
          "unique_args" => { "activity_id" => activity.id }
        }].to_json
      end

      it 'records drop data in metadata' do
        post '/api/v1/sendgrid/webhook', params: body, headers: headers
        expect(response).to have_http_status(:ok)

        activity.reload
        expect(activity.metadata["email_dropped_at"]).to eq(1707904000)
        expect(activity.metadata["email_drop_reason"]).to eq("Bounced Address")
      end
    end

    context 'with multiple events in one batch' do
      let(:body) do
        [
          { "event" => "delivered", "timestamp" => 1707900000, "unique_args" => { "activity_id" => activity.id } },
          { "event" => "open", "timestamp" => 1707901000, "unique_args" => { "activity_id" => activity.id } }
        ].to_json
      end

      it 'processes all events' do
        post '/api/v1/sendgrid/webhook', params: body, headers: headers
        expect(response).to have_http_status(:ok)

        activity.reload
        expect(activity.metadata["email_delivered_at"]).to eq(1707900000)
        expect(activity.metadata["email_opened_at"]).to eq(1707901000)
      end
    end

    context 'with unknown activity_id' do
      let(:body) do
        [{ "event" => "open", "timestamp" => 1707901000, "unique_args" => { "activity_id" => 999999 } }].to_json
      end

      it 'silently ignores the event' do
        post '/api/v1/sendgrid/webhook', params: body, headers: headers
        expect(response).to have_http_status(:ok)
      end
    end

    context 'with missing unique_args' do
      let(:body) do
        [{ "event" => "open", "timestamp" => 1707901000 }].to_json
      end

      it 'silently ignores the event' do
        post '/api/v1/sendgrid/webhook', params: body, headers: headers
        expect(response).to have_http_status(:ok)
      end
    end

    context 'with invalid JSON body' do
      it 'returns bad request' do
        post '/api/v1/sendgrid/webhook', params: 'not json', headers: headers
        expect(response).to have_http_status(:bad_request)
      end
    end
  end
end
