require 'net/http'
require 'json'
require 'base64'

class Api::V1::ImagenController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login

  # Gemini API設定
  GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'
  GEMINI_MODEL = 'gemini-2.5-flash-image-preview'
  IMAGE_MIME_TYPE = 'image/jpeg'

  # POST /api/v1/imagen/edit_image
  # Gemini 2.5 Flash Image Preview (Nano Banana)を使用して画像編集を行う
  def edit_image
    # パラメータ検証
    unless valid_params?
      return render json: { error: 'imageとpromptが必要です' }, status: :bad_request
    end

    begin
      # Gemini APIに画像編集をリクエスト
      response_data = call_gemini_api(params[:image], params[:prompt])

      # レスポンスから画像データを抽出
      generated_image = extract_generated_image(response_data)

      if generated_image
        render_success(generated_image)
      else
        render_generation_error(response_data)
      end

    rescue StandardError => e
      handle_api_error(e)
    end
  end

  private

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end

  # パラメータの妥当性を検証
  def valid_params?
    params[:image].present? && params[:prompt].present?
  end

  # Gemini APIを呼び出して画像編集を実行
  def call_gemini_api(image_file, prompt)
    # 画像をBase64エンコード
    image_base64 = encode_image(image_file)

    # APIリクエストを構築
    uri = build_api_uri
    request_body = build_request_body(prompt, image_base64)

    Rails.logger.info("Gemini API Request: #{request_body.to_json}")

    # HTTPリクエスト送信
    response = send_http_request(uri, request_body)
    response_data = JSON.parse(response.body)

    Rails.logger.info("Gemini API Response: #{response_data.to_json}")

    # APIエラーをチェック
    unless response.code == '200'
      raise StandardError, "Gemini API returned status #{response.code}"
    end

    response_data
  end

  # 画像ファイルをBase64エンコード
  def encode_image(image_file)
    image_data = image_file.read
    Base64.strict_encode64(image_data)
  end

  # Gemini APIのURIを構築
  def build_api_uri
    api_key = ENV['GEMINI_API_KEY']
    URI("#{GEMINI_API_ENDPOINT}/#{GEMINI_MODEL}:generateContent?key=#{api_key}")
  end

  # APIリクエストボディを構築
  def build_request_body(prompt, image_base64)
    {
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: IMAGE_MIME_TYPE,
              data: image_base64
            }
          }
        ]
      }],
      generation_config: {
        response_modalities: ['image']
      }
    }
  end

  # HTTPリクエストを送信
  def send_http_request(uri, request_body)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    request = Net::HTTP::Post.new(uri.request_uri)
    request['Content-Type'] = 'application/json'
    request.body = request_body.to_json

    http.request(request)
  end

  # レスポンスから生成された画像を抽出
  def extract_generated_image(response_data)
    # candidatesが存在するかチェック
    return nil unless response_data['candidates']&.any?

    candidate = response_data['candidates'].first

    # contentとpartsが存在するかチェック
    return nil unless candidate['content']&.[]('parts')

    # 画像データを含むpartを検索
    image_part = candidate['content']['parts'].find { |part| part['inlineData'] }

    # 画像データを取得
    image_part&.dig('inlineData', 'data')
  end

  # 成功レスポンスを返す
  def render_success(image_base64)
    render json: {
      success: true,
      image: image_base64,
      message: 'Gemini 2.5 Flash (Nano Banana)で画像を編集しました'
    }
  end

  # 画像生成失敗のレスポンスを返す
  def render_generation_error(response_data)
    render json: {
      error: '画像の生成に失敗しました',
      response: response_data
    }, status: :internal_server_error
  end

  # APIエラーをハンドリング
  def handle_api_error(error)
    Rails.logger.error("Gemini API error: #{error.message}")
    Rails.logger.error(error.backtrace.join("\n"))

    render json: {
      error: 'Gemini APIの呼び出しに失敗しました',
      details: error.message
    }, status: :internal_server_error
  end
end
