# frozen_string_literal: true

require 'rails_helper'

RSpec.describe LineMessageService do
  let(:tenant) { create(:tenant) }
  let!(:line_config) { create(:line_config, tenant: tenant) }

  describe '#initialize' do
    it 'creates a service when line_config is configured' do
      service = described_class.new(tenant)
      expect(service.client).to be_a(Line::Bot::Client)
    end

    it 'raises NotConfiguredError when no line_config exists' do
      tenant_without_config = create(:tenant)
      expect {
        described_class.new(tenant_without_config)
      }.to raise_error(LineMessageService::NotConfiguredError)
    end

    it 'raises NotConfiguredError when line_config is inactive' do
      line_config.update!(active: false)
      expect {
        described_class.new(tenant)
      }.to raise_error(LineMessageService::NotConfiguredError)
    end
  end

  describe '#push_text' do
    let(:service) { described_class.new(tenant) }

    it 'sends a text message via LINE API' do
      response = instance_double(Net::HTTPOK, is_a?: true)
      allow(response).to receive(:is_a?).with(Net::HTTPSuccess).and_return(true)
      allow(service.client).to receive(:push_message).and_return(response)

      result = service.push_text("U1234", "Hello")
      expect(service.client).to have_received(:push_message).with(
        "U1234",
        { type: "text", text: "Hello" }
      )
    end

    it 'raises DeliveryError on API failure' do
      response = instance_double(Net::HTTPBadRequest)
      allow(response).to receive(:is_a?).with(Net::HTTPSuccess).and_return(false)
      allow(response).to receive(:body).and_return('{"message":"Invalid token"}')
      allow(response).to receive(:code).and_return("400")
      allow(service.client).to receive(:push_message).and_return(response)

      expect {
        service.push_text("U1234", "Hello")
      }.to raise_error(LineMessageService::DeliveryError, /Invalid token/)
    end
  end

  describe '#push_image' do
    let(:service) { described_class.new(tenant) }

    it 'sends an image message' do
      response = instance_double(Net::HTTPOK)
      allow(response).to receive(:is_a?).with(Net::HTTPSuccess).and_return(true)
      allow(service.client).to receive(:push_message).and_return(response)

      service.push_image("U1234", "https://example.com/img.jpg")
      expect(service.client).to have_received(:push_message).with(
        "U1234",
        {
          type: "image",
          originalContentUrl: "https://example.com/img.jpg",
          previewImageUrl: "https://example.com/img.jpg"
        }
      )
    end
  end

  describe '#push_flex' do
    let(:service) { described_class.new(tenant) }

    it 'sends a flex message' do
      response = instance_double(Net::HTTPOK)
      allow(response).to receive(:is_a?).with(Net::HTTPSuccess).and_return(true)
      allow(service.client).to receive(:push_message).and_return(response)

      contents = { type: "bubble", body: { type: "box" } }
      service.push_flex("U1234", "物件情報", contents)
      expect(service.client).to have_received(:push_message).with(
        "U1234",
        {
          type: "flex",
          altText: "物件情報",
          contents: contents
        }
      )
    end
  end

  describe '#get_profile' do
    let(:service) { described_class.new(tenant) }

    it 'returns profile hash on success' do
      response = instance_double(Net::HTTPOK)
      allow(response).to receive(:is_a?).with(Net::HTTPSuccess).and_return(true)
      allow(response).to receive(:body).and_return('{"displayName":"Test User","userId":"U1234"}')
      allow(service.client).to receive(:get_profile).and_return(response)

      profile = service.get_profile("U1234")
      expect(profile["displayName"]).to eq("Test User")
    end

    it 'returns nil on failure' do
      response = instance_double(Net::HTTPNotFound)
      allow(response).to receive(:is_a?).with(Net::HTTPSuccess).and_return(false)
      allow(service.client).to receive(:get_profile).and_return(response)

      expect(service.get_profile("U1234")).to be_nil
    end
  end

  describe '#verify_signature' do
    let(:service) { described_class.new(tenant) }

    it 'delegates to client validate_signature' do
      allow(service.client).to receive(:validate_signature).and_return(true)
      expect(service.verify_signature("body", "sig")).to be true
    end
  end
end
