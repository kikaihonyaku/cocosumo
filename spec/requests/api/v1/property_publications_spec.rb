# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::PropertyPublications', type: :request do
  let(:tenant) { create(:tenant) }
  let(:user) { create(:user, tenant: tenant, password: 'password123') }
  let(:building) { create(:building, tenant: tenant) }
  let(:room) { create(:room, building: building, tenant: tenant) }

  def login_user
    post '/api/v1/auth/login', params: { email: user.email, password: 'password123' }
  end

  describe 'GET /property/:publication_id (show_public)' do
    context 'with published page' do
      let!(:publication) { create(:property_publication, :published, room: room, tenant: tenant) }

      it 'returns publication data' do
        get "/property/#{publication.publication_id}"

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['title']).to eq(publication.title)
        expect(json['room']).to be_present
      end

      it 'includes room and building data' do
        get "/property/#{publication.publication_id}"

        json = JSON.parse(response.body)
        expect(json['room']['id']).to eq(room.id)
        expect(json['room']['building']['id']).to eq(building.id)
      end

      it 'includes QR code and expiration info' do
        get "/property/#{publication.publication_id}"

        json = JSON.parse(response.body)
        expect(json).to have_key('qr_code_data_url')
        expect(json).to have_key('expires_at')
      end
    end

    context 'with draft page' do
      let!(:publication) { create(:property_publication, room: room, tenant: tenant, status: :draft) }

      it 'returns not found for anonymous user' do
        get "/property/#{publication.publication_id}"

        expect(response).to have_http_status(:not_found)
      end

      it 'returns unauthorized for preview without login' do
        get "/property/#{publication.publication_id}", params: { preview: true }

        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json['error']).to include('ログイン')
      end

      it 'returns data for preview with logged in user' do
        login_user
        get "/property/#{publication.publication_id}", params: { preview: true }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['title']).to eq(publication.title)
      end
    end

    context 'with password protected page' do
      let!(:publication) do
        create(:property_publication, :published, :with_password, room: room, tenant: tenant)
      end

      it 'returns password_required error without password' do
        get "/property/#{publication.publication_id}"

        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json['error']).to eq('password_required')
        expect(json['password_protected']).to be true
      end

      it 'returns invalid_password error with wrong password' do
        get "/property/#{publication.publication_id}", params: { password: 'wrong_password' }

        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json['error']).to eq('invalid_password')
      end

      it 'returns data with correct password' do
        get "/property/#{publication.publication_id}", params: { password: 'testpass123' }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['title']).to eq(publication.title)
      end

      it 'bypasses password check for logged in user (preview mode)' do
        login_user
        get "/property/#{publication.publication_id}", params: { preview: true }

        expect(response).to have_http_status(:ok)
      end
    end

    context 'with expired page' do
      let!(:publication) { create(:property_publication, :expired, room: room, tenant: tenant) }

      it 'returns gone status' do
        get "/property/#{publication.publication_id}"

        expect(response).to have_http_status(:gone)
        json = JSON.parse(response.body)
        expect(json['error']).to include('有効期限')
      end

      it 'allows preview mode for logged in user' do
        login_user
        get "/property/#{publication.publication_id}", params: { preview: true }

        expect(response).to have_http_status(:ok)
      end
    end

    context 'with non-existent publication' do
      it 'returns not found' do
        get '/property/nonexistent_id'

        expect(response).to have_http_status(:not_found)
      end
    end

    context 'with discarded (soft-deleted) publication' do
      let!(:publication) { create(:property_publication, :published, room: room, tenant: tenant) }

      before { publication.discard }

      it 'returns not found' do
        get "/property/#{publication.publication_id}"

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'POST /api/v1/property_publications/bulk_action' do
    let!(:draft_publications) do
      create_list(:property_publication, 2, room: room, tenant: tenant, status: :draft)
    end
    let!(:published_publications) do
      create_list(:property_publication, 2, :published, room: room, tenant: tenant)
    end

    before { login_user }

    context 'publish action' do
      it 'publishes draft publications' do
        ids = draft_publications.map(&:id)

        post '/api/v1/property_publications/bulk_action', params: {
          ids: ids,
          bulk_action: 'publish'
        }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['success']).to be true
        expect(json['affected_count']).to eq(2)

        draft_publications.each do |pub|
          expect(pub.reload.status).to eq('published')
        end
      end

      it 'skips already published publications' do
        ids = published_publications.map(&:id)

        post '/api/v1/property_publications/bulk_action', params: {
          ids: ids,
          bulk_action: 'publish'
        }

        json = JSON.parse(response.body)
        expect(json['affected_count']).to eq(0)
      end
    end

    context 'unpublish action' do
      it 'unpublishes published publications' do
        ids = published_publications.map(&:id)

        post '/api/v1/property_publications/bulk_action', params: {
          ids: ids,
          bulk_action: 'unpublish'
        }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['success']).to be true
        expect(json['affected_count']).to eq(2)

        published_publications.each do |pub|
          expect(pub.reload.status).to eq('draft')
        end
      end

      it 'skips draft publications' do
        ids = draft_publications.map(&:id)

        post '/api/v1/property_publications/bulk_action', params: {
          ids: ids,
          bulk_action: 'unpublish'
        }

        json = JSON.parse(response.body)
        expect(json['affected_count']).to eq(0)
      end
    end

    context 'delete action' do
      it 'soft deletes publications' do
        all_ids = draft_publications.map(&:id) + published_publications.map(&:id)

        post '/api/v1/property_publications/bulk_action', params: {
          ids: all_ids,
          bulk_action: 'delete'
        }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['success']).to be true
        expect(json['affected_count']).to eq(4)

        (draft_publications + published_publications).each do |pub|
          expect(pub.reload.discarded?).to be true
        end
      end
    end

    context 'with missing parameters' do
      it 'returns error when ids are missing' do
        post '/api/v1/property_publications/bulk_action', params: {
          bulk_action: 'publish'
        }

        expect(response).to have_http_status(:bad_request)
        json = JSON.parse(response.body)
        expect(json['error']).to include('ID')
      end

      it 'returns error when action is missing' do
        post '/api/v1/property_publications/bulk_action', params: {
          ids: [1, 2]
        }

        expect(response).to have_http_status(:bad_request)
        json = JSON.parse(response.body)
        expect(json['error']).to include('アクション')
      end
    end

    context 'with unknown action' do
      it 'returns error' do
        post '/api/v1/property_publications/bulk_action', params: {
          ids: [1, 2],
          bulk_action: 'unknown_action'
        }

        expect(response).to have_http_status(:bad_request)
        json = JSON.parse(response.body)
        expect(json['error']).to include('不明')
      end
    end

    context 'without authentication' do
      it 'returns unauthorized' do
        post '/api/v1/auth/logout'

        post '/api/v1/property_publications/bulk_action', params: {
          ids: [1],
          bulk_action: 'publish'
        }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'POST /api/v1/property_publications/:publication_id/verify_password' do
    let!(:publication) { create(:property_publication, :published, :with_password, room: room, tenant: tenant) }

    it 'returns success with correct password' do
      post "/api/v1/property_publications/#{publication.publication_id}/verify_password",
           params: { password: 'testpass123' }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['success']).to be true
    end

    it 'returns unauthorized with wrong password' do
      post "/api/v1/property_publications/#{publication.publication_id}/verify_password",
           params: { password: 'wrong_password' }

      expect(response).to have_http_status(:unauthorized)
      json = JSON.parse(response.body)
      expect(json['success']).to be false
    end

    context 'with expired publication' do
      let!(:expired_publication) do
        create(:property_publication, :expired, :with_password, room: room, tenant: tenant)
      end

      it 'returns gone status' do
        post "/api/v1/property_publications/#{expired_publication.publication_id}/verify_password",
             params: { password: 'testpass123' }

        expect(response).to have_http_status(:gone)
      end
    end
  end

  describe 'POST /api/v1/property_publications/:publication_id/track_view' do
    let!(:publication) { create(:property_publication, :published, room: room, tenant: tenant) }

    it 'increments view count' do
      expect {
        post "/api/v1/property_publications/#{publication.publication_id}/track_view"
      }.to change { publication.reload.view_count }.by(1)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['success']).to be true
    end

    it 'does not increment view count for draft publications' do
      draft = create(:property_publication, room: room, tenant: tenant, status: :draft)

      expect {
        post "/api/v1/property_publications/#{draft.publication_id}/track_view"
      }.not_to change { draft.reload.view_count }
    end
  end

  describe 'GET /api/v1/property_publications/:publication_id/analytics' do
    let!(:publication) do
      create(:property_publication, :published, room: room, tenant: tenant,
             view_count: 100, max_scroll_depth: 75, avg_session_duration: 120)
    end

    before { login_user }

    it 'returns analytics data' do
      get "/api/v1/property_publications/#{publication.publication_id}/analytics"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['view_count']).to eq(100)
      expect(json['max_scroll_depth']).to eq(75)
      expect(json['avg_session_duration']).to eq(120)
    end
  end
end
