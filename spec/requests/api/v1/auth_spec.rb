# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Auth', type: :request do
  let(:tenant) { create(:tenant) }
  let(:user) { create(:user, tenant: tenant, password: 'password123') }

  describe 'POST /api/v1/auth/login' do
    context 'with valid credentials' do
      it 'returns success with user data' do
        post '/api/v1/auth/login', params: { email: user.email, password: 'password123' }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['success']).to be true
        expect(json['user']['id']).to eq(user.id)
        expect(json['user']['email']).to eq(user.email)
        expect(json['user']['name']).to eq(user.name)
        expect(json['user']['tenant_id']).to eq(user.tenant_id)
      end

      it 'sets session user_id' do
        post '/api/v1/auth/login', params: { email: user.email, password: 'password123' }

        expect(session[:user_id]).to eq(user.id)
        expect(session[:tenant_id]).to eq(user.tenant_id)
      end
    end

    context 'with invalid password' do
      it 'returns unauthorized' do
        post '/api/v1/auth/login', params: { email: user.email, password: 'wrong_password' }

        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json['success']).to be false
        expect(json['error']).to be_present
      end
    end

    context 'with non-existent email' do
      it 'returns unauthorized' do
        post '/api/v1/auth/login', params: { email: 'nonexistent@example.com', password: 'password123' }

        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json['success']).to be false
      end
    end

    context 'with missing parameters' do
      it 'returns unauthorized when email is missing' do
        post '/api/v1/auth/login', params: { password: 'password123' }

        expect(response).to have_http_status(:unauthorized)
      end

      it 'returns unauthorized when password is missing' do
        post '/api/v1/auth/login', params: { email: user.email }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'POST /api/v1/auth/logout' do
    context 'when logged in' do
      before do
        post '/api/v1/auth/login', params: { email: user.email, password: 'password123' }
      end

      it 'returns success' do
        post '/api/v1/auth/logout'

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['success']).to be true
        expect(json['message']).to include('ログアウト')
      end

      it 'clears session' do
        post '/api/v1/auth/logout'

        expect(session[:user_id]).to be_nil
        expect(session[:tenant_id]).to be_nil
      end
    end

    context 'when not logged in' do
      it 'returns unauthorized' do
        post '/api/v1/auth/logout'

        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json['error']).to be_present
      end
    end
  end

  describe 'GET /api/v1/auth/me' do
    context 'when logged in' do
      before do
        post '/api/v1/auth/login', params: { email: user.email, password: 'password123' }
      end

      it 'returns current user data' do
        get '/api/v1/auth/me'

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['user']['id']).to eq(user.id)
        expect(json['user']['email']).to eq(user.email)
        expect(json['user']['name']).to eq(user.name)
        expect(json['user']['role']).to eq(user.role)
        expect(json['user']['tenant_id']).to eq(user.tenant_id)
      end
    end

    context 'when not logged in' do
      it 'returns unauthorized' do
        get '/api/v1/auth/me'

        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json['error']).to be_present
      end
    end
  end
end
