# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::LineTemplates', type: :request do
  let(:tenant) { create(:tenant) }
  let(:user) { create(:user, tenant: tenant) }

  before { login_as(user) }

  describe 'GET /api/v1/line_templates' do
    it 'returns kept templates ordered' do
      t1 = create(:line_template, tenant: tenant, position: 1)
      t2 = create(:line_template, tenant: tenant, position: 2)
      create(:line_template, tenant: tenant, discarded_at: Time.current)

      get '/api/v1/line_templates'
      expect(response).to have_http_status(:ok)
      expect(json_response.length).to eq(2)
      expect(json_response.first['id']).to eq(t1.id)
    end

    it 'does not return templates from other tenants' do
      other_tenant = create(:tenant)
      create(:line_template, tenant: other_tenant)
      create(:line_template, tenant: tenant)

      get '/api/v1/line_templates'
      expect(json_response.length).to eq(1)
    end
  end

  describe 'POST /api/v1/line_templates' do
    let(:valid_params) do
      {
        line_template: {
          name: "ご案内テンプレート",
          message_type: "text",
          content: "{{お客様名}}様、物件のご案内です",
          position: 1
        }
      }
    end

    it 'creates a new template' do
      expect {
        post '/api/v1/line_templates', params: valid_params
      }.to change(LineTemplate, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json_response['success']).to be true
      expect(json_response['template']['name']).to eq("ご案内テンプレート")
    end

    it 'returns errors for invalid params' do
      post '/api/v1/line_templates', params: { line_template: { name: "", content: "" } }
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe 'PATCH /api/v1/line_templates/:id' do
    let!(:template) { create(:line_template, tenant: tenant) }

    it 'updates the template' do
      patch "/api/v1/line_templates/#{template.id}", params: {
        line_template: { name: "更新済み" }
      }

      expect(response).to have_http_status(:ok)
      expect(template.reload.name).to eq("更新済み")
    end
  end

  describe 'DELETE /api/v1/line_templates/:id' do
    let!(:template) { create(:line_template, tenant: tenant) }

    it 'soft deletes the template' do
      delete "/api/v1/line_templates/#{template.id}"

      expect(response).to have_http_status(:ok)
      expect(template.reload.discarded_at).to be_present
    end
  end
end
