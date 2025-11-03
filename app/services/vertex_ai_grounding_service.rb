# frozen_string_literal: true

require 'net/http'
require 'json'
require 'googleauth'

# Vertex AI Grounding with Google Maps サービス
# Google Maps のデータを活用して、周辺情報を取得するAIサービス
class VertexAiGroundingService
  class GroundingError < StandardError; end

  def initialize
    @project_id = ENV['GOOGLE_CLOUD_PROJECT_ID']
    @location = ENV['GOOGLE_CLOUD_REGION'] || 'us-central1'
    @model = 'gemini-2.0-flash-exp'

    validate_configuration!
  end

  # Grounding with Google Maps を使用して周辺情報を取得
  # @param query [String] ユーザーの質問
  # @param latitude [Float] 緯度
  # @param longitude [Float] 経度
  # @param conversation_history [Array] 会話履歴
  # @param address [String] 物件の住所（オプション）
  # @return [Hash] AIの応答と参照元情報
  def query_with_grounding(query:, latitude:, longitude:, conversation_history: [], address: nil)
    begin
      response = call_vertex_ai_api(query, latitude, longitude, conversation_history, address)
      parse_response(response)
    rescue StandardError => e
      Rails.logger.error("Vertex AI Grounding API error: #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))
      raise GroundingError, "Vertex AI APIの呼び出しに失敗しました: #{e.message}"
    end
  end

  private

  def validate_configuration!
    raise GroundingError, "GOOGLE_CLOUD_PROJECT_IDが設定されていません" if @project_id.blank?
    raise GroundingError, "GOOGLE_CLOUD_REGIONが設定されていません" if @location.blank?

    # 開発環境では認証ファイルの存在を確認
    if Rails.env.development?
      credentials_path = ENV['GOOGLE_APPLICATION_CREDENTIALS']
      if credentials_path.blank?
        raise GroundingError, "GOOGLE_APPLICATION_CREDENTIALSが設定されていません"
      end

      unless File.exist?(credentials_path)
        raise GroundingError, "認証ファイルが見つかりません: #{credentials_path}"
      end
    end
    # 本番環境ではCloud Runのデフォルト認証を使用（チェック不要）
  end

  def call_vertex_ai_api(query, latitude, longitude, conversation_history = [], address = nil)
    # エンドポイントURLの構築
    url = "https://#{@location}-aiplatform.googleapis.com/v1beta1/projects/#{@project_id}/locations/#{@location}/publishers/google/models/#{@model}:generateContent"

    # 会話履歴を含むcontentsを構築
    contents = []

    # システムプロンプト（会話の最初のみ）- 場所の文脈を設定
    if conversation_history.empty? && address.present?
      # 会話の最初にシステムメッセージとして場所の情報を追加
      system_context = "この会話では、#{address}（緯度: #{latitude}, 経度: #{longitude}）周辺の情報について質問されます。この場所を基準にして質問に回答してください。"

      contents << {
        role: "user",
        parts: [{ text: system_context }]
      }
      contents << {
        role: "model",
        parts: [{ text: "承知しました。#{address}周辺の情報についてお答えします。Google Mapsのデータを活用して、正確な情報を提供いたします。" }]
      }
    end

    # 会話履歴を追加
    conversation_history.each do |message|
      contents << {
        role: message['role'] == 'user' ? 'user' : 'model',
        parts: [
          { text: message['text'] }
        ]
      }
    end

    # 現在のクエリを追加（場所の情報を含める）
    enhanced_query = query
    if conversation_history.empty? && address.present?
      # 会話の最初の質問には場所を明示的に含める
      enhanced_query = "#{address}周辺について: #{query}"
    end

    contents << {
      role: "user",
      parts: [
        { text: enhanced_query }
      ]
    }

    # リクエストボディの構築
    request_body = {
      contents: contents,
      tools: [
        {
          googleMaps: {
            enableWidget: true
          }
        }
      ],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: latitude.to_f,
            longitude: longitude.to_f
          }
        }
      },
      generationConfig: {
        temperature: 0.3,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048
      }
    }

    # 認証トークンの取得
    access_token = get_access_token

    # HTTPリクエストの送信
    uri = URI(url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.read_timeout = 60

    request = Net::HTTP::Post.new(uri.path)
    request['Authorization'] = "Bearer #{access_token}"
    request['Content-Type'] = 'application/json'
    request.body = request_body.to_json

    response = http.request(request)

    unless response.code == '200'
      error_details = JSON.parse(response.body) rescue { 'error' => response.body }
      Rails.logger.error("Response body (error): #{response.body}")
      raise GroundingError, "API error: #{response.code} - #{error_details}"
    end

    JSON.parse(response.body)
  end

  def get_access_token
    # Google Cloud 認証スコープ
    scopes = ['https://www.googleapis.com/auth/cloud-platform']

    # 環境に応じた認証方法
    authorizer = if Rails.env.production? || ENV['GOOGLE_APPLICATION_CREDENTIALS'].blank?
      # 本番環境またはGOOGLE_APPLICATION_CREDENTIALSが未設定の場合はデフォルト認証
      Google::Auth.get_application_default(scopes)
    else
      # 開発環境ではサービスアカウントキーファイルから認証
      Google::Auth::ServiceAccountCredentials.make_creds(
        json_key_io: File.open(ENV['GOOGLE_APPLICATION_CREDENTIALS']),
        scope: scopes
      )
    end

    # アクセストークンを取得
    authorizer.fetch_access_token!['access_token']
  end

  def parse_response(response)
    # 応答テキストの取得
    answer_text = extract_answer_text(response)

    # Grounding情報の取得
    grounding_metadata = extract_grounding_metadata(response)

    # 参照元（ソース）の取得
    sources = extract_sources(grounding_metadata)

    # Google Maps Widget Context Tokenの取得
    widget_context_token = extract_widget_context_token(grounding_metadata)

    # Place IDsの取得（代替アプローチ）
    place_ids = extract_place_ids(grounding_metadata)

    {
      answer: answer_text,
      sources: sources,
      widget_context_token: widget_context_token,
      place_ids: place_ids,
      metadata: {
        grounding_support: grounding_metadata&.dig('groundingSupport'),
        retrieval_queries: grounding_metadata&.dig('retrievalQueries')
      }
    }
  end

  def extract_answer_text(response)
    candidates = response['candidates']
    return "" unless candidates&.any?

    candidate = candidates.first
    content = candidate['content']
    return "" unless content && content['parts']

    parts = content['parts']
    parts.map { |part| part['text'] }.compact.join("\n")
  end

  def extract_grounding_metadata(response)
    candidates = response['candidates']
    return {} unless candidates&.any?

    candidate = candidates.first
    return {} unless candidate['groundingMetadata']

    candidate['groundingMetadata']
  end

  def extract_sources(grounding_metadata)
    return [] unless grounding_metadata && grounding_metadata['groundingChunks']

    sources = []
    grounding_metadata['groundingChunks'].each do |chunk|
      next unless chunk['web']

      sources << {
        name: chunk.dig('web', 'title') || "Google Maps",
        url: chunk.dig('web', 'uri') || "https://maps.google.com/",
        snippet: chunk.dig('web', 'snippet')
      }
    end

    # Google Placesの情報も抽出
    if grounding_metadata['groundingSupports']
      grounding_metadata['groundingSupports'].each do |support|
        if support['groundingChunkIndices'] && support['segment']
          # 場所情報を追加
        end
      end
    end

    sources.uniq { |s| s[:url] }
  end

  def extract_widget_context_token(grounding_metadata)
    return nil unless grounding_metadata

    # googleMapsWidgetContextToken を取得
    grounding_metadata['googleMapsWidgetContextToken']
  end

  def extract_place_ids(grounding_metadata)
    return [] unless grounding_metadata && grounding_metadata['groundingChunks']

    place_ids = []
    grounding_metadata['groundingChunks'].each do |chunk|
      if chunk['maps'] && chunk['maps']['placeId']
        place_id = chunk['maps']['placeId']
        title = chunk['maps']['title']

        place_ids << {
          place_id: place_id,
          title: title,
          uri: chunk['maps']['uri']
        }
      end
    end

    place_ids
  end
end
