# frozen_string_literal: true

# factory_bot_rails auto-loads factories from spec/factories
# No need to manually call find_definitions

RSpec.configure do |config|
  config.include FactoryBot::Syntax::Methods
end
