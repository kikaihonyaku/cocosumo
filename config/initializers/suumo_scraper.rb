# frozen_string_literal: true

# SUUMO Scraper Configuration
Rails.application.config.suumo = ActiveSupport::OrderedOptions.new

Rails.application.config.suumo.tap do |config|
  config.base_url = "https://suumo.jp"
  config.user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  config.default_rate_limit = 2.0  # seconds between requests
  config.max_retries = 3
  config.timeout = 30

  # Building type mappings (SUUMO Japanese -> Model enum)
  config.building_type_map = {
    "マンション" => "mansion",
    "アパート" => "apartment",
    "一戸建て" => "house",
    "テラスハウス" => "house",
    "タウンハウス" => "house"
  }

  # Room type mappings (SUUMO Japanese -> Model enum)
  config.room_type_map = {
    "ワンルーム" => "studio",
    "1R" => "studio",
    "1K" => "one_bedroom",
    "1DK" => "one_dk",
    "1LDK" => "one_ldk",
    "1SLDK" => "one_ldk",
    "2K" => "two_bedroom",
    "2DK" => "two_dk",
    "2LDK" => "two_ldk",
    "2SLDK" => "two_ldk",
    "3K" => "three_bedroom",
    "3DK" => "three_dk",
    "3LDK" => "three_ldk",
    "3SLDK" => "three_ldk",
    "4K" => "other",
    "4DK" => "other",
    "4LDK" => "other"
  }

  # Structure mappings (SUUMO Japanese -> normalized)
  config.structure_map = {
    "鉄筋コン" => "RC",
    "鉄骨鉄筋コン" => "SRC",
    "鉄骨造" => "S",
    "軽量鉄骨" => "LGS",
    "木造" => "W",
    "ブロック" => "CB",
    "その他" => "other"
  }

  # Photo type mappings
  config.building_photo_types = {
    "exterior" => "exterior",
    "entrance" => "entrance",
    "common" => "common_area",
    "parking" => "parking",
    "surroundings" => "surroundings"
  }

  config.room_photo_types = {
    "interior" => "interior",
    "living" => "living",
    "kitchen" => "kitchen",
    "bathroom" => "bathroom",
    "floor_plan" => "floor_plan",
    "other" => "other"
  }
end
