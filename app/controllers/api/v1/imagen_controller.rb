require 'net/http'
require 'json'
require 'base64'

class Api::V1::ImagenController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login

  # Gemini API設定
  GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'
  GEMINI_MODEL = 'gemini-2.5-flash-image'
  IMAGE_MIME_TYPE = 'image/jpeg'
  MAX_RETRIES = 3
  RETRY_DELAY = 2 # 秒

  # POST /api/v1/imagen/add_watermark
  # 画像にAIイメージウォーターマークを追加する
  def add_watermark
    unless params[:image].present?
      return render json: { error: '画像が必要です' }, status: :bad_request
    end

    begin
      # 画像をBase64エンコード
      image_base64 = encode_image(params[:image])

      # ウォーターマークを追加
      watermarked_image = AiImageWatermarkService.new(image_base64).add_watermark

      render json: {
        success: true,
        image: watermarked_image,
        message: 'ウォーターマークを追加しました'
      }
    rescue StandardError => e
      Rails.logger.error("Watermark error: #{e.message}")
      render json: {
        error: 'ウォーターマークの追加に失敗しました',
        details: e.message
      }, status: :internal_server_error
    end
  end

  # POST /api/v1/imagen/edit_image
  # Gemini 2.5 Flash Image Preview (Nano Banana)を使用して画像編集を行う
  def edit_image
    # パラメータ検証
    unless valid_params?
      return render json: { error: 'imageとpromptが必要です' }, status: :bad_request
    end

    begin
      # パラメータを取得
      edit_mode = params[:edit_mode] || 'full'
      coordinates = params[:coordinates] ? JSON.parse(params[:coordinates]) : nil
      reference_images = params[:reference_images] || []

      Rails.logger.info("Edit mode: #{edit_mode}")
      Rails.logger.info("Coordinates: #{coordinates.inspect}")
      Rails.logger.info("Reference images count: #{reference_images.length}")

      # 編集モードに応じてプロンプトを強化
      enhanced_prompt = if edit_mode == 'point' && coordinates.present?
        enhance_prompt_with_coordinates(params[:prompt], coordinates, reference_images.any?)
      else
        enhance_prompt(params[:prompt], reference_images.any?)
      end

      Rails.logger.info("Original prompt: #{params[:prompt]}")
      Rails.logger.info("Enhanced prompt: #{enhanced_prompt}")

      # リトライメカニズム付きでGemini APIを呼び出し
      response_data = call_gemini_api_with_retry(params[:image], enhanced_prompt, reference_images)

      # レスポンスから画像データを抽出
      generated_image = extract_generated_image(response_data)

      if generated_image
        # ウォーターマークを追加（add_watermarkパラメータがtrueの場合のみ）
        final_image = if params[:add_watermark] == 'true'
          AiImageWatermarkService.new(generated_image).add_watermark
        else
          generated_image
        end
        render_success(final_image)
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

  # プロンプトを強化（2025年のベストプラクティスに基づく）
  def enhance_prompt(user_prompt, has_reference_images = false)
    # ユーザーのプロンプトが既に詳細な場合はそのまま使用
    return user_prompt if user_prompt.length > 100

    # 参照画像がある場合の追加指示
    reference_instruction = if has_reference_images
      "\n- 追加で提供された参照画像の要素（オブジェクト、照明、スタイルなど）を編集に使用してください"
    else
      ""
    end

    # プロンプトを構造化して強化
    <<~PROMPT.strip
      提供された室内画像に対して、以下の編集を実行してください：

      【編集内容】
      #{user_prompt}

      【重要な指示】
      - 編集対象の要素を完全かつ自然に処理してください
      - 削除する場合は、削除後の空間を周囲の背景と調和するように自然に埋めてください
      - 元の画像の照明、色調、パースペクティブ（遠近感）を維持してください
      - 画像のアスペクト比を変更しないでください
      - 編集箇所と周辺部分の境界が自然に見えるようにしてください#{reference_instruction}

      編集後の画像は、プロフェッショナルな不動産写真として使用できる品質にしてください。
    PROMPT
  end

  # 座標指定モード用のプロンプト強化
  def enhance_prompt_with_coordinates(user_prompt, coordinates, has_reference_images = false)
    # 座標を日本語で説明
    coord_descriptions = coordinates.map.with_index do |coord, index|
      x_percent = (coord['x'] * 100).round
      y_percent = (coord['y'] * 100).round

      # 画像内の位置を大まかに表現
      horizontal_position = case x_percent
      when 0..25 then '左側'
      when 26..40 then '左寄り'
      when 41..60 then '中央'
      when 61..75 then '右寄り'
      else '右側'
      end

      vertical_position = case y_percent
      when 0..25 then '上部'
      when 26..40 then '上寄り'
      when 41..60 then '中央'
      when 61..75 then '下寄り'
      else '下部'
      end

      "座標#{index + 1}: 画像の#{vertical_position}#{horizontal_position}（X: #{x_percent}%, Y: #{y_percent}%）"
    end

    # 参照画像がある場合の追加指示
    reference_instruction = if has_reference_images
      "\n- 追加で提供された参照画像の要素（オブジェクト、照明、スタイルなど）を編集に使用してください"
    else
      ""
    end

    # プロンプトを構造化して強化
    <<~PROMPT.strip
      提供された室内画像に対して、指定された座標位置を中心に以下の編集を実行してください：

      【編集対象の座標位置】
      #{coord_descriptions.join("\n")}

      【編集内容】
      #{user_prompt}

      【重要な指示】
      - 指定された座標位置とその周辺領域を編集対象として処理してください
      - 編集対象の要素を完全かつ自然に処理してください
      - 削除する場合は、削除後の空間を周囲の背景と調和するように自然に埋めてください
      - 元の画像の照明、色調、パースペクティブ（遠近感）を維持してください
      - 画像のアスペクト比を変更しないでください
      - 編集箇所と周辺部分の境界が自然に見えるようにしてください#{reference_instruction}

      編集後の画像は、プロフェッショナルな不動産写真として使用できる品質にしてください。
    PROMPT
  end

  # リトライメカニズム付きでGemini APIを呼び出し
  def call_gemini_api_with_retry(image_file, prompt, reference_images = [])
    attempt = 0
    last_error = nil

    MAX_RETRIES.times do |i|
      attempt = i + 1
      begin
        Rails.logger.info("Gemini API attempt #{attempt}/#{MAX_RETRIES}")

        # 試行ごとに若干異なるプロンプトを使用（2回目以降）
        adjusted_prompt = if attempt > 1
          add_retry_variation(prompt, attempt)
        else
          prompt
        end

        response_data = call_gemini_api(image_file, adjusted_prompt, reference_images)

        # レスポンスが有効かチェック
        if response_data && response_data['candidates']&.any?
          Rails.logger.info("Gemini API succeeded on attempt #{attempt}")
          return response_data
        else
          Rails.logger.warn("Gemini API returned empty candidates on attempt #{attempt}")
          last_error = StandardError.new("Empty candidates in response")
        end

      rescue StandardError => e
        last_error = e
        Rails.logger.error("Gemini API attempt #{attempt} failed: #{e.message}")

        # 最後の試行でない場合は待機してリトライ
        if attempt < MAX_RETRIES
          sleep_time = RETRY_DELAY * attempt # エクスポネンシャルバックオフ
          Rails.logger.info("Waiting #{sleep_time} seconds before retry...")
          sleep(sleep_time)
        end
      end
    end

    # すべての試行が失敗した場合
    Rails.logger.error("All #{MAX_RETRIES} attempts failed")
    raise last_error || StandardError.new("Failed to generate image after #{MAX_RETRIES} attempts")
  end

  # リトライ時にプロンプトに若干のバリエーションを追加
  def add_retry_variation(prompt, attempt)
    variations = [
      "#{prompt}\n\n【追加の指示】より慎重に編集を行い、自然な仕上がりを重視してください。",
      "#{prompt}\n\n【追加の指示】編集箇所の境界をより滑らかにし、違和感のない結果を目指してください。",
      "#{prompt}\n\n【追加の指示】元の画像の雰囲気を最大限保ちながら、指定された編集を丁寧に実行してください。"
    ]

    variation_index = (attempt - 2) % variations.length
    variations[variation_index]
  end

  # Gemini APIを呼び出して画像編集を実行
  def call_gemini_api(image_file, prompt, reference_images = [])
    # 画像をBase64エンコード
    image_base64 = encode_image(image_file)

    # 参照画像もBase64エンコード
    reference_images_base64 = reference_images.map { |ref_image| encode_image(ref_image) }

    # APIリクエストを構築
    uri = build_api_uri
    request_body = build_request_body(prompt, image_base64, reference_images_base64)

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
  def build_request_body(prompt, image_base64, reference_images_base64 = [])
    # partsを構築: テキストプロンプト → ベース画像 → 参照画像1, 2, 3...
    parts = [
      { text: prompt },
      {
        inline_data: {
          mime_type: IMAGE_MIME_TYPE,
          data: image_base64
        }
      }
    ]

    # 参照画像を追加
    reference_images_base64.each do |ref_image_base64|
      parts << {
        inline_data: {
          mime_type: IMAGE_MIME_TYPE,
          data: ref_image_base64
        }
      }
    end

    {
      contents: [{
        role: 'user',
        parts: parts
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
    # より詳細なエラー情報を提供
    error_message = extract_error_message(response_data)

    render json: {
      error: '画像の生成に失敗しました',
      details: error_message,
      suggestion: 'プロンプトをより具体的にするか、異なる表現で再試行してください。'
    }, status: :internal_server_error
  end

  # APIレスポンスからエラーメッセージを抽出
  def extract_error_message(response_data)
    return 'APIから有効な画像データが返されませんでした' unless response_data

    # Gemini APIのエラー構造を確認
    if response_data['error']
      return response_data['error']['message'] || response_data['error'].to_s
    end

    # candidatesがブロックされた可能性を確認
    if response_data['candidates']&.any?
      candidate = response_data['candidates'].first
      if candidate['finishReason'] == 'SAFETY'
        return '安全性フィルターにより画像生成がブロックされました。別の表現を試してください。'
      elsif candidate['finishReason'] == 'RECITATION'
        return '著作権保護により画像生成がブロックされました。'
      elsif candidate['finishReason']
        return "画像生成が中断されました: #{candidate['finishReason']}"
      end
    end

    '不明なエラーが発生しました'
  end

  # APIエラーをハンドリング
  def handle_api_error(error)
    Rails.logger.error("Gemini API error: #{error.message}")
    Rails.logger.error(error.backtrace.join("\n"))

    # ユーザーフレンドリーなエラーメッセージを生成
    user_message = case error.message
    when /timeout/i
      'APIへの接続がタイムアウトしました。しばらく待ってから再試行してください。'
    when /rate limit/i, /quota/i
      'API利用制限に達しました。しばらく待ってから再試行してください。'
    when /unauthorized/i, /authentication/i
      'API認証エラーが発生しました。管理者に連絡してください。'
    when /Empty candidates/i
      'AIが画像を生成できませんでした。プロンプトを変更して再試行してください。'
    else
      'AI画像編集中にエラーが発生しました。別のプロンプトで再試行してください。'
    end

    render json: {
      error: user_message,
      details: error.message,
      suggestion: 'プロンプトをより簡単な表現に変更するか、一度に1つの編集を行ってみてください。'
    }, status: :internal_server_error
  end
end
