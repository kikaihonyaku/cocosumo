# frozen_string_literal: true

class BouncesMailbox < ApplicationMailbox
  def process
    Rails.logger.info "[BouncesMailbox] Bounced unrecognized email from: #{mail.from&.first} to: #{mail.to&.first}"
    # Simply bounce the email - no further action needed
  end
end
