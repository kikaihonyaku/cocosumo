# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PropertyInquiryMailbox, type: :mailbox do
  let(:tenant) { create(:tenant, subdomain: 'demo') }
  let(:building) { create(:building, tenant: tenant) }
  let(:room) { create(:room, building: building) }

  before do
    tenant.update!(settings: { 'default_inquiry_room_id' => room.id })
  end

  describe 'routing' do
    it 'routes demo-inquiry@inbound.cocosumo.space to PropertyInquiryMailbox' do
      expect(PropertyInquiryMailbox)
        .to receive_inbound_email(to: 'demo-inquiry@inbound.cocosumo.space')
    end

    it 'routes tenant1-inquiry@inbound.cocosumo.space to PropertyInquiryMailbox' do
      expect(PropertyInquiryMailbox)
        .to receive_inbound_email(to: 'tenant1-inquiry@inbound.cocosumo.space')
    end

    it 'does not route non-inquiry addresses to PropertyInquiryMailbox' do
      expect(PropertyInquiryMailbox)
        .not_to receive_inbound_email(to: 'info@inbound.cocosumo.space')
    end
  end

  describe '#process' do
    let(:sender_email) { 'customer@example.com' }
    let(:sender_name) { 'Test Customer' }

    def create_inbound_email(to:, from:, subject:, body:)
      receive_inbound_email_from_mail(
        to: to,
        from: "#{from[:name]} <#{from[:email]}>",
        subject: subject,
        body: body
      )
    end

    context 'with valid tenant and email' do
      it 'creates a new PropertyInquiry' do
        expect {
          create_inbound_email(
            to: 'demo-inquiry@inbound.cocosumo.space',
            from: { name: sender_name, email: sender_email },
            subject: 'Property Inquiry',
            body: 'I am interested in renting a room.'
          )
        }.to change(PropertyInquiry, :count).by(1)
      end

      it 'creates a new Customer if not exists' do
        expect {
          create_inbound_email(
            to: 'demo-inquiry@inbound.cocosumo.space',
            from: { name: sender_name, email: sender_email },
            subject: 'Property Inquiry',
            body: 'I am interested in renting a room.'
          )
        }.to change(Customer, :count).by(1)
      end

      it 'creates an Inquiry record' do
        expect {
          create_inbound_email(
            to: 'demo-inquiry@inbound.cocosumo.space',
            from: { name: sender_name, email: sender_email },
            subject: 'Property Inquiry',
            body: 'I am interested in renting a room.'
          )
        }.to change(Inquiry, :count).by(1)
      end

      it 'sets correct attributes on PropertyInquiry' do
        create_inbound_email(
          to: 'demo-inquiry@inbound.cocosumo.space',
          from: { name: sender_name, email: sender_email },
          subject: 'Property Inquiry',
          body: 'I am interested in renting a room.'
        )

        inquiry = PropertyInquiry.last
        expect(inquiry).to have_attributes(
          email: sender_email,
          media_type: 'email',
          channel: 'email',
          origin_type: 'general_inquiry'
        )
        expect(inquiry.message).to include('I am interested in renting a room.')
      end

      it 'associates inquiry with default room' do
        create_inbound_email(
          to: 'demo-inquiry@inbound.cocosumo.space',
          from: { name: sender_name, email: sender_email },
          subject: 'Property Inquiry',
          body: 'Hello'
        )

        inquiry = PropertyInquiry.last
        expect(inquiry.room).to eq(room)
      end

      it 'reuses existing customer with same email' do
        existing_customer = create(:customer, tenant: tenant, email: sender_email, name: 'Old Name')

        expect {
          create_inbound_email(
            to: 'demo-inquiry@inbound.cocosumo.space',
            from: { name: sender_name, email: sender_email },
            subject: 'Property Inquiry',
            body: 'Follow up inquiry'
          )
        }.not_to change(Customer, :count)

        inquiry = PropertyInquiry.last
        expect(inquiry.customer).to eq(existing_customer)
      end
    end

    context 'with unknown tenant' do
      it 'bounces the email' do
        expect {
          create_inbound_email(
            to: 'unknown-inquiry@inbound.cocosumo.space',
            from: { name: sender_name, email: sender_email },
            subject: 'Property Inquiry',
            body: 'Hello'
          )
        }.not_to change(PropertyInquiry, :count)
      end
    end

    context 'with suspended tenant' do
      before do
        tenant.update!(status: :suspended)
      end

      it 'bounces the email' do
        expect {
          create_inbound_email(
            to: 'demo-inquiry@inbound.cocosumo.space',
            from: { name: sender_name, email: sender_email },
            subject: 'Property Inquiry',
            body: 'Hello'
          )
        }.not_to change(PropertyInquiry, :count)
      end
    end

    context 'with rate limiting' do
      before do
        customer = create(:customer, tenant: tenant, email: sender_email, name: sender_name)
        inquiry_record = tenant.inquiries.create!(customer: customer)
        PropertyInquiryMailbox::RATE_LIMIT_COUNT.times do
          PropertyInquiry.create!(
            room: room,
            customer: customer,
            inquiry: inquiry_record,
            name: sender_name,
            email: sender_email,
            message: 'Test',
            media_type: :email,
            channel: :email,
            origin_type: :general_inquiry
          )
        end
      end

      it 'bounces when rate limit is exceeded' do
        expect {
          create_inbound_email(
            to: 'demo-inquiry@inbound.cocosumo.space',
            from: { name: sender_name, email: sender_email },
            subject: 'Property Inquiry',
            body: 'Another inquiry'
          )
        }.not_to change(PropertyInquiry, :count)
      end
    end

    context 'message sanitization' do
      it 'strips HTML tags from message body' do
        create_inbound_email(
          to: 'demo-inquiry@inbound.cocosumo.space',
          from: { name: sender_name, email: sender_email },
          subject: 'Property Inquiry',
          body: '<p>Hello <strong>World</strong></p><script>alert("xss")</script>'
        )

        inquiry = PropertyInquiry.last
        expect(inquiry.message).not_to include('<p>')
        expect(inquiry.message).not_to include('<script>')
      end

      it 'truncates very long messages' do
        long_message = 'A' * 20_000

        create_inbound_email(
          to: 'demo-inquiry@inbound.cocosumo.space',
          from: { name: sender_name, email: sender_email },
          subject: 'Property Inquiry',
          body: long_message
        )

        inquiry = PropertyInquiry.last
        expect(inquiry.message.length).to be <= PropertyInquiryMailbox::MAX_MESSAGE_LENGTH
      end
    end
  end
end
