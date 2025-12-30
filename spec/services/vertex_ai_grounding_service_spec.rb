# frozen_string_literal: true

require 'rails_helper'

RSpec.describe VertexAiGroundingService, type: :service do
  before do
    # Skip validation in tests unless specifically testing configuration
    allow_any_instance_of(described_class).to receive(:validate_configuration!)
  end

  describe '#initialize' do
    context 'with missing configuration' do
      before do
        allow_any_instance_of(described_class).to receive(:validate_configuration!).and_call_original
      end

      it 'raises error when GOOGLE_CLOUD_PROJECT_ID is missing' do
        allow(ENV).to receive(:[]).and_call_original
        allow(ENV).to receive(:[]).with('GOOGLE_CLOUD_PROJECT_ID').and_return(nil)
        allow(ENV).to receive(:[]).with('GOOGLE_CLOUD_REGION').and_return('us-central1')

        expect { described_class.new }.to raise_error(
          VertexAiGroundingService::GroundingError,
          /GOOGLE_CLOUD_PROJECT_ID/
        )
      end
    end
  end

  describe 'response parsing' do
    let(:service) { described_class.new }

    describe '#extract_answer_text' do
      it 'extracts text from response candidates' do
        response = {
          'candidates' => [
            {
              'content' => {
                'parts' => [
                  { 'text' => 'Answer part 1' },
                  { 'text' => 'Answer part 2' }
                ]
              }
            }
          ]
        }

        result = service.send(:extract_answer_text, response)
        expect(result).to eq("Answer part 1\nAnswer part 2")
      end

      it 'returns empty string for missing candidates' do
        expect(service.send(:extract_answer_text, {})).to eq('')
      end

      it 'returns empty string for nil candidates' do
        expect(service.send(:extract_answer_text, { 'candidates' => nil })).to eq('')
      end

      it 'returns empty string for empty candidates' do
        expect(service.send(:extract_answer_text, { 'candidates' => [] })).to eq('')
      end

      it 'handles missing content' do
        response = { 'candidates' => [{}] }
        expect(service.send(:extract_answer_text, response)).to eq('')
      end

      it 'handles missing parts' do
        response = { 'candidates' => [{ 'content' => {} }] }
        expect(service.send(:extract_answer_text, response)).to eq('')
      end
    end

    describe '#extract_grounding_metadata' do
      it 'extracts grounding metadata from response' do
        metadata = { 'groundingChunks' => [] }
        response = {
          'candidates' => [
            { 'groundingMetadata' => metadata }
          ]
        }

        result = service.send(:extract_grounding_metadata, response)
        expect(result).to eq(metadata)
      end

      it 'returns empty hash for missing candidates' do
        expect(service.send(:extract_grounding_metadata, {})).to eq({})
      end

      it 'returns empty hash for missing metadata' do
        response = { 'candidates' => [{}] }
        expect(service.send(:extract_grounding_metadata, response)).to eq({})
      end
    end

    describe '#extract_sources' do
      it 'extracts sources from grounding metadata' do
        metadata = {
          'groundingChunks' => [
            {
              'web' => {
                'title' => 'Test Source',
                'uri' => 'https://example.com',
                'snippet' => 'Test snippet'
              }
            }
          ]
        }

        sources = service.send(:extract_sources, metadata)

        expect(sources).to be_an(Array)
        expect(sources.length).to eq(1)
        expect(sources.first).to include(
          name: 'Test Source',
          url: 'https://example.com'
        )
      end

      it 'returns empty array for nil metadata' do
        expect(service.send(:extract_sources, nil)).to eq([])
      end

      it 'returns empty array for missing groundingChunks' do
        expect(service.send(:extract_sources, {})).to eq([])
      end

      it 'skips chunks without web data' do
        metadata = {
          'groundingChunks' => [
            { 'other' => {} },
            {
              'web' => {
                'title' => 'Valid Source',
                'uri' => 'https://example.com'
              }
            }
          ]
        }

        sources = service.send(:extract_sources, metadata)
        expect(sources.length).to eq(1)
      end

      it 'uses default values for missing fields' do
        metadata = {
          'groundingChunks' => [
            { 'web' => {} }
          ]
        }

        sources = service.send(:extract_sources, metadata)
        expect(sources.first[:name]).to eq('Google Maps')
        expect(sources.first[:url]).to eq('https://maps.google.com/')
      end

      it 'removes duplicate sources by URL' do
        metadata = {
          'groundingChunks' => [
            { 'web' => { 'title' => 'Source 1', 'uri' => 'https://example.com' } },
            { 'web' => { 'title' => 'Source 2', 'uri' => 'https://example.com' } }
          ]
        }

        sources = service.send(:extract_sources, metadata)
        expect(sources.length).to eq(1)
      end
    end

    describe '#extract_widget_context_token' do
      it 'extracts widget context token' do
        metadata = { 'googleMapsWidgetContextToken' => 'test-token-123' }
        token = service.send(:extract_widget_context_token, metadata)
        expect(token).to eq('test-token-123')
      end

      it 'returns nil for nil metadata' do
        expect(service.send(:extract_widget_context_token, nil)).to be_nil
      end

      it 'returns nil for missing token' do
        expect(service.send(:extract_widget_context_token, {})).to be_nil
      end
    end

    describe '#extract_place_ids' do
      it 'extracts place IDs from grounding chunks' do
        metadata = {
          'groundingChunks' => [
            {
              'maps' => {
                'placeId' => 'ChIJxx123',
                'title' => 'Test Place',
                'uri' => 'https://maps.google.com/place/ChIJxx123'
              }
            }
          ]
        }

        place_ids = service.send(:extract_place_ids, metadata)

        expect(place_ids).to be_an(Array)
        expect(place_ids.length).to eq(1)
        expect(place_ids.first).to include(
          place_id: 'ChIJxx123',
          title: 'Test Place'
        )
      end

      it 'returns empty array for nil metadata' do
        expect(service.send(:extract_place_ids, nil)).to eq([])
      end

      it 'returns empty array for missing groundingChunks' do
        expect(service.send(:extract_place_ids, {})).to eq([])
      end

      it 'skips chunks without maps data' do
        metadata = {
          'groundingChunks' => [
            { 'web' => {} },
            {
              'maps' => {
                'placeId' => 'ChIJxx456',
                'title' => 'Valid Place'
              }
            }
          ]
        }

        place_ids = service.send(:extract_place_ids, metadata)
        expect(place_ids.length).to eq(1)
      end
    end

    describe '#parse_response' do
      it 'returns complete parsed response' do
        response = {
          'candidates' => [
            {
              'content' => {
                'parts' => [{ 'text' => 'Test answer' }]
              },
              'groundingMetadata' => {
                'googleMapsWidgetContextToken' => 'token123',
                'groundingChunks' => [
                  {
                    'web' => {
                      'title' => 'Source',
                      'uri' => 'https://example.com'
                    }
                  }
                ]
              }
            }
          ]
        }

        result = service.send(:parse_response, response)

        expect(result).to include(:answer, :sources, :widget_context_token, :place_ids, :metadata)
        expect(result[:answer]).to eq('Test answer')
        expect(result[:widget_context_token]).to eq('token123')
        expect(result[:sources].length).to eq(1)
      end
    end
  end

  # Integration tests with VCR (require actual API responses)
  describe '#query_with_grounding', :vcr do
    let(:service) { described_class.new }

    it 'returns answer with sources' do
      skip 'Requires VCR cassette with Vertex AI API response'

      result = service.query_with_grounding(
        query: '近くのスーパーマーケットを教えてください',
        latitude: 35.6762,
        longitude: 139.6503,
        address: '東京都渋谷区渋谷1-1-1'
      )

      expect(result).to include(:answer, :sources, :widget_context_token, :place_ids)
      expect(result[:answer]).to be_present
    end
  end
end
