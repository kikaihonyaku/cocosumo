# frozen_string_literal: true

require 'database_cleaner/active_record'

RSpec.configure do |config|
  # PostGIS system tables to exclude from cleaning
  POSTGIS_TABLES = %w[
    spatial_ref_sys
    geometry_columns
    geography_columns
    raster_columns
    raster_overviews
    layer
    topology
  ].freeze

  config.before(:suite) do
    DatabaseCleaner.strategy = :transaction
    DatabaseCleaner.clean_with(:truncation, except: POSTGIS_TABLES)
  end

  config.around(:each) do |example|
    DatabaseCleaner.cleaning do
      example.run
    end
  end
end
