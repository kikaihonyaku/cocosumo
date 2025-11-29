# frozen_string_literal: true

module Suumo
  class SearchPageParser
    def initialize(html)
      @doc = Nokogiri::HTML(html)
    end

    # Extract all property items from the search result page
    def property_items
      items = []

      # SUUMO uses .cassetteitem for each property listing
      @doc.css(".cassetteitem").each do |cassette|
        property = parse_cassette_item(cassette)
        items << property if property
      end

      items
    end

    # Get the next page URL for pagination
    def next_page_url
      # SUUMO pagination: look for the "次へ" (next) link
      next_link = @doc.at_css(".pagination-parts a:contains('次へ')") ||
                  @doc.at_css("p.pagination-parts a:last-child")

      return nil unless next_link
      return nil if next_link.text.include?("前へ")

      next_link.attr("href")
    end

    # Get total property count
    def total_count
      count_elem = @doc.at_css(".paginate_set-hit")
      return 0 unless count_elem

      count_text = count_elem.text.gsub(/[^\d]/, "")
      count_text.to_i
    end

    private

    def parse_cassette_item(cassette)
      # Building info
      building_name = extract_text(cassette.at_css(".cassetteitem_content-title"))
      return nil if building_name.blank?

      # Building type from label
      building_type_label = extract_text(cassette.at_css(".cassetteitem_content-label .ui-pct"))
      building_type = parse_building_type(building_type_label)

      # Address from detail-col1
      address = extract_text(cassette.at_css(".cassetteitem_detail-col1"))

      # Access info from detail-col2
      access_info = extract_access_info(cassette.at_css(".cassetteitem_detail-col2"))

      # Building structure info from detail-col3
      building_info = extract_building_info(cassette.at_css(".cassetteitem_detail-col3"))

      # Building main image
      building_image_urls = extract_building_images(cassette)

      # Extract all room data from tbodys
      rooms = extract_rooms(cassette)

      {
        building_name: building_name,
        address: address,
        access_info: access_info,
        building_type: building_type || building_info[:type],
        floors: building_info[:floors],
        built_date: building_info[:built_date],
        structure: building_info[:structure],
        building_image_urls: building_image_urls,
        rooms: rooms
      }
    end

    def parse_building_type(label)
      return nil if label.blank?

      if label.include?("マンション")
        "マンション"
      elsif label.include?("アパート")
        "アパート"
      elsif label.include?("一戸建")
        "一戸建て"
      else
        nil
      end
    end

    def extract_access_info(element)
      return nil unless element

      # Access info contains multiple divs with station/walk info
      lines = element.css(".cassetteitem_detail-text").map { |div| extract_text(div) }.compact.reject(&:blank?)
      lines.join(" / ")
    end

    def extract_building_info(element)
      result = { type: nil, floors: nil, built_date: nil, structure: nil }
      return result unless element

      divs = element.css("div")
      divs.each do |div|
        text = extract_text(div)
        next if text.blank?

        # Parse floors
        if text =~ /(\d+)階建/
          result[:floors] = $1.to_i
        end

        # Parse built date
        if text =~ /築(\d+)年/
          years_ago = $1.to_i
          result[:built_date] = Date.today - years_ago.years
        elsif text =~ /新築/
          result[:built_date] = Date.today
        end
      end

      result
    end

    def extract_building_images(cassette)
      urls = []

      # Main building image from .cassetteitem_object-item img
      main_img = cassette.at_css(".cassetteitem_object-item img")
      if main_img
        src = main_img.attr("rel") || main_img.attr("data-src") || main_img.attr("src")
        urls << make_absolute_url(src) if valid_image_url?(src)
      end

      urls.uniq.compact
    end

    def extract_rooms(cassette)
      rooms = []

      # Each room is in a tbody within the cassetteitem_other table
      cassette.css("table.cassetteitem_other tbody").each do |tbody|
        room = parse_room_tbody(tbody)
        rooms << room if room
      end

      rooms
    end

    def parse_room_tbody(tbody)
      tds = tbody.css("td")
      return nil if tds.size < 6

      # Table structure (0-indexed):
      # 0: checkbox
      # 1: thumbnail
      # 2: floor
      # 3: rent/management fee
      # 4: deposit/key money
      # 5: room type/area
      # 6: tags
      # 7: favorite
      # 8: detail link

      floor = extract_floor(tds[2])
      rent_info = extract_rent_info(tds[3])
      deposit_info = extract_deposit_info(tds[4])
      room_info = extract_room_info(tds[5])
      detail_url = extract_detail_url(tds[8])
      room_images = extract_room_images_from_td(tds[1])

      {
        floor: floor,
        rent: rent_info[:rent],
        management_fee: rent_info[:management_fee],
        deposit: deposit_info[:deposit],
        key_money: deposit_info[:key_money],
        room_type: room_info[:room_type],
        area: room_info[:area],
        detail_url: detail_url,
        image_urls: room_images,
        room_number: generate_room_number(floor)
      }
    end

    def extract_floor(element)
      return 1 unless element

      text = extract_text(element)
      return 1 if text.blank?

      if text =~ /(\d+)階/
        $1.to_i
      elsif text =~ /B(\d+)/
        -$1.to_i
      elsif text =~ /(\d+)/
        $1.to_i
      else
        1
      end
    end

    def extract_rent_info(element)
      result = { rent: nil, management_fee: nil }
      return result unless element

      # Rent
      rent_elem = element.at_css(".cassetteitem_price--rent")
      if rent_elem
        rent_text = extract_text(rent_elem)
        result[:rent] = parse_price(rent_text)
      end

      # Management fee
      admin_elem = element.at_css(".cassetteitem_price--administration")
      if admin_elem
        admin_text = extract_text(admin_elem)
        result[:management_fee] = parse_price(admin_text)
      end

      result
    end

    def extract_deposit_info(element)
      result = { deposit: nil, key_money: nil }
      return result unless element

      # Deposit
      deposit_elem = element.at_css(".cassetteitem_price--deposit")
      if deposit_elem
        deposit_text = extract_text(deposit_elem)
        result[:deposit] = parse_price(deposit_text)
      end

      # Key money (gratuity)
      key_elem = element.at_css(".cassetteitem_price--gratuity")
      if key_elem
        key_text = extract_text(key_elem)
        result[:key_money] = parse_price(key_text)
      end

      result
    end

    def extract_room_info(element)
      result = { room_type: nil, area: nil }
      return result unless element

      # Room type (floor plan)
      type_elem = element.at_css(".cassetteitem_madori")
      if type_elem
        result[:room_type] = extract_text(type_elem)
      end

      # Area
      area_elem = element.at_css(".cassetteitem_menseki")
      if area_elem
        area_text = extract_text(area_elem)
        if area_text =~ /([\d.]+)/
          result[:area] = $1.to_f
        end
      end

      result
    end

    def extract_detail_url(element)
      return nil unless element

      link = element.at_css("a.cassetteitem_other-linktext") || element.at_css("a")
      return nil unless link

      href = link.attr("href")
      make_absolute_url(href)
    end

    def extract_room_images_from_td(element)
      return [] unless element

      urls = []

      # Images are stored in data-imgs attribute as comma-separated URLs
      thumbnail_div = element.at_css(".casssetteitem_other-thumbnail, .cassetteitem_other-thumbnail")
      if thumbnail_div
        data_imgs = thumbnail_div.attr("data-imgs")
        if data_imgs.present?
          urls = data_imgs.split(",").map(&:strip).select { |u| valid_image_url?(u) }
        end
      end

      # Also check for img tags with rel attribute
      if urls.empty?
        element.css("img").each do |img|
          src = img.attr("rel") || img.attr("data-src") || img.attr("src")
          urls << src if valid_image_url?(src)
        end
      end

      urls.map { |u| make_absolute_url(u) }.uniq.compact
    end

    def generate_room_number(floor)
      floor ||= 1
      room_index = SecureRandom.hex(2).upcase
      "#{floor}#{room_index}"
    end

    def extract_text(element)
      return nil unless element

      element.text.strip.gsub(/\s+/, " ")
    end

    def parse_price(text)
      return nil if text.blank?

      # Handle "万円" format (e.g., "6.9万円")
      if text =~ /([\d.]+)万/
        return ($1.to_f * 10_000).to_i
      end

      # Handle plain number with 円 (e.g., "5000円")
      if text =~ /([\d,]+)円/
        return $1.gsub(",", "").to_i
      end

      # Handle month count format for deposit/key money (e.g., "1ヶ月")
      if text =~ /([\d.]+)ヶ月/
        return nil # Will need to calculate based on rent later
      end

      # Handle "-" or "なし"
      return 0 if text.strip == "-" || text.include?("なし")

      nil
    end

    def valid_image_url?(url)
      return false if url.blank?
      return false if url.start_with?("data:")
      return false if url.include?("gif;base64")

      true
    end

    def make_absolute_url(url)
      return nil if url.blank?
      return nil unless valid_image_url?(url)

      if url.start_with?("//")
        "https:#{url}"
      elsif url.start_with?("/")
        "https://suumo.jp#{url}"
      elsif url.start_with?("http")
        url
      else
        "https://suumo.jp/#{url}"
      end
    end
  end
end
