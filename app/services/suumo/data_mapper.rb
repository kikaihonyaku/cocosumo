# frozen_string_literal: true

module Suumo
  class DataMapper
    def initialize
      @config = Rails.application.config.suumo
    end

    # Map SUUMO property data to Building model attributes
    def map_building(property_data)
      {
        name: property_data[:building_name],
        address: property_data[:address],
        building_type: map_building_type(property_data[:building_type]),
        structure: map_structure(property_data[:structure]),
        floors: property_data[:floors],
        built_date: property_data[:built_date],
        total_units: property_data[:rooms]&.size || 0,
        description: build_building_description(property_data)
      }
    end

    # Map SUUMO room data to Room model attributes
    def map_room(room_data)
      {
        floor: room_data[:floor] || 1,
        room_type: map_room_type(room_data[:room_type]),
        area: room_data[:area],
        rent: room_data[:rent],
        management_fee: room_data[:management_fee],
        deposit: room_data[:deposit],
        key_money: room_data[:key_money],
        status: :vacant,
        description: build_room_description(room_data)
      }
    end

    private

    def map_building_type(suumo_type)
      return "apartment" if suumo_type.blank?

      mapped = @config.building_type_map[suumo_type]
      mapped || "apartment"
    end

    def map_room_type(suumo_type)
      return "other" if suumo_type.blank?

      # Normalize the room type string
      normalized = suumo_type.upcase.gsub(/\s/, "")

      mapped = @config.room_type_map[normalized]
      return mapped if mapped

      # Try partial matching
      @config.room_type_map.each do |key, value|
        return value if normalized.include?(key)
      end

      "other"
    end

    def map_structure(suumo_structure)
      return nil if suumo_structure.blank?

      @config.structure_map[suumo_structure] || suumo_structure
    end

    def build_building_description(property_data)
      parts = []

      if property_data[:access_info].present?
        parts << "アクセス: #{property_data[:access_info]}"
      end

      if property_data[:structure].present?
        parts << "構造: #{property_data[:structure]}"
      end

      parts.join("\n")
    end

    def build_room_description(room_data)
      parts = []

      if room_data[:detail_url].present?
        parts << "SUUMO詳細: #{room_data[:detail_url]}"
      end

      parts.join("\n")
    end
  end
end
