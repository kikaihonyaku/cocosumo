# frozen_string_literal: true

require "rails_helper"

RSpec.describe PortalInquiryMailbox, type: :mailbox do
  let(:tenant) { create(:tenant, subdomain: "demo") }
  let(:building) { create(:building, tenant: tenant) }
  let(:room) { create(:room, building: building) }

  before do
    tenant.update!(settings: { "default_inquiry_room_id" => room.id })
  end

  describe "routing" do
    it "routes demo-inquiry-suumo@inbound.cocosumo.space to PortalInquiryMailbox" do
      expect(PortalInquiryMailbox)
        .to receive_inbound_email(to: "demo-inquiry-suumo@inbound.cocosumo.space")
    end

    it "routes tenant1-inquiry-athome@inbound.cocosumo.space to PortalInquiryMailbox" do
      expect(PortalInquiryMailbox)
        .to receive_inbound_email(to: "tenant1-inquiry-athome@inbound.cocosumo.space")
    end

    it "does not route plain inquiry addresses to PortalInquiryMailbox" do
      expect(PortalInquiryMailbox)
        .not_to receive_inbound_email(to: "demo-inquiry@inbound.cocosumo.space")
    end

    it "does not route unsupported portal names" do
      expect(PortalInquiryMailbox)
        .not_to receive_inbound_email(to: "demo-inquiry-unknown@inbound.cocosumo.space")
    end
  end

  describe "#process" do
    def create_inbound_email(to:, from:, subject:, body:)
      receive_inbound_email_from_mail(
        to: to,
        from: "#{from[:name]} <#{from[:email]}>",
        subject: subject,
        body: body
      )
    end

    let(:suumo_body) do
      <<~BODY
        SUUMOからのお問い合わせ

        お名前: 山田太郎
        メールアドレス: yamada@example.com
        電話番号: 090-1234-5678

        以下の物件について資料請求いたします。
      BODY
    end

    context "with valid SUUMO portal email" do
      it "creates a new PropertyInquiry" do
        expect {
          create_inbound_email(
            to: "demo-inquiry-suumo@inbound.cocosumo.space",
            from: { name: "SUUMO", email: "noreply@suumo.jp" },
            subject: "SUUMOからの反響",
            body: suumo_body
          )
        }.to change(PropertyInquiry, :count).by(1)
      end

      it "creates a new Customer" do
        expect {
          create_inbound_email(
            to: "demo-inquiry-suumo@inbound.cocosumo.space",
            from: { name: "SUUMO", email: "noreply@suumo.jp" },
            subject: "SUUMOからの反響",
            body: suumo_body
          )
        }.to change(Customer, :count).by(1)
      end

      it "creates an Inquiry record" do
        expect {
          create_inbound_email(
            to: "demo-inquiry-suumo@inbound.cocosumo.space",
            from: { name: "SUUMO", email: "noreply@suumo.jp" },
            subject: "SUUMOからの反響",
            body: suumo_body
          )
        }.to change(Inquiry, :count).by(1)
      end

      it "parses customer info from SUUMO email body" do
        create_inbound_email(
          to: "demo-inquiry-suumo@inbound.cocosumo.space",
          from: { name: "SUUMO", email: "noreply@suumo.jp" },
          subject: "SUUMOからの反響",
          body: suumo_body
        )

        inquiry = PropertyInquiry.last
        expect(inquiry).to have_attributes(
          name: "山田太郎",
          email: "yamada@example.com",
          phone: "090-1234-5678",
          media_type: "suumo",
          origin_type: "document_request",
          channel: "email"
        )
      end

      it "associates inquiry with default room" do
        create_inbound_email(
          to: "demo-inquiry-suumo@inbound.cocosumo.space",
          from: { name: "SUUMO", email: "noreply@suumo.jp" },
          subject: "SUUMOからの反響",
          body: suumo_body
        )

        inquiry = PropertyInquiry.last
        expect(inquiry.room).to eq(room)
      end

      it "detects visit_reservation origin type" do
        visit_body = <<~BODY
          SUUMOからのお問い合わせ

          お名前: 佐藤花子
          メールアドレス: sato@example.com
          電話番号: 080-9876-5432

          内見を希望します。
        BODY

        create_inbound_email(
          to: "demo-inquiry-suumo@inbound.cocosumo.space",
          from: { name: "SUUMO", email: "noreply@suumo.jp" },
          subject: "SUUMOからの反響",
          body: visit_body
        )

        inquiry = PropertyInquiry.last
        expect(inquiry.origin_type).to eq("visit_reservation")
      end
    end

    context "with unparseable SUUMO email" do
      it "falls back to sender info" do
        create_inbound_email(
          to: "demo-inquiry-suumo@inbound.cocosumo.space",
          from: { name: "SUUMO Notification", email: "noreply@suumo.jp" },
          subject: "SUUMOからの反響",
          body: "この形式は解析できない本文です。"
        )

        inquiry = PropertyInquiry.last
        expect(inquiry.name).to eq("SUUMO Notification")
        expect(inquiry.email).to eq("noreply@suumo.jp")
        expect(inquiry.phone).to be_nil
        expect(inquiry.message).to include("この形式は解析できない本文です。")
      end
    end

    context "with unknown tenant" do
      it "bounces the email" do
        expect {
          create_inbound_email(
            to: "unknown-inquiry-suumo@inbound.cocosumo.space",
            from: { name: "SUUMO", email: "noreply@suumo.jp" },
            subject: "SUUMOからの反響",
            body: suumo_body
          )
        }.not_to change(PropertyInquiry, :count)
      end
    end

    context "with suspended tenant" do
      before do
        tenant.update!(status: :suspended)
      end

      it "bounces the email" do
        expect {
          create_inbound_email(
            to: "demo-inquiry-suumo@inbound.cocosumo.space",
            from: { name: "SUUMO", email: "noreply@suumo.jp" },
            subject: "SUUMOからの反響",
            body: suumo_body
          )
        }.not_to change(PropertyInquiry, :count)
      end
    end

    context "with rate limiting" do
      before do
        customer = create(:customer, tenant: tenant, email: "noreply@suumo.jp", name: "SUUMO")
        inquiry_record = tenant.inquiries.create!(customer: customer)
        PortalInquiryMailbox::RATE_LIMIT_COUNT.times do
          PropertyInquiry.create!(
            room: room,
            customer: customer,
            inquiry: inquiry_record,
            name: "SUUMO",
            email: "noreply@suumo.jp",
            message: "Test",
            media_type: :suumo,
            channel: :email,
            origin_type: :general_inquiry
          )
        end
      end

      it "bounces when rate limit is exceeded" do
        expect {
          create_inbound_email(
            to: "demo-inquiry-suumo@inbound.cocosumo.space",
            from: { name: "SUUMO", email: "noreply@suumo.jp" },
            subject: "SUUMOからの反響",
            body: suumo_body
          )
        }.not_to change(PropertyInquiry, :count)
      end
    end
  end
end
