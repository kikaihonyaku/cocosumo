# frozen_string_literal: true

require 'vcr'
require 'webmock/rspec'

VCR.configure do |config|
  config.cassette_library_dir = 'spec/fixtures/vcr_cassettes'
  config.hook_into :webmock
  config.ignore_localhost = true
  config.configure_rspec_metadata!

  # Filter sensitive data
  config.filter_sensitive_data('<GOOGLE_MAPS_API_KEY>') { ENV['GOOGLE_MAPS_API_KEY'] }
  config.filter_sensitive_data('<GOOGLE_MAPS_API_KEY>') { ENV['VITE_GOOGLE_MAPS_API_KEY'] }
  config.filter_sensitive_data('<GOOGLE_CLOUD_PROJECT_ID>') { ENV['GOOGLE_CLOUD_PROJECT_ID'] }

  config.default_cassette_options = {
    record: :new_episodes,
    match_requests_on: [:method, :uri, :body]
  }
end

RSpec.configure do |config|
  config.around(:each, :vcr) do |example|
    name = example.metadata[:full_description]
              .gsub(/\s+/, '_')
              .gsub(/[^\w\/]/, '')
              .downcase[0..100]
    VCR.use_cassette(name) { example.run }
  end
end
