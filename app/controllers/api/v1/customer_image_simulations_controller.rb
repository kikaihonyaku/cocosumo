require 'net/http'
require 'json'
require 'base64'

class Api::V1::CustomerImageSimulationsController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :set_customer_access
  before_action :check_access_permission

  # Gemini API設定（ImagenControllerと同様）
  GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'
  GEMINI_MODEL = 'gemini-2.5-flash-image'
  IMAGE_MIME_TYPE = 'image/jpeg'
  MAX_RETRIES = 3
  RETRY_DELAY = 2
  # 画像の最大サイズ（PhotoEditorと同様の表示サイズに合わせる）
  MAX_IMAGE_WIDTH = 1280
  MAX_IMAGE_HEIGHT = 960

  # GET /api/v1/customer/:access_token/image_simulations/quota
  # 残り回数を取得
  def quota
    session_id = generate_session_id
    remaining = CustomerImageSimulation.remaining_quota(@property_publication.id, session_id)

    render json: {
      remaining: remaining,
      daily_limit: CustomerImageSimulation::DAILY_LIMIT,
      used_today: CustomerImageSimulation::DAILY_LIMIT - remaining
    }
  end

  # GET /api/v1/customer/:access_token/image_simulations
  # 履歴取得（当日のみ）
  def index
    session_id = generate_session_id

    simulations = CustomerImageSimulation
                    .for_publication(@property_publication.id)
                    .for_session(session_id)
                    .today
                    .recent
                    .limit(20)

    render json: {
      simulations: simulations.as_json(
        only: [:id, :source_photo_type, :source_photo_id, :prompt, :status, :error_message, :created_at],
        methods: [:result_image_data_url]
      ),
      remaining: CustomerImageSimulation.remaining_quota(@property_publication.id, session_id)
    }
  end

  # POST /api/v1/customer/:access_token/image_simulations
  # シミュレーション実行
  def create
    session_id = generate_session_id

    # 日次制限チェック
    unless CustomerImageSimulation.within_limit?(@property_publication.id, session_id)
      return render json: {
        error: '本日の利用回数上限に達しました（1日10回まで）',
        remaining: 0
      }, status: :too_many_requests
    end

    # パラメータ検証
    unless valid_params?
      return render json: { error: '画像とプロンプトが必要です' }, status: :bad_request
    end

    # シミュレーションレコードを作成
    simulation = CustomerImageSimulation.new(
      property_publication: @property_publication,
      session_id: session_id,
      source_photo_type: params[:source_photo_type],
      source_photo_id: params[:source_photo_id],
      prompt: params[:prompt],
      simulation_date: Date.current,
      ip_address: request.remote_ip,
      status: :pending
    )

    unless simulation.save
      return render json: { errors: simulation.errors.full_messages }, status: :unprocessable_entity
    end

    begin
      # Active Storageから画像を取得してBase64エンコード
      image_base64 = fetch_and_encode_source_image

      unless image_base64
        simulation.update!(status: :failed, error_message: '画像の取得に失敗しました')
        return render json: { error: '画像の取得に失敗しました' }, status: :unprocessable_entity
      end

      # 顧客向けプロンプトを構築
      enhanced_prompt = build_customer_prompt(params[:prompt])

      # Gemini APIを呼び出し
      response_data = call_gemini_api_with_retry(image_base64, enhanced_prompt)
      generated_image = extract_generated_image(response_data)

      if generated_image
        simulation.update!(
          status: :success,
          result_image_base64: generated_image
        )

        render json: {
          success: true,
          simulation: simulation.as_json(
            only: [:id, :source_photo_type, :source_photo_id, :prompt, :status, :created_at],
            methods: [:result_image_data_url]
          ),
          remaining: CustomerImageSimulation.remaining_quota(@property_publication.id, session_id)
        }
      else
        error_msg = extract_error_message(response_data)
        simulation.update!(status: :failed, error_message: error_msg)

        render json: {
          error: '画像の生成に失敗しました',
          details: error_msg,
          remaining: CustomerImageSimulation.remaining_quota(@property_publication.id, session_id)
        }, status: :internal_server_error
      end

    rescue StandardError => e
      Rails.logger.error("CustomerImageSimulation error: #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))

      simulation.update!(status: :failed, error_message: e.message)

      render json: {
        error: 'シミュレーション実行中にエラーが発生しました',
        details: e.message,
        remaining: CustomerImageSimulation.remaining_quota(@property_publication.id, session_id)
      }, status: :internal_server_error
    end
  end

  private

  def set_customer_access
    @customer_access = CustomerAccess.find_by(access_token: params[:access_token])

    unless @customer_access
      render json: { error: 'アクセストークンが無効です' }, status: :not_found
      return
    end

    @property_publication = @customer_access.property_publication
  end

  def check_access_permission
    unless @customer_access.accessible?
      if @customer_access.revoked?
        render json: { error: 'このアクセス権は取り消されています' }, status: :forbidden
      elsif @customer_access.expired?
        render json: { error: 'このアクセス権の有効期限が切れています' }, status: :gone
      else
        render json: { error: 'アクセス権がありません' }, status: :forbidden
      end
    end
  end

  # セッションIDを生成（IPアドレス + access_token のハッシュ）
  def generate_session_id
    raw = "#{request.remote_ip}-#{params[:access_token]}"
    Digest::SHA256.hexdigest(raw)[0..31]
  end

  def valid_params?
    params[:source_photo_type].present? &&
      params[:source_photo_id].present? &&
      params[:prompt].present?
  end

  # 元画像を取得してリサイズ後にBase64エンコード
  def fetch_and_encode_source_image
    photo_record = case params[:source_photo_type]
    when 'room_photo'
      RoomPhoto.find_by(id: params[:source_photo_id])
    when 'building_photo'
      BuildingPhoto.find_by(id: params[:source_photo_id])
    else
      nil
    end

    return nil unless photo_record&.photo&.attached?

    # Active Storageから直接バイナリデータを取得
    image_data = photo_record.photo.download

    # MIMEタイプを検出
    @detected_mime_type = detect_mime_type(image_data)
    Rails.logger.info("CustomerImageSimulation - Detected MIME type: #{@detected_mime_type}")

    # MiniMagickを使用して画像をリサイズ（PhotoEditorと同様のサイズに）
    resized_image_data = resize_image(image_data)

    Base64.strict_encode64(resized_image_data)
  rescue StandardError => e
    Rails.logger.error("Failed to fetch image: #{e.message}")
    nil
  end

  # 画像データからMIMEタイプを検出
  def detect_mime_type(image_data)
    # マジックバイトで判定
    case image_data[0, 8].bytes
    when ->(b) { b[0..2] == [0xFF, 0xD8, 0xFF] }
      'image/jpeg'
    when ->(b) { b[0..7] == [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }
      'image/png'
    when ->(b) { b[0..3] == [0x47, 0x49, 0x46, 0x38] }
      'image/gif'
    when ->(b) { b[0..3] == [0x52, 0x49, 0x46, 0x46] && image_data[8, 4] == 'WEBP' }
      'image/webp'
    else
      'image/jpeg' # デフォルト
    end
  end

  # 画像をリサイズ（アスペクト比を維持、元のフォーマットを可能な限り維持）
  def resize_image(image_data)
    image = MiniMagick::Image.read(image_data)

    original_width = image.width
    original_height = image.height
    original_format = image.type.downcase

    Rails.logger.info("CustomerImageSimulation - Original image: #{original_width}x#{original_height}, format: #{original_format}")

    # リサイズが必要かチェック
    if original_width <= MAX_IMAGE_WIDTH && original_height <= MAX_IMAGE_HEIGHT
      Rails.logger.info("CustomerImageSimulation - Image size is within limits, no resize needed")
      return image_data
    end

    # アスペクト比を維持してリサイズ
    width_ratio = MAX_IMAGE_WIDTH.to_f / original_width
    height_ratio = MAX_IMAGE_HEIGHT.to_f / original_height
    scale_ratio = [width_ratio, height_ratio].min

    new_width = (original_width * scale_ratio).to_i
    new_height = (original_height * scale_ratio).to_i

    Rails.logger.info("CustomerImageSimulation - Resizing image to: #{new_width}x#{new_height}")

    # リサイズのみ行い、フォーマット変換は最小限に
    image.resize "#{new_width}x#{new_height}"

    # JPEGの場合は高品質を維持
    if original_format == 'jpeg' || original_format == 'jpg'
      image.quality 95
    end

    image.to_blob
  rescue StandardError => e
    Rails.logger.error("Failed to resize image: #{e.message}, using original")
    image_data
  end

  # 元画像のURLを取得（フロントエンド表示用）
  def fetch_source_image_url
    case params[:source_photo_type]
    when 'room_photo'
      room_photo = RoomPhoto.find_by(id: params[:source_photo_id])
      room_photo&.photo_url
    when 'building_photo'
      building_photo = BuildingPhoto.find_by(id: params[:source_photo_id])
      building_photo&.photo_url
    else
      nil
    end
  end

  # 顧客向けの安全なプロンプトを構築（英語ベースで画像編集に最適化）
  def build_customer_prompt(user_prompt)
    # 日本語のユーザープロンプトを英語の編集指示に変換
    translated_instruction = translate_prompt_to_english(user_prompt)

    <<~PROMPT.strip
      Edit this image with the following modification:

      #{translated_instruction}

      CRITICAL REQUIREMENTS:
      - Keep the original image composition, perspective, and camera angle exactly the same
      - Preserve all unchanged areas pixel-perfectly
      - Only modify the specific elements mentioned above
      - Maintain the original lighting, color temperature, and atmosphere
      - Ensure seamless blending between edited and unedited areas
      - Do NOT change the aspect ratio or overall structure of the image

      Output a high-quality real estate photograph.
    PROMPT
  end

  # 日本語プロンプトを英語の編集指示に変換
  def translate_prompt_to_english(japanese_prompt)
    # プリセットプロンプトの対応表
    translations = {
      # 夜の外観
      '空を夕暮れから夜の色に変更し、建物の窓から室内の照明が漏れている様子を追加してください。建物自体の形状や色は変更せず、空と照明のみを編集してください。' =>
        'Change the sky to evening/night colors and add warm interior lighting visible through the windows. Keep the building structure and colors unchanged - only edit the sky and window lighting.',

      # 春の風景
      '写真に写っている樹木や植栽を桜や春の花に変更してください。建物や構造物は一切変更せず、植物部分のみを編集してください。' =>
        'Replace the existing trees and plants with cherry blossoms or spring flowers. Do not modify any buildings or structures - only edit the vegetation.',

      # カーテン（白）
      '窓に白いレースカーテンを追加してください。窓枠や壁、その他の要素は変更せず、カーテンのみを自然に追加してください。' =>
        'Add white lace curtains to the windows. Do not modify the window frames, walls, or any other elements - only add the curtains naturally.',

      # モダン家具
      '空いている床のスペースに、シンプルなソファとローテーブルを配置してください。壁、床、窓などの既存の要素は変更せず、家具のみを追加してください。' =>
        'Place a simple modern sofa and low table in the empty floor space. Do not modify walls, floors, windows, or any existing elements - only add the furniture.',

      # ナチュラル家具
      '空いている床のスペースに、木製のダイニングテーブルと椅子を配置してください。壁、床、窓などの既存の要素は変更せず、家具のみを追加してください。' =>
        'Place a wooden dining table and chairs in the empty floor space. Do not modify walls, floors, windows, or any existing elements - only add the furniture.',

      # 空室クリーン
      '床や壁の汚れを除去し、清掃後の清潔な状態にしてください。部屋の構造や間取りは変更せず、表面の汚れのみを除去してください。' =>
        'Remove dirt and stains from floors and walls to show a clean, freshly cleaned condition. Do not change the room structure or layout - only remove surface dirt and stains.'
    }

    # プリセットに一致すれば翻訳を使用、なければ汎用的な英語ラッパーを使用
    translations[japanese_prompt] || "#{japanese_prompt} (Keep all other parts of the image unchanged)"
  end

  # リトライ時にプロンプトに若干のバリエーションを追加
  def add_retry_variation(prompt, attempt)
    variations = [
      "#{prompt}\n\nIMPORTANT: Be very careful to preserve the original image. Make minimal changes.",
      "#{prompt}\n\nIMPORTANT: Focus on seamless blending. The edit should be undetectable.",
      "#{prompt}\n\nIMPORTANT: Maintain maximum fidelity to the original image while making the requested edit."
    ]

    variation_index = (attempt - 2) % variations.length
    variations[variation_index]
  end

  # リトライメカニズム付きでGemini APIを呼び出し
  def call_gemini_api_with_retry(image_base64, prompt)
    attempt = 0
    last_error = nil

    MAX_RETRIES.times do |i|
      attempt = i + 1
      begin
        Rails.logger.info("CustomerImageSimulation - Gemini API attempt #{attempt}/#{MAX_RETRIES}")

        # 試行ごとに若干異なるプロンプトを使用（2回目以降）
        adjusted_prompt = if attempt > 1
          add_retry_variation(prompt, attempt)
        else
          prompt
        end

        response_data = call_gemini_api(image_base64, adjusted_prompt)

        if response_data && response_data['candidates']&.any?
          Rails.logger.info("CustomerImageSimulation - Gemini API succeeded on attempt #{attempt}")
          return response_data
        else
          Rails.logger.warn("CustomerImageSimulation - Gemini API returned empty candidates on attempt #{attempt}")
          last_error = StandardError.new("Empty candidates in response")
        end

      rescue StandardError => e
        last_error = e
        Rails.logger.error("CustomerImageSimulation - Gemini API attempt #{attempt} failed: #{e.message}")

        if attempt < MAX_RETRIES
          sleep_time = RETRY_DELAY * attempt
          Rails.logger.info("CustomerImageSimulation - Waiting #{sleep_time} seconds before retry...")
          sleep(sleep_time)
        end
      end
    end

    raise last_error || StandardError.new("Failed to generate image after #{MAX_RETRIES} attempts")
  end

  # Gemini APIを呼び出して画像編集を実行
  def call_gemini_api(image_base64, prompt)
    api_key = ENV['GEMINI_API_KEY']
    uri = URI("#{GEMINI_API_ENDPOINT}/#{GEMINI_MODEL}:generateContent?key=#{api_key}")

    # 検出したMIMEタイプを使用（デフォルトはJPEG）
    mime_type = @detected_mime_type || IMAGE_MIME_TYPE

    # デバッグログ: 画像サイズを確認
    Rails.logger.info("CustomerImageSimulation - Image base64 length: #{image_base64&.length}")
    Rails.logger.info("CustomerImageSimulation - Using MIME type: #{mime_type}")
    Rails.logger.info("CustomerImageSimulation - Prompt: #{prompt[0..300]}...")

    request_body = {
      contents: [{
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
      }],
      generation_config: {
        response_modalities: ['image']
      }
    }

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    request = Net::HTTP::Post.new(uri.request_uri)
    request['Content-Type'] = 'application/json'
    request.body = request_body.to_json

    response = http.request(request)
    response_data = JSON.parse(response.body)

    unless response.code == '200'
      raise StandardError, "Gemini API returned status #{response.code}: #{response_data['error']&.dig('message')}"
    end

    response_data
  end

  # レスポンスから生成された画像を抽出
  def extract_generated_image(response_data)
    return nil unless response_data['candidates']&.any?

    candidate = response_data['candidates'].first
    return nil unless candidate['content']&.[]('parts')

    image_part = candidate['content']['parts'].find { |part| part['inlineData'] }
    image_part&.dig('inlineData', 'data')
  end

  # APIレスポンスからエラーメッセージを抽出
  def extract_error_message(response_data)
    return 'APIから有効な画像データが返されませんでした' unless response_data

    if response_data['error']
      return response_data['error']['message'] || response_data['error'].to_s
    end

    if response_data['candidates']&.any?
      candidate = response_data['candidates'].first
      case candidate['finishReason']
      when 'SAFETY'
        return '安全性フィルターにより画像生成がブロックされました。別の表現を試してください。'
      when 'RECITATION'
        return '著作権保護により画像生成がブロックされました。'
      when nil
        # finishReasonがnilの場合はOK
      else
        return "画像生成が中断されました: #{candidate['finishReason']}"
      end
    end

    '不明なエラーが発生しました'
  end
end
