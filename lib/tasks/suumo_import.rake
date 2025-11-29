# frozen_string_literal: true

namespace :suumo do
  desc "Import properties from SUUMO search results"
  task :import, [:url, :tenant_id] => :environment do |_t, args|
    url = args[:url] || ENV["SUUMO_URL"]
    tenant_id = args[:tenant_id] || ENV["TENANT_ID"]

    unless url && tenant_id
      puts "Usage: rails suumo:import[URL,TENANT_ID]"
      puts "Or: SUUMO_URL=... TENANT_ID=... rails suumo:import"
      puts ""
      puts "Options (via environment variables):"
      puts "  RATE_LIMIT=2.0     - Delay between requests in seconds (default: 2.0)"
      puts "  MAX_PAGES=5        - Maximum number of pages to scrape (default: all)"
      puts "  SKIP_IMAGES=true   - Skip image downloads (default: false)"
      puts "  DRY_RUN=true       - Don't save to database (default: false)"
      exit 1
    end

    tenant = Tenant.find_by(id: tenant_id)
    unless tenant
      puts "Error: Tenant with ID #{tenant_id} not found"
      exit 1
    end

    options = {
      rate_limit_delay: ENV.fetch("RATE_LIMIT", "2.0").to_f,
      max_pages: ENV["MAX_PAGES"]&.to_i,
      skip_images: ENV["SKIP_IMAGES"] == "true",
      dry_run: ENV["DRY_RUN"] == "true"
    }

    puts "=" * 60
    puts "SUUMO Property Import"
    puts "=" * 60
    puts ""
    puts "URL: #{url}"
    puts "Tenant: #{tenant.name} (ID: #{tenant.id})"
    puts ""
    puts "Options:"
    puts "  Rate limit: #{options[:rate_limit_delay]} seconds"
    puts "  Max pages: #{options[:max_pages] || 'unlimited'}"
    puts "  Skip images: #{options[:skip_images]}"
    puts "  Dry run: #{options[:dry_run]}"
    puts ""

    if options[:dry_run]
      puts "[DRY RUN MODE - No data will be saved]"
      puts ""
    end

    print "Continue? (y/N): "
    confirm = $stdin.gets.chomp
    unless confirm.downcase == "y"
      puts "Aborted."
      exit 0
    end

    puts ""
    puts "Starting import..."
    puts "-" * 60

    start_time = Time.current
    service = Suumo::ScraperService.new(tenant: tenant, options: options)
    stats = service.scrape(url)

    elapsed = Time.current - start_time

    puts ""
    puts "=" * 60
    puts "Import Complete!"
    puts "=" * 60
    puts ""
    puts "Results:"
    puts "  Buildings created: #{stats[:buildings_created]}"
    puts "  Buildings skipped: #{stats[:buildings_skipped]}"
    puts "  Rooms created: #{stats[:rooms_created]}"
    puts "  Rooms skipped: #{stats[:rooms_skipped]}"
    puts "  Images downloaded: #{stats[:images_downloaded]}"
    puts ""

    if stats[:errors].any?
      puts "Errors (#{stats[:errors].size}):"
      stats[:errors].first(10).each do |error|
        puts "  - #{error}"
      end
      if stats[:errors].size > 10
        puts "  ... and #{stats[:errors].size - 10} more"
      end
      puts ""
    end

    puts "Time elapsed: #{elapsed.round(1)} seconds"
    puts ""
  end

  desc "Test SUUMO page parsing without saving (dry run)"
  task :test_parse, [:url] => :environment do |_t, args|
    url = args[:url] || ENV["SUUMO_URL"]

    unless url
      puts "Usage: rails suumo:test_parse[URL]"
      puts "Or: SUUMO_URL=... rails suumo:test_parse"
      exit 1
    end

    puts "Fetching: #{url}"
    puts ""

    response = HTTParty.get(
      url,
      headers: {
        "User-Agent" => Rails.application.config.suumo.user_agent,
        "Accept" => "text/html"
      },
      timeout: 30
    )

    unless response.success?
      puts "Error: HTTP #{response.code}"
      exit 1
    end

    parser = Suumo::SearchPageParser.new(response.body)
    items = parser.property_items

    puts "Found #{items.size} properties:"
    puts ""

    items.each_with_index do |item, index|
      puts "#{index + 1}. #{item[:building_name]}"
      puts "   Address: #{item[:address]}"
      puts "   Type: #{item[:building_type]}"
      puts "   Structure: #{item[:structure]}"
      puts "   Floors: #{item[:floors]}"
      puts "   Built: #{item[:built_date]}"
      puts "   Building Images: #{item[:building_image_urls]&.size || 0}"
      puts "   Rooms: #{item[:rooms]&.size || 0}"

      item[:rooms]&.each do |room|
        rent_str = room[:rent] ? room[:rent].to_s.reverse.gsub(/(\d{3})(?=\d)/, '\1,').reverse : "-"
        mgmt_str = room[:management_fee] || "-"
        deposit_str = room[:deposit] || "-"
        key_str = room[:key_money] || "-"
        puts "     - Floor #{room[:floor]}: #{room[:room_type]} #{room[:area]}m² ¥#{rent_str}"
        puts "       Management: ¥#{mgmt_str}, Deposit: ¥#{deposit_str}, Key: ¥#{key_str}"
        puts "       Images: #{room[:image_urls]&.size || 0}"
      end

      puts ""
    end

    if parser.next_page_url
      puts "Next page: #{parser.next_page_url}"
    else
      puts "No more pages"
    end
  end

  desc "List all tenants for reference"
  task list_tenants: :environment do
    puts "Available Tenants:"
    puts ""

    Tenant.all.each do |tenant|
      building_count = tenant.buildings.count
      room_count = Room.joins(:building).where(buildings: { tenant_id: tenant.id }).count
      puts "  ID: #{tenant.id} - #{tenant.name}"
      puts "      Buildings: #{building_count}, Rooms: #{room_count}"
      puts ""
    end
  end
end
