class Api::V1::GeminiController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login

  # POST /api/v1/gemini/process_image
  # Gemini APIを使用して画像処理を行う
  def process_image
    unless params[:image].present? && params[:prompt].present?
      return render json: { error: 'imageとpromptが必要です' }, status: :bad_request
    end

    begin
      # 画像データを取得
      image_data = params[:image].read
      image_base64 = Base64.strict_encode64(image_data)

      # プロンプトを構築
      prompt = params[:prompt]

      # Gemini APIクライアントを初期化
      client = Gemini.new(
        credentials: {
          service: 'generative-language-api',
          api_key: ENV['GEMINI_API_KEY'],
          version: 'v1beta'
        },
        options: { model: 'gemini-2.5-flash' }
      )

      # Gemini APIにリクエスト送信
      result = client.generate_content({
        contents: {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: image_base64
              }
            }
          ]
        }
      })

      # デバッグ用：レスポンス全体をログに出力
      Rails.logger.info("Gemini API Response: #{result.inspect}")

      # レスポンスからテキストを取得
      response_text = result.dig('candidates', 0, 'content', 'parts', 0, 'text') || ''

      render json: {
        success: true,
        response: response_text,
        message: 'Gemini APIからのレスポンスを取得しました',
        debug_result: result # デバッグ用
      }

    rescue StandardError => e
      Rails.logger.error("Gemini API error: #{e.message}")
      render json: {
        error: 'Gemini APIの呼び出しに失敗しました',
        details: e.message
      }, status: :internal_server_error
    end
  end

  private

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end
end
