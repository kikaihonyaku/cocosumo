# frozen_string_literal: true

RSpec.configure do |config|
  config.before(:suite) do
    FactoryBot.find_definitions
  end
end
