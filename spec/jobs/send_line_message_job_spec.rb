# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SendLineMessageJob, type: :job do
  let(:tenant) { create(:tenant) }
  let!(:line_config) { create(:line_config, tenant: tenant) }

  describe '#perform' do
    let(:message) { { "type" => "text", "text" => "Hello" } }

    it 'sends a message via LINE API' do
      response = instance_double(Net::HTTPOK)
      allow(response).to receive(:is_a?).with(Net::HTTPSuccess).and_return(true)

      service = instance_double(LineMessageService, client: double)
      allow(LineMessageService).to receive(:new).and_return(service)
      allow(service.client).to receive(:push_message).and_return(response)

      described_class.perform_now(tenant.id, "U1234", message)
      expect(service.client).to have_received(:push_message).with("U1234", message)
    end

    it 'raises DeliveryError on API failure for retry' do
      response = instance_double(Net::HTTPBadRequest)
      allow(response).to receive(:is_a?).with(Net::HTTPSuccess).and_return(false)
      allow(response).to receive(:body).and_return('{"message":"Rate limit exceeded"}')

      service = instance_double(LineMessageService, client: double)
      allow(LineMessageService).to receive(:new).and_return(service)
      allow(service.client).to receive(:push_message).and_return(response)

      expect {
        described_class.perform_now(tenant.id, "U1234", message)
      }.to raise_error(LineMessageService::DeliveryError)
    end

    it 'retries on DeliveryError' do
      expect(described_class.new.reschedule_at(nil, 1)).to be > Time.current
    end
  end
end
