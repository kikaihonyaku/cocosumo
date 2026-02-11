# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::LineConfig', type: :request do
  let(:tenant) { create(:tenant) }
  let(:admin) { create(:user, :admin, tenant: tenant) }
  let(:member) { create(:user, tenant: tenant) }

  describe 'GET /api/v1/line_config' do
    context 'when admin' do
      before { login_as(admin) }

      it 'returns unconfigured when no line_config exists' do
        get '/api/v1/line_config'
        expect(response).to have_http_status(:ok)
        expect(json_response['configured']).to be false
      end

      it 'returns config with masked tokens when configured' do
        create(:line_config, tenant: tenant)
        get '/api/v1/line_config'
        expect(response).to have_http_status(:ok)
        expect(json_response['configured']).to be true
        expect(json_response['webhook_url']).to include(tenant.subdomain)
      end
    end

    context 'when member' do
      before { login_as(member) }

      it 'returns forbidden' do
        get '/api/v1/line_config'
        expect(response).to have_http_status(:forbidden)
      end
    end

    context 'when not authenticated' do
      it 'returns unauthorized' do
        get '/api/v1/line_config'
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'PUT /api/v1/line_config' do
    let(:config_params) do
      {
        line_config: {
          channel_id: "new_channel_id",
          channel_secret: "new_channel_secret",
          channel_token: "new_channel_token",
          greeting_message: "友だち追加ありがとうございます！",
          active: true
        }
      }
    end

    context 'when admin' do
      before { login_as(admin) }

      it 'creates a new config' do
        expect {
          put '/api/v1/line_config', params: config_params
        }.to change(LineConfig, :count).by(1)

        expect(response).to have_http_status(:ok)
        expect(json_response['success']).to be true
      end

      it 'updates an existing config' do
        create(:line_config, tenant: tenant)

        put '/api/v1/line_config', params: {
          line_config: { greeting_message: "更新されたメッセージ" }
        }

        expect(response).to have_http_status(:ok)
        expect(tenant.line_config.reload.greeting_message).to eq("更新されたメッセージ")
      end
    end
  end

  describe 'POST /api/v1/line_config/test' do
    context 'when admin with configured line' do
      before do
        login_as(admin)
        create(:line_config, tenant: tenant)
      end

      it 'returns success when bot info is retrieved' do
        response_mock = instance_double(Net::HTTPOK)
        allow(response_mock).to receive(:is_a?).with(Net::HTTPSuccess).and_return(true)
        allow(response_mock).to receive(:body).and_return('{"displayName":"Test Bot","userId":"Ubot"}')

        allow_any_instance_of(Line::Bot::Client).to receive(:get_bot_info).and_return(response_mock)

        post '/api/v1/line_config/test'
        expect(response).to have_http_status(:ok)
        expect(json_response['success']).to be true
        expect(json_response['bot_info']['display_name']).to eq("Test Bot")
      end
    end

    context 'when line is not configured' do
      before { login_as(admin) }

      it 'returns error' do
        post '/api/v1/line_config/test'
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end
end
