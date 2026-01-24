# frozen_string_literal: true

# 募集図面PDF解析サービス
# Gemini AIを使用してPDFから建物・部屋情報を抽出
class FloorplanAnalyzerService
  class AnalysisError < StandardError; end

  # @param pdf_data [String] PDFのバイナリデータ
  def initialize(pdf_data)
    @pdf_data = pdf_data
    @pdf_base64 = Base64.strict_encode64(pdf_data)
  end

  # Active Storageのblobから初期化するファクトリメソッド
  # @param blob [ActiveStorage::Blob] PDFのblob
  # @return [FloorplanAnalyzerService]
  def self.from_blob(blob)
    new(blob.download)
  end

  # PDFを解析して建物・部屋情報を抽出
  # @return [Hash] { building: {}, room: {} }
  def analyze
    result = client.generate_content({
      contents: {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: 'application/pdf',
              data: @pdf_base64
            }
          }
        ]
      }
    })

    response_text = result.dig('candidates', 0, 'content', 'parts', 0, 'text') || ''
    extracted_data = parse_response(response_text)
    normalize_data(extracted_data)
  rescue JSON::ParserError => e
    raise AnalysisError, "解析結果のパースに失敗しました: #{e.message}"
  rescue StandardError => e
    Rails.logger.error("FloorplanAnalyzerService error: #{e.message}")
    Rails.logger.error(e.backtrace.first(5).join("\n"))
    raise AnalysisError, "募集図面の解析に失敗しました: #{e.message}"
  end

  private

  def client
    @client ||= Gemini.new(
      credentials: {
        service: 'generative-language-api',
        api_key: ENV['GEMINI_API_KEY'],
        version: 'v1beta'
      },
      options: { model: 'gemini-2.5-flash' }
    )
  end

  def prompt
    <<~PROMPT
      あなたは不動産の募集図面（チラシ）を解析する専門家です。
      このPDFは賃貸物件の募集図面です。以下の情報を抽出してJSON形式で出力してください。

      ## 建物情報（building）
      - name: 建物名（マンション名・アパート名など）
      - address: 所在地（住所）
      - building_type: 建物種別（以下のいずれか: mansion, apartment, house, office）
        - mansion: マンション、RC造、SRC造の集合住宅
        - apartment: アパート、木造・軽量鉄骨造の集合住宅
        - house: 一戸建て、テラスハウス
        - office: オフィス、店舗
      - structure: 構造（例: RC造, SRC造, 木造, 鉄骨造, 軽量鉄骨造）
      - floors: 建物の総階数（数値のみ）
      - built_date: 築年月（YYYY-MM-DD形式、年のみの場合はYYYY-01-01、不明な場合はnull）
      - total_units: 総戸数（数値のみ、不明な場合はnull）

      ## 部屋情報（room）
      - room_number: 部屋番号（例: 101, 201, A-101）
      - room_type: 間取り（studio, 1K, 1DK, 1LDK, 2K, 2DK, 2LDK, 3K, 3DK, 3LDK, other）
      - area: 専有面積（数値のみ、㎡）
      - rent: 賃料（数値のみ、円）
      - management_fee: 管理費・共益費（数値のみ、円。なしは0）
      - deposit: 敷金（数値のみ、円。月数指定の場合はnull）
      - deposit_months: 敷金（月数）
      - key_money: 礼金（数値のみ、円。月数指定の場合はnull）
      - key_money_months: 礼金（月数）
      - direction: 向き（南, 南東, 東, 北東, 北, 北西, 西, 南西）
      - floor: 階数（数値のみ）
      - facilities: 設備（カンマ区切り）
      - parking_fee: 駐車場料金（数値のみ、円。なし/込みは0、駐車場なしはnull）
      - available_date: 入居可能日（YYYY-MM-DD形式、「即入居可」は"immediate"）
      - pets_allowed: ペット可否（true/false）
      - guarantor_required: 保証人要否（true/false）
      - two_person_allowed: 二人入居可否（true/false）
      - description: 物件のアピールポイント（100文字程度）

      注意事項:
      - 情報が見つからない項目はnullを設定
      - 数値は必ず数値型で出力
      - JSONのみを出力し、他の説明は含めない
      - 必ず有効なJSON形式で出力

      出力例:
      {
        "building": {
          "name": "サンシャインハイツ渋谷",
          "address": "東京都渋谷区道玄坂1-2-3",
          "building_type": "mansion",
          "structure": "RC造",
          "floors": 10,
          "built_date": "2015-03-01",
          "total_units": 45
        },
        "room": {
          "room_number": "301",
          "room_type": "1LDK",
          "area": 45.5,
          "rent": 120000,
          "management_fee": 8000,
          "deposit": null,
          "deposit_months": 1,
          "key_money": null,
          "key_money_months": 1,
          "direction": "南",
          "floor": 3,
          "facilities": "エアコン,バス・トイレ別,室内洗濯機置場,オートロック",
          "parking_fee": 0,
          "available_date": "immediate",
          "pets_allowed": false,
          "guarantor_required": true,
          "two_person_allowed": true,
          "description": "南向きで日当たり良好。駅徒歩5分の好立地。"
        }
      }
    PROMPT
  end

  def parse_response(response_text)
    json_text = response_text.gsub(/```json\s*/, '').gsub(/```\s*/, '').strip
    JSON.parse(json_text)
  end

  def normalize_data(data)
    normalize_building_type(data)
    normalize_room_type(data)
    calculate_deposit_key_money(data)
    normalize_available_date(data)
    normalize_facilities(data)
    data
  end

  def normalize_building_type(data)
    return unless data['building']&.dig('building_type')

    mapping = {
      'マンション' => 'mansion',
      'アパート' => 'apartment',
      '一戸建て' => 'house',
      'オフィス' => 'office',
      '店舗' => 'office'
    }
    original = data['building']['building_type']
    data['building']['building_type'] = mapping[original] || original
  end

  def normalize_room_type(data)
    return unless data['room']&.dig('room_type')

    mapping = {
      'ワンルーム' => 'studio',
      'studio' => 'studio',
      '1K' => '1K', '1DK' => '1DK', '1LDK' => '1LDK',
      '2K' => '2K', '2DK' => '2DK', '2LDK' => '2LDK',
      '3K' => '3K', '3DK' => '3DK', '3LDK' => '3LDK',
      'その他' => 'other', 'other' => 'other'
    }
    original = data['room']['room_type']
    data['room']['room_type'] = mapping[original] || original
  end

  def calculate_deposit_key_money(data)
    room = data['room']
    return unless room && room['rent']

    if room['deposit_months'] && room['deposit'].nil?
      room['deposit'] = room['rent'] * room['deposit_months']
    end
    if room['key_money_months'] && room['key_money'].nil?
      room['key_money'] = room['rent'] * room['key_money_months']
    end
  end

  def normalize_available_date(data)
    room = data['room']
    return unless room && room['available_date'] == 'immediate'

    room['available_date'] = Date.today.to_s
    room['available_date_note'] = '即入居可'
  end

  def normalize_facilities(data)
    room = data['room']
    return unless room && room['facilities'].present?

    normalizer = FacilityNormalizer.new
    facility_result = normalizer.normalize(room['facilities'])
    room['facility_codes'] = facility_result[:matched].map { |m| m[:facility].code }
    room['normalized_facilities'] = facility_result[:matched].map { |m| m[:facility].name }
    room['unmatched_facilities'] = facility_result[:unmatched]
  end
end
