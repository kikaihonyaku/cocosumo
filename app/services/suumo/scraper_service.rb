# frozen_string_literal: true

module Suumo
  class ScraperService
    class ScrapingError < StandardError; end

    attr_reader :stats

    def initialize(tenant:, options: {})
      @tenant = tenant
      @options = {
        rate_limit_delay: Rails.application.config.suumo.default_rate_limit,
        max_pages: nil,
        skip_images: false,
        dry_run: false
      }.merge(options)

      @logger = Rails.logger
      @stats = {
        buildings_created: 0,
        buildings_skipped: 0,
        rooms_created: 0,
        rooms_skipped: 0,
        images_downloaded: 0,
        errors: []
      }

      @data_mapper = DataMapper.new
      @image_downloader = ImageDownloader.new
    end

    def scrape(search_url)
      @logger.info "[SUUMO Scraper] Starting scrape for URL: #{search_url}"
      @logger.info "[SUUMO Scraper] Options: #{@options}"

      page_count = 0
      current_url = search_url

      loop do
        page_count += 1
        break if @options[:max_pages] && page_count > @options[:max_pages]

        @logger.info "[SUUMO Scraper] Processing page #{page_count}: #{current_url}"

        html = fetch_page(current_url)
        break unless html

        parser = SearchPageParser.new(html)
        property_items = parser.property_items

        @logger.info "[SUUMO Scraper] Found #{property_items.size} properties on page #{page_count}"

        property_items.each do |property_data|
          process_property(property_data)
          sleep(@options[:rate_limit_delay])
        end

        next_url = parser.next_page_url
        break unless next_url

        current_url = make_absolute_url(next_url)
        sleep(@options[:rate_limit_delay])
      end

      @logger.info "[SUUMO Scraper] Completed. Stats: #{@stats}"
      @stats
    end

    private

    def fetch_page(url)
      response = HTTParty.get(url, headers: request_headers, timeout: Rails.application.config.suumo.timeout)

      unless response.success?
        @logger.error "[SUUMO Scraper] Failed to fetch #{url}: #{response.code}"
        @stats[:errors] << { url: url, error: "HTTP #{response.code}" }
        return nil
      end

      response.body
    rescue StandardError => e
      @logger.error "[SUUMO Scraper] Error fetching #{url}: #{e.message}"
      @stats[:errors] << { url: url, error: e.message }
      nil
    end

    def process_property(property_data)
      building_name = property_data[:building_name]
      address = property_data[:address]

      @logger.info "[SUUMO Scraper] Processing: #{building_name}"

      # Find or create building
      building = find_or_create_building(property_data)
      return unless building

      # Process each room in the property
      property_data[:rooms].each do |room_data|
        process_room(building, room_data, property_data[:image_urls])
      end
    end

    def find_or_create_building(property_data)
      normalized_name = normalize_name(property_data[:building_name])
      existing = @tenant.buildings.find_by("LOWER(REPLACE(name, ' ', '')) = ?", normalized_name.downcase)

      if existing
        @logger.info "[SUUMO Scraper] Building exists: #{property_data[:building_name]}"
        @stats[:buildings_skipped] += 1
        return existing
      end

      return nil if @options[:dry_run]

      building_attrs = @data_mapper.map_building(property_data)
      building_attrs[:tenant_id] = @tenant.id

      building = Building.new(building_attrs)

      if building.save
        @logger.info "[SUUMO Scraper] Created building: #{building.name}"
        @stats[:buildings_created] += 1

        # Download building images
        unless @options[:skip_images]
          download_building_images(building, property_data[:building_image_urls] || [])
        end

        building
      else
        @logger.error "[SUUMO Scraper] Failed to create building: #{building.errors.full_messages.join(', ')}"
        @stats[:errors] << { building: property_data[:building_name], error: building.errors.full_messages }
        nil
      end
    end

    def process_room(building, room_data, image_urls)
      room_number = room_data[:room_number] || extract_room_number(room_data)

      existing = building.rooms.find_by(room_number: room_number)
      if existing
        @logger.info "[SUUMO Scraper] Room exists: #{building.name} - #{room_number}"
        @stats[:rooms_skipped] += 1
        return
      end

      return if @options[:dry_run]

      room_attrs = @data_mapper.map_room(room_data)
      room_attrs[:room_number] = room_number

      room = building.rooms.new(room_attrs)

      if room.save
        @logger.info "[SUUMO Scraper] Created room: #{building.name} - #{room.room_number}"
        @stats[:rooms_created] += 1

        # Download room images
        unless @options[:skip_images]
          room_images = room_data[:image_urls] || image_urls || []
          download_room_images(room, room_images)
        end
      else
        @logger.error "[SUUMO Scraper] Failed to create room: #{room.errors.full_messages.join(', ')}"
        @stats[:errors] << { room: "#{building.name} - #{room_number}", error: room.errors.full_messages }
      end
    end

    def download_building_images(building, image_urls)
      image_urls.each_with_index do |url, index|
        photo_type = index.zero? ? :exterior : :other

        if @image_downloader.download_and_attach_building_photo(
          url: url,
          building: building,
          photo_type: photo_type,
          display_order: index
        )
          @stats[:images_downloaded] += 1
        end

        sleep(0.5) # Small delay between image downloads
      end
    end

    def download_room_images(room, image_urls)
      image_urls.each_with_index do |url, index|
        # Try to detect photo type from URL or default to interior/other
        photo_type = detect_room_photo_type(url, index)

        if @image_downloader.download_and_attach_room_photo(
          url: url,
          room: room,
          photo_type: photo_type,
          display_order: index
        )
          @stats[:images_downloaded] += 1
        end

        sleep(0.5) # Small delay between image downloads
      end
    end

    def detect_room_photo_type(url, index)
      url_lower = url.downcase

      if url_lower.include?("madori") || url_lower.include?("floor")
        :floor_plan
      elsif url_lower.include?("kitchen")
        :kitchen
      elsif url_lower.include?("bath") || url_lower.include?("bathroom")
        :bathroom
      elsif url_lower.include?("living")
        :living
      elsif index.zero?
        :interior
      else
        :other
      end
    end

    def extract_room_number(room_data)
      # Try to extract room number from floor info or generate one
      floor = room_data[:floor]
      if floor
        "#{floor}F-#{SecureRandom.hex(2).upcase}"
      else
        SecureRandom.hex(4).upcase
      end
    end

    def normalize_name(name)
      return "" unless name

      name.gsub(/[\s　]/, "") # Remove all whitespace
          .tr("０-９", "0-9") # Full-width to half-width numbers
          .tr("Ａ-Ｚａ-ｚ", "A-Za-z") # Full-width to half-width letters
    end

    def make_absolute_url(url)
      return url if url.start_with?("http")

      base_url = Rails.application.config.suumo.base_url
      URI.join(base_url, url).to_s
    end

    def request_headers
      {
        "User-Agent" => Rails.application.config.suumo.user_agent,
        "Accept" => "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language" => "ja,en;q=0.5",
        "Connection" => "keep-alive"
      }
    end
  end
end
