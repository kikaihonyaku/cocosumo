class Api::V1::RoomsController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :set_room, only: [:show, :update, :destroy, :upload_floorplan, :delete_floorplan, :analyze_floorplan, :regenerate_floorplan_thumbnail]

  # GET /api/v1/rooms
  def index
    if params[:building_id]
      @rooms = current_tenant.buildings.find(params[:building_id]).rooms
    else
      @rooms = Room.joins(:building).where(buildings: { tenant_id: current_tenant.id })
    end

    @rooms = @rooms.order(created_at: :desc)
    render json: @rooms.as_json(include: :building, methods: [:status_label, :room_type_label])
  end

  # GET /api/v1/rooms/:id
  def show
    render json: room_with_attachments
  end

  # POST /api/v1/buildings/:building_id/rooms
  def create
    # ネストされたルートとスタンドアロンの両方に対応
    building_id = params[:building_id] || params[:room][:building_id]
    building = current_tenant.buildings.find(building_id)
    @room = building.rooms.build(room_params)

    if @room.save
      render json: @room.as_json(methods: [:status_label, :room_type_label]), status: :created
    else
      render json: { errors: @room.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/rooms/:id
  def update
    Room.transaction do
      if @room.update(room_params)
        # facility_codesが渡された場合、room_facilitiesを更新
        if params[:room][:facility_codes].present?
          update_room_facilities(params[:room][:facility_codes])
        end
        render json: room_with_attachments
      else
        render json: { errors: @room.errors.full_messages }, status: :unprocessable_entity
      end
    end
  end

  # DELETE /api/v1/rooms/:id
  def destroy
    @room.destroy
    head :no_content
  end

  # POST /api/v1/rooms/:id/upload_floorplan
  def upload_floorplan
    unless params[:file].present?
      return render json: { error: 'ファイルが指定されていません' }, status: :bad_request
    end

    # PDFファイルのみ許可
    unless params[:file].content_type == 'application/pdf'
      return render json: { error: 'PDFファイルのみアップロード可能です' }, status: :unprocessable_entity
    end

    @room.floorplan_pdf.attach(params[:file])

    if @room.floorplan_pdf.attached?
      # PDFの1ページ目からサムネイル画像を生成
      generate_floorplan_thumbnail

      floorplan_url = if Rails.env.production?
        @room.floorplan_pdf.url
      else
        Rails.application.routes.url_helpers.rails_blob_path(@room.floorplan_pdf, only_path: true)
      end

      thumbnail_url = nil
      if @room.floorplan_thumbnail.attached?
        thumbnail_url = if Rails.env.production?
          @room.floorplan_thumbnail.url
        else
          Rails.application.routes.url_helpers.rails_blob_path(@room.floorplan_thumbnail, only_path: true)
        end
      end

      render json: {
        success: true,
        message: '募集図面をアップロードしました',
        floorplan_pdf_url: floorplan_url,
        floorplan_pdf_filename: @room.floorplan_pdf.filename.to_s,
        floorplan_thumbnail_url: thumbnail_url
      }
    else
      render json: { error: 'アップロードに失敗しました' }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/rooms/:id/delete_floorplan
  def delete_floorplan
    if @room.floorplan_pdf.attached?
      @room.floorplan_pdf.purge
      @room.floorplan_thumbnail.purge if @room.floorplan_thumbnail.attached?
      render json: { success: true, message: '募集図面を削除しました' }
    else
      render json: { error: '募集図面が存在しません' }, status: :not_found
    end
  end

  # POST /api/v1/rooms/:id/analyze_floorplan
  # Gemini AIを使用して募集図面PDFから部屋情報を抽出
  def analyze_floorplan
    unless @room.floorplan_pdf.attached?
      return render json: { error: '募集図面がアップロードされていません' }, status: :bad_request
    end

    begin
      # PDFデータを取得してBase64エンコード
      pdf_data = @room.floorplan_pdf.download
      pdf_base64 = Base64.strict_encode64(pdf_data)

      # 部屋情報抽出用のプロンプト
      prompt = <<~PROMPT
        あなたは不動産の募集図面（チラシ）を解析する専門家です。
        このPDFは賃貸物件の募集図面です。以下の情報を抽出してJSON形式で出力してください。

        抽出する項目:
        - room_number: 部屋番号（例: 101, 201, A-101など。建物内での部屋を識別する番号・記号）
        - room_type: 間取り（以下のいずれか: studio, 1K, 1DK, 1LDK, 2K, 2DK, 2LDK, 3K, 3DK, 3LDK, other）
        - area: 専有面積（数値のみ、単位なし、㎡）
        - rent: 賃料（数値のみ、単位なし、円）
        - management_fee: 管理費・共益費（数値のみ、単位なし、円。なしの場合は0）
        - deposit: 敷金（数値のみ、単位なし、円。「1ヶ月」などの場合はnull）
        - deposit_months: 敷金（月数。「1ヶ月」の場合は1）
        - key_money: 礼金（数値のみ、単位なし、円。「1ヶ月」などの場合はnull）
        - key_money_months: 礼金（月数。「1ヶ月」の場合は1）
        - direction: 向き（例: 南, 南東, 東, 北東, 北, 北西, 西, 南西）
        - floor: 階数（数値のみ）
        - facilities: 設備（カンマ区切りの文字列。例: エアコン,バス・トイレ別,室内洗濯機置場,オートロック）
        - parking_fee: 駐車場料金（数値のみ、単位なし、円。なしや込みの場合は0、駐車場なしの場合はnull）
        - available_date: 入居可能日（YYYY-MM-DD形式。「即入居可」の場合は"immediate"）
        - pets_allowed: ペット可否（true/false）
        - guarantor_required: 保証人要否（true/false）
        - two_person_allowed: 二人入居可否（true/false）
        - description: 物件のアピールポイント・特徴（100文字程度）

        注意事項:
        - 情報が見つからない項目はnullを設定
        - 数値は必ず数値型で出力（文字列にしない）
        - JSONのみを出力し、他の説明は含めない
        - 必ず有効なJSON形式で出力

        出力例:
        {
          "room_number": "301",
          "room_type": "1LDK",
          "area": 45.5,
          "rent": 85000,
          "management_fee": 5000,
          "deposit": null,
          "deposit_months": 1,
          "key_money": null,
          "key_money_months": 1,
          "direction": "南",
          "floor": 3,
          "facilities": "エアコン,バス・トイレ別,室内洗濯機置場",
          "parking_fee": 0,
          "available_date": "immediate",
          "pets_allowed": false,
          "guarantor_required": true,
          "two_person_allowed": true,
          "description": "南向きで日当たり良好。駅徒歩5分の好立地。"
        }
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
                mime_type: 'application/pdf',
                data: pdf_base64
              }
            }
          ]
        }
      })

      # レスポンスからテキストを取得
      response_text = result.dig('candidates', 0, 'content', 'parts', 0, 'text') || ''

      # JSONを抽出（コードブロックで囲まれている場合も対応）
      json_text = response_text.gsub(/```json\s*/, '').gsub(/```\s*/, '').strip

      # JSONをパース
      extracted_data = JSON.parse(json_text)

      # room_typeの変換（日本語表記からenum値へ）
      room_type_mapping = {
        'ワンルーム' => 'studio',
        'studio' => 'studio',
        '1K' => '1K',
        '1DK' => '1DK',
        '1LDK' => '1LDK',
        '2K' => '2K',
        '2DK' => '2DK',
        '2LDK' => '2LDK',
        '3K' => '3K',
        '3DK' => '3DK',
        '3LDK' => '3LDK',
        'その他' => 'other',
        'other' => 'other'
      }

      if extracted_data['room_type']
        extracted_data['room_type'] = room_type_mapping[extracted_data['room_type']] || extracted_data['room_type']
      end

      # 敷金・礼金を月数から金額に変換（賃料がある場合）
      if extracted_data['rent'] && extracted_data['deposit_months'] && extracted_data['deposit'].nil?
        extracted_data['deposit'] = extracted_data['rent'] * extracted_data['deposit_months']
      end
      if extracted_data['rent'] && extracted_data['key_money_months'] && extracted_data['key_money'].nil?
        extracted_data['key_money'] = extracted_data['rent'] * extracted_data['key_money_months']
      end

      # 入居可能日の変換
      if extracted_data['available_date'] == 'immediate'
        extracted_data['available_date'] = Date.today.to_s
        extracted_data['available_date_note'] = '即入居可'
      end

      # 設備の正規化処理
      if extracted_data['facilities'].present?
        normalizer = FacilityNormalizer.new
        facility_result = normalizer.normalize(extracted_data['facilities'])

        # マッチした設備のコードリストを追加
        extracted_data['facility_codes'] = facility_result[:matched].map { |m| m[:facility].code }
        # 表示用に正規化済み設備名リストを追加
        extracted_data['normalized_facilities'] = facility_result[:matched].map { |m| m[:facility].name }
        # 未マッチ設備を追加
        extracted_data['unmatched_facilities'] = facility_result[:unmatched]
      end

      render json: {
        success: true,
        extracted_data: extracted_data,
        message: '募集図面の解析が完了しました'
      }

    rescue JSON::ParserError => e
      Rails.logger.error("Floorplan analysis JSON parse error: #{e.message}")
      Rails.logger.error("Response text: #{response_text}")
      render json: {
        error: '解析結果のパースに失敗しました',
        details: e.message,
        raw_response: response_text
      }, status: :unprocessable_entity
    rescue StandardError => e
      Rails.logger.error("Floorplan analysis error: #{e.message}")
      render json: {
        error: '募集図面の解析に失敗しました',
        details: e.message
      }, status: :internal_server_error
    end
  end

  # GET /api/v1/rooms/search
  # 建物名・部屋番号で物件を検索
  def search
    query = params[:q].to_s.strip

    if query.blank?
      return render json: { rooms: [] }
    end

    @rooms = Room.joins(:building)
                 .where(buildings: { tenant_id: current_tenant.id })
                 .where(
                   "buildings.name ILIKE :query OR rooms.room_number ILIKE :query OR CONCAT(buildings.name, ' ', rooms.room_number) ILIKE :query",
                   query: "%#{query}%"
                 )
                 .order('buildings.name ASC, rooms.room_number ASC')
                 .limit(20)

    render json: {
      rooms: @rooms.map do |room|
        {
          id: room.id,
          room_number: room.room_number,
          building_id: room.building_id,
          building_name: room.building.name,
          full_name: "#{room.building.name} #{room.room_number}",
          room_type: room.room_type,
          room_type_label: room.room_type_label,
          rent: room.rent,
          area: room.area
        }
      end
    }
  end

  # POST /api/v1/rooms/:id/regenerate_floorplan_thumbnail
  # 既存PDFからサムネイルを再生成
  def regenerate_floorplan_thumbnail
    unless @room.floorplan_pdf.attached?
      return render json: { error: '募集図面がアップロードされていません' }, status: :bad_request
    end

    # 既存のサムネイルを削除
    @room.floorplan_thumbnail.purge if @room.floorplan_thumbnail.attached?

    # サムネイルを再生成
    generate_floorplan_thumbnail

    if @room.floorplan_thumbnail.attached?
      thumbnail_url = if Rails.env.production?
        @room.floorplan_thumbnail.url
      else
        Rails.application.routes.url_helpers.rails_blob_path(@room.floorplan_thumbnail, only_path: true)
      end

      render json: {
        success: true,
        message: 'サムネイルを再生成しました',
        floorplan_thumbnail_url: thumbnail_url
      }
    else
      render json: { error: 'サムネイルの生成に失敗しました' }, status: :unprocessable_entity
    end
  end

  private

  # 部屋情報に添付ファイル（図面等）のURLを含めたJSONを構築
  def room_with_attachments
    room_json = @room.as_json(
      include: {
        building: {},
        room_photos: {},
        vr_tours: {}
      },
      methods: [:status_label, :room_type_label, :facility_codes, :facility_names]
    )

    # 募集図面PDFのURLを追加
    if @room.floorplan_pdf.attached?
      room_json['floorplan_pdf_url'] = if Rails.env.production?
        @room.floorplan_pdf.url
      else
        Rails.application.routes.url_helpers.rails_blob_path(@room.floorplan_pdf, only_path: true)
      end
      room_json['floorplan_pdf_filename'] = @room.floorplan_pdf.filename.to_s
    end

    # 募集図面サムネイルのURLを追加
    if @room.floorplan_thumbnail.attached?
      room_json['floorplan_thumbnail_url'] = if Rails.env.production?
        @room.floorplan_thumbnail.url
      else
        Rails.application.routes.url_helpers.rails_blob_path(@room.floorplan_thumbnail, only_path: true)
      end
    end

    room_json
  end

  def set_room
    @room = Room.joins(:building).where(buildings: { tenant_id: current_tenant.id }).find(params[:id])
  end

  def room_params
    params.require(:room).permit(
      :room_number,
      :floor,
      :room_type,
      :area,
      :rent,
      :management_fee,
      :deposit,
      :key_money,
      :status,
      :description,
      :tenant_name,
      :tenant_phone,
      :contract_start_date,
      :contract_end_date,
      :notes,
      :direction,
      :parking_fee,
      :available_date,
      :renewal_fee,
      :guarantor_required,
      :pets_allowed,
      :two_person_allowed,
      :office_use_allowed
    )
  end

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end

  # facility_codesから部屋の設備を更新
  def update_room_facilities(facility_codes)
    # 既存のroom_facilitiesを削除
    @room.room_facilities.destroy_all

    # 設備コードから設備を取得して登録
    Array(facility_codes).each do |code|
      facility = Facility.find_by(code: code)
      next unless facility

      @room.room_facilities.create!(facility: facility)
    end
  end

  # PDFの1ページ目からサムネイル画像を生成
  def generate_floorplan_thumbnail
    return unless @room.floorplan_pdf.attached?

    begin
      # PDFファイルを一時ファイルとしてダウンロード
      pdf_tempfile = Tempfile.new(['floorplan', '.pdf'])
      pdf_tempfile.binmode
      pdf_tempfile.write(@room.floorplan_pdf.download)
      pdf_tempfile.rewind

      # サムネイル用の一時ファイル
      thumbnail_tempfile = Tempfile.new(['thumbnail', '.png'])

      # ImageMagickのconvertコマンドで直接変換（より確実な方法）
      # -density: 入力解像度（高めに設定）
      # -quality: 出力品質
      # -flatten: 透明背景を白に
      # -resize: 最大幅800px
      # [0]: 1ページ目のみ
      system(
        'convert',
        '-density', '150',
        '-quality', '90',
        '-background', 'white',
        '-flatten',
        "#{pdf_tempfile.path}[0]",
        '-resize', '800x>',
        thumbnail_tempfile.path
      )

      # ファイルが生成されたか確認
      if File.exist?(thumbnail_tempfile.path) && File.size(thumbnail_tempfile.path) > 0
        # Active Storageにアタッチ
        @room.floorplan_thumbnail.attach(
          io: File.open(thumbnail_tempfile.path),
          filename: "floorplan_thumbnail_#{@room.id}.png",
          content_type: 'image/png'
        )
        Rails.logger.info("Floorplan thumbnail generated for room #{@room.id}")
      else
        Rails.logger.error("Thumbnail file was not generated properly")
      end

      # 一時ファイルをクリーンアップ
      pdf_tempfile.close
      pdf_tempfile.unlink
      thumbnail_tempfile.close
      thumbnail_tempfile.unlink
    rescue StandardError => e
      Rails.logger.error("Failed to generate floorplan thumbnail: #{e.message}")
      Rails.logger.error(e.backtrace.first(5).join("\n"))
      # サムネイル生成に失敗してもPDFアップロード自体は成功させる
    end
  end
end
