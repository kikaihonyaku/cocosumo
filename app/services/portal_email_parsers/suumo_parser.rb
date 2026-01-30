# frozen_string_literal: true

module PortalEmailParsers
  class SuumoParser < BaseParser
    # SUUMOの反響メールフォーマットに基づいてパース
    # ※具体的なフォーマットはサンプルメール入手後に正規表現を調整
    def parse(mail)
      body = extract_body(mail)

      {
        name: extract_name(body),
        email: extract_email(body),
        phone: extract_phone(body),
        message: body,
        origin_type: detect_origin_type(body)
      }
    end

    private

    def extract_name(body)
      extract_field(body, /お名前[：:]\s*(.+)/) ||
        extract_field(body, /氏名[：:]\s*(.+)/) ||
        extract_field(body, /名前[：:]\s*(.+)/)
    end

    def extract_email(body)
      extract_field(body, /メールアドレス[：:]\s*(\S+@\S+)/) ||
        extract_field(body, /E-?mail[：:]\s*(\S+@\S+)/i) ||
        extract_field(body, /連絡先メール[：:]\s*(\S+@\S+)/)
    end

    def extract_phone(body)
      extract_field(body, /電話番号[：:]\s*([\d\-（）()]+)/) ||
        extract_field(body, /TEL[：:]\s*([\d\-（）()]+)/i) ||
        extract_field(body, /連絡先[：:]\s*([\d\-（）()]+)/)
    end

    def detect_origin_type(body)
      if body.include?("資料請求")
        :document_request
      elsif body.include?("見学予約") || body.include?("内見")
        :visit_reservation
      else
        :general_inquiry
      end
    end
  end
end
