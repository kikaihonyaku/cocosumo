# frozen_string_literal: true

require "rails_helper"

RSpec.describe PortalEmailParsers::SuumoParser do
  subject(:parser) { described_class.new }

  def build_mail(body)
    Mail.new do
      from "noreply@suumo.jp"
      to "demo-inquiry-suumo@inbound.cocosumo.space"
      subject "SUUMOからの反響"
      body body
    end
  end

  describe "#parse" do
    context "with standard SUUMO format" do
      let(:body) do
        <<~BODY
          SUUMOからのお問い合わせ

          お名前: 山田太郎
          メールアドレス: yamada@example.com
          電話番号: 090-1234-5678

          以下の物件について資料請求いたします。
        BODY
      end

      it "extracts customer name" do
        result = parser.parse(build_mail(body))
        expect(result[:name]).to eq("山田太郎")
      end

      it "extracts customer email" do
        result = parser.parse(build_mail(body))
        expect(result[:email]).to eq("yamada@example.com")
      end

      it "extracts customer phone" do
        result = parser.parse(build_mail(body))
        expect(result[:phone]).to eq("090-1234-5678")
      end

      it "includes full body as message" do
        result = parser.parse(build_mail(body))
        expect(result[:message]).to include("山田太郎")
        expect(result[:message]).to include("資料請求")
      end

      it "detects document_request origin type" do
        result = parser.parse(build_mail(body))
        expect(result[:origin_type]).to eq(:document_request)
      end
    end

    context "with alternative field labels" do
      let(:body) do
        <<~BODY
          氏名: 鈴木一郎
          E-mail: suzuki@example.com
          TEL: 03-1234-5678
        BODY
      end

      it "extracts name from 氏名 label" do
        result = parser.parse(build_mail(body))
        expect(result[:name]).to eq("鈴木一郎")
      end

      it "extracts email from E-mail label" do
        result = parser.parse(build_mail(body))
        expect(result[:email]).to eq("suzuki@example.com")
      end

      it "extracts phone from TEL label" do
        result = parser.parse(build_mail(body))
        expect(result[:phone]).to eq("03-1234-5678")
      end
    end

    context "with visit reservation keywords" do
      let(:body) do
        <<~BODY
          お名前: 佐藤花子
          メールアドレス: sato@example.com

          内見を希望します。
        BODY
      end

      it "detects visit_reservation origin type" do
        result = parser.parse(build_mail(body))
        expect(result[:origin_type]).to eq(:visit_reservation)
      end
    end

    context "with 見学予約 keyword" do
      let(:body) { "見学予約のお申し込み" }

      it "detects visit_reservation origin type" do
        result = parser.parse(build_mail(body))
        expect(result[:origin_type]).to eq(:visit_reservation)
      end
    end

    context "with general inquiry (no specific keywords)" do
      let(:body) do
        <<~BODY
          お名前: 田中三郎
          メールアドレス: tanaka@example.com

          詳しい情報を教えてください。
        BODY
      end

      it "detects general_inquiry origin type" do
        result = parser.parse(build_mail(body))
        expect(result[:origin_type]).to eq(:general_inquiry)
      end
    end

    context "with unparseable body" do
      let(:body) { "何も解析できない本文" }

      it "returns nil for name" do
        result = parser.parse(build_mail(body))
        expect(result[:name]).to be_nil
      end

      it "returns nil for email" do
        result = parser.parse(build_mail(body))
        expect(result[:email]).to be_nil
      end

      it "returns nil for phone" do
        result = parser.parse(build_mail(body))
        expect(result[:phone]).to be_nil
      end

      it "still includes the body as message" do
        result = parser.parse(build_mail(body))
        expect(result[:message]).to include("何も解析できない本文")
      end
    end

    context "with full-width colon separator" do
      let(:body) do
        <<~BODY
          お名前：高橋四郎
          メールアドレス：takahashi@example.com
          電話番号：080-5555-1234
        BODY
      end

      it "extracts fields with full-width colons" do
        result = parser.parse(build_mail(body))
        expect(result[:name]).to eq("高橋四郎")
        expect(result[:email]).to eq("takahashi@example.com")
        expect(result[:phone]).to eq("080-5555-1234")
      end
    end
  end
end
