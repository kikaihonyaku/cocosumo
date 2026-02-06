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
        message: 'Gemini APIからのレスポンスを取得しました'
      }

    rescue StandardError => e
      Rails.logger.error("Gemini API error: #{e.message}")
      render json: {
        error: 'Gemini APIの呼び出しに失敗しました'
      }, status: :internal_server_error
    end
  end

  # POST /api/v1/gemini/generate_alt_text
  # 画像からSEO用ALTテキストを自動生成
  def generate_alt_text
    room_photo = RoomPhoto.find_by(id: params[:room_photo_id])
    unless room_photo
      return render json: { error: '画像が見つかりません' }, status: :not_found
    end

    begin
      # 画像データを取得
      if room_photo.photo.attached?
        image_data = room_photo.photo.download
        image_base64 = Base64.strict_encode64(image_data)
        mime_type = room_photo.photo.content_type
      else
        return render json: { error: '画像が添付されていません' }, status: :bad_request
      end

      # 不動産写真に特化したプロンプト
      prompt = <<~PROMPT
        あなたは不動産物件の写真を説明するSEO専門家です。
        この画像を見て、SEOに最適化されたalt属性テキストを日本語で生成してください。

        ルール:
        - 50〜100文字程度で簡潔に
        - 画像の内容を具体的に説明（部屋のタイプ、特徴、雰囲気など）
        - 「画像」「写真」「の様子」などの冗長な表現は避ける
        - 視覚障害者にも伝わる説明を心がける
        - 検索エンジンで見つかりやすいキーワードを含める

        例:
        - 「白を基調とした明るいリビングルーム、大きな窓から自然光が差し込む」
        - 「システムキッチン付きの対面式ダイニングキッチン、収納スペースも充実」
        - 「南向きバルコニーからの眺望、緑豊かな住環境」

        alt属性テキストのみを出力してください。
      PROMPT

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
                mime_type: mime_type,
                data: image_base64
              }
            }
          ]
        }
      })

      # レスポンスからテキストを取得
      alt_text = result.dig('candidates', 0, 'content', 'parts', 0, 'text')&.strip || ''

      # 生成したALTテキストを保存（任意）
      if params[:save] == 'true' || params[:save] == true
        room_photo.update!(alt_text: alt_text)
      end

      render json: {
        success: true,
        alt_text: alt_text,
        room_photo_id: room_photo.id,
        saved: params[:save] == 'true' || params[:save] == true
      }

    rescue StandardError => e
      Rails.logger.error("Gemini Alt Text generation error: #{e.message}")
      render json: {
        error: 'ALTテキストの生成に失敗しました'
      }, status: :internal_server_error
    end
  end

  # POST /api/v1/gemini/bulk_generate_alt_text
  # 複数画像のALTテキストを一括生成
  def bulk_generate_alt_text
    photo_ids = params[:room_photo_ids]
    unless photo_ids.is_a?(Array) && photo_ids.present?
      return render json: { error: 'room_photo_ids配列が必要です' }, status: :bad_request
    end

    results = []
    errors = []

    photo_ids.each do |photo_id|
      room_photo = RoomPhoto.find_by(id: photo_id)
      next unless room_photo
      next if room_photo.alt_text.present? && params[:skip_existing] != false

      begin
        if room_photo.photo.attached?
          image_data = room_photo.photo.download
          image_base64 = Base64.strict_encode64(image_data)
          mime_type = room_photo.photo.content_type

          prompt = "この不動産物件の画像を見て、SEOに最適化されたalt属性テキストを日本語で50〜100文字程度で生成してください。「画像」「写真」などの言葉は使わず、具体的に何が映っているかを説明してください。alt属性テキストのみを出力してください。"

          client = Gemini.new(
            credentials: {
              service: 'generative-language-api',
              api_key: ENV['GEMINI_API_KEY'],
              version: 'v1beta'
            },
            options: { model: 'gemini-2.5-flash' }
          )

          result = client.generate_content({
            contents: {
              role: 'user',
              parts: [
                { text: prompt },
                { inline_data: { mime_type: mime_type, data: image_base64 } }
              ]
            }
          })

          alt_text = result.dig('candidates', 0, 'content', 'parts', 0, 'text')&.strip || ''
          room_photo.update!(alt_text: alt_text)
          results << { room_photo_id: photo_id, alt_text: alt_text, success: true }
        end
      rescue StandardError => e
        errors << { room_photo_id: photo_id, error: e.message }
      end

      # API制限を考慮して少し待機
      sleep(0.5) if photo_ids.length > 1
    end

    render json: {
      success: true,
      processed: results.length,
      errors: errors,
      results: results
    }
  end

  private

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end
end
