# frozen_string_literal: true

module PortalEmailParsers
  class BaseParser
    def parse(mail)
      raise NotImplementedError, "#{self.class}#parse must be implemented"
    end

    protected

    def extract_body(mail)
      body = mail.text_part&.decoded || mail.decoded || ""
      ActionController::Base.helpers.strip_tags(body).truncate(10_000)
    end

    def extract_field(body, pattern)
      body.match(pattern)&.[](1)&.strip
    end
  end
end
