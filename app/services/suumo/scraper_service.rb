# frozen_string_literal: true

require "digest"

module Suumo
  class ScraperService
    class ScrapingError < StandardError; end

    # SUUMOから取得する項目のみを更新対象とする
    SUUMO_BUILDING_ATTRS = %i[name address building_type floors built_date structure].freeze
    SUUMO_ROOM_ATTRS = %i[floor rent management_fee deposit key_money room_type area].freeze

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
        buildings_updated: 0,
        buildings_skipped: 0,
        rooms_created: 0,
        rooms_updated: 0,
        rooms_skipped: 0,
        images_downloaded: 0,
        images_skipped: 0,
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
      external_key = generate_building_key(property_data[:address], property_data[:building_name])

      # まずexternal_keyで検索
      existing = @tenant.buildings.find_by(external_key: external_key) if external_key.present?

      # 見つからない場合は名前の正規化で検索（後方互換性）
      unless existing
        normalized_name = normalize_name(property_data[:building_name])
        existing = @tenant.buildings.find_by("LOWER(REPLACE(name, ' ', '')) = ?", normalized_name.downcase)
      end

      if existing
        return nil if @options[:dry_run]

        # SUUMO項目のみ更新
        building_attrs = @data_mapper.map_building(property_data)
        suumo_attrs = building_attrs.slice(*SUUMO_BUILDING_ATTRS)

        existing.update(suumo_attrs.merge(
          external_key: external_key,
          suumo_imported_at: Time.current
        ))

        @logger.info "[SUUMO Scraper] Updated building: #{property_data[:building_name]}"
        @stats[:buildings_updated] += 1

        # ジオコーディングをバックグラウンドで実行（locationがない場合）
        GeocodeBuildingJob.perform_later(existing.id) if existing.location.blank?

        # Download building images (skip existing)
        unless @options[:skip_images]
          download_building_images(existing, property_data[:building_image_urls] || [])
        end

        return existing
      end

      return nil if @options[:dry_run]

      building_attrs = @data_mapper.map_building(property_data)
      building_attrs[:tenant_id] = @tenant.id
      building_attrs[:external_key] = external_key
      building_attrs[:suumo_imported_at] = Time.current

      building = Building.new(building_attrs)

      if building.save
        @logger.info "[SUUMO Scraper] Created building: #{building.name}"
        @stats[:buildings_created] += 1

        # ジオコーディングをバックグラウンドで実行
        GeocodeBuildingJob.perform_later(building.id) if building.location.blank?

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

    def generate_building_key(address, name)
      return nil if address.blank? && name.blank?

      normalized = normalize_name(address.to_s) + normalize_name(name.to_s)
      Digest::SHA256.hexdigest(normalized)[0..15]
    end

    def process_room(building, room_data, image_urls)
      room_number = room_data[:room_number] || extract_room_number(room_data)
      suumo_code = extract_suumo_code(room_data[:detail_url])

      # まずsuumo_room_codeで検索
      existing = building.rooms.find_by(suumo_room_code: suumo_code) if suumo_code.present?

      # 見つからない場合は部屋番号で検索（後方互換性）
      existing ||= building.rooms.find_by(room_number: room_number)

      if existing
        return if @options[:dry_run]

        # SUUMO項目のみ更新
        room_attrs = @data_mapper.map_room(room_data)
        suumo_attrs = room_attrs.slice(*SUUMO_ROOM_ATTRS)

        existing.update(suumo_attrs.merge(
          suumo_room_code: suumo_code,
          suumo_detail_url: room_data[:detail_url],
          suumo_imported_at: Time.current
        ))

        @logger.info "[SUUMO Scraper] Updated room: #{building.name} - #{existing.room_number}"
        @stats[:rooms_updated] += 1

        # Download room images (skip existing)
        unless @options[:skip_images]
          room_images = room_data[:image_urls] || image_urls || []
          download_room_images(existing, room_images)
        end

        return
      end

      return if @options[:dry_run]

      room_attrs = @data_mapper.map_room(room_data)
      room_attrs[:room_number] = room_number
      room_attrs[:suumo_room_code] = suumo_code
      room_attrs[:suumo_detail_url] = room_data[:detail_url]
      room_attrs[:suumo_imported_at] = Time.current

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

    def extract_suumo_code(detail_url)
      return nil unless detail_url

      # https://suumo.jp/chintai/jnc_000012345678/ から jnc_000012345678 を抽出
      if detail_url =~ /\/(jnc_[a-z0-9]+)\/?/i
        $1
      elsif detail_url =~ /\/([a-z]+_\d+)\/?/i
        $1
      else
        nil
      end
    end

    def download_building_images(building, image_urls)
      image_urls.each_with_index do |url, index|
        # source_urlで既存チェック
        if building.building_photos.exists?(source_url: url)
          @logger.debug "[SUUMO Scraper] Building image already exists: #{url}"
          @stats[:images_skipped] += 1
          next
        end

        photo_type = index.zero? ? :exterior : :other

        if @image_downloader.download_and_attach_building_photo(
          url: url,
          building: building,
          photo_type: photo_type,
          display_order: index,
          source_url: url
        )
          @stats[:images_downloaded] += 1
        end

        sleep(0.5) # Small delay between image downloads
      end
    end

    def download_room_images(room, image_urls)
      image_urls.each_with_index do |url, index|
        # source_urlで既存チェック
        if room.room_photos.exists?(source_url: url)
          @logger.debug "[SUUMO Scraper] Room image already exists: #{url}"
          @stats[:images_skipped] += 1
          next
        end

        # Try to detect photo type from URL or default to interior/other
        photo_type = detect_room_photo_type(url, index)

        if @image_downloader.download_and_attach_room_photo(
          url: url,
          room: room,
          photo_type: photo_type,
          display_order: index,
          source_url: url
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
