class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch('MAILER_FROM_ADDRESS', 'noreply@cocosumo.space')
  layout "mailer"
end
