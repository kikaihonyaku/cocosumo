# frozen_string_literal: true

# SimpleCov must be started before any application code is loaded
require 'simplecov'
SimpleCov.start 'rails' do
  add_filter '/spec/'
  add_filter '/config/'
  add_filter '/vendor/'

  add_group 'Models', 'app/models'
  add_group 'Controllers', 'app/controllers'
  add_group 'Services', 'app/services'
  add_group 'Jobs', 'app/jobs'

  minimum_coverage 50
  minimum_coverage_by_file 30
end

RSpec.configure do |config|
  config.expect_with :rspec do |expectations|
    expectations.include_chain_clauses_in_custom_matcher_descriptions = true
  end

  config.mock_with :rspec do |mocks|
    mocks.verify_partial_doubles = true
  end

  config.shared_context_metadata_behavior = :apply_to_host_groups

  # Focus filter
  config.filter_run_when_matching :focus

  # Persist state for --only-failures
  config.example_status_persistence_file_path = "spec/examples.txt"

  # Disable monkey patching
  config.disable_monkey_patching!

  # Use doc formatter for single file runs
  if config.files_to_run.one?
    config.default_formatter = "doc"
  end

  # Show slow examples
  config.profile_examples = 10

  # Random order
  config.order = :random
  Kernel.srand config.seed
end
