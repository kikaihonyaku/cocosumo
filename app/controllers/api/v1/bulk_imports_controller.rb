# frozen_string_literal: true

class Api::V1::BulkImportsController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :set_bulk_import_history, only: [:show, :update_item, :register]

  # 同期処理のファイル数上限
  SYNC_THRESHOLD = 5
  # 最大ファイル数
  MAX_FILES = 20
  # 最大ファイルサイズ (10MB)
  MAX_FILE_SIZE = 10.megabytes

  # POST /api/v1/bulk_imports
  # PDFファイルをアップロードして一括インポートを開始
  def create
    unless params[:files].present?
      return render json: { error: 'PDFファイルが必要です' }, status: :unprocessable_entity
    end

    files = Array(params[:files])

    if files.size > MAX_FILES
      return render json: { error: "最大#{MAX_FILES}ファイルまでアップロード可能です" }, status: :unprocessable_entity
    end

    # ファイル検証
    files.each do |file|
      unless file.content_type == 'application/pdf'
        return render json: { error: "#{file.original_filename} はPDFファイルではありません" }, status: :unprocessable_entity
      end
      if file.size > MAX_FILE_SIZE
        return render json: { error: "#{file.original_filename} が10MBを超えています" }, status: :unprocessable_entity
      end
    end

    # BulkImportHistoryを作成
    history = current_tenant.bulk_import_histories.create!(
      user: current_user,
      status: 'pending',
      total_files: files.size
    )

    # 各ファイルに対してBulkImportItemを作成
    files.each_with_index do |file, index|
      item = history.bulk_import_items.create!(
        original_filename: file.original_filename,
        status: 'pending',
        display_order: index
      )
      item.pdf_file.attach(file)
    end

    # ファイル数に応じて同期/非同期を切り替え
    if files.size <= SYNC_THRESHOLD
      # 同期処理
      process_sync(history)
    else
      # 非同期処理
      BulkFloorplanAnalyzeJob.perform_later(bulk_import_history_id: history.id)
    end

    render json: {
      success: true,
      id: history.id,
      total_files: history.total_files,
      async: files.size > SYNC_THRESHOLD,
      message: files.size > SYNC_THRESHOLD ? '解析ジョブを開始しました' : '解析が完了しました'
    }, status: :created
  end

  # GET /api/v1/bulk_imports/:id
  # インポート履歴の詳細取得
  def show
    render json: {
      id: @history.id,
      status: @history.status,
      total_files: @history.total_files,
      analyzed_count: @history.analyzed_count,
      progress_percentage: @history.progress_percentage,
      started_at: @history.started_at&.iso8601,
      completed_at: @history.completed_at&.iso8601,
      buildings_created: @history.buildings_created,
      buildings_matched: @history.buildings_matched,
      rooms_created: @history.rooms_created,
      error_count: @history.error_count,
      logs: @history.parsed_logs,
      items: @history.bulk_import_items.ordered.map { |item| item_to_json(item) }
    }
  end

  # PATCH /api/v1/bulk_imports/:id/items/:item_id
  # 個別アイテムの編集
  def update_item
    item = @history.bulk_import_items.find(params[:item_id])

    if params[:edited_data].present?
      item.update_edited_data!(params[:edited_data].to_unsafe_h)
    end

    if params.key?(:selected_building_id)
      if params[:selected_building_id].present?
        item.select_building!(params[:selected_building_id])
      else
        item.deselect_building!
      end
    end

    render json: { success: true, item: item_to_json(item) }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'アイテムが見つかりません' }, status: :not_found
  end

  # POST /api/v1/bulk_imports/:id/register
  # 一括登録実行
  def register
    unless @history.confirming?
      return render json: { error: '確認状態のインポートのみ登録可能です' }, status: :unprocessable_entity
    end

    @history.start_processing!

    results = { success: 0, failed: 0, errors: [] }

    ActiveRecord::Base.transaction do
      @history.bulk_import_items.analyzed.ordered.each do |item|
        result = register_item(item)
        if result[:success]
          results[:success] += 1
        else
          results[:failed] += 1
          results[:errors] << { filename: item.original_filename, error: result[:error] }
        end
      end
    end

    @history.complete!

    render json: {
      success: true,
      buildings_created: @history.buildings_created,
      buildings_matched: @history.buildings_matched,
      rooms_created: @history.rooms_created,
      results: results
    }
  rescue StandardError => e
    Rails.logger.error "[BulkImport] Registration error: #{e.message}"
    Rails.logger.error e.backtrace.first(10).join("\n")
    @history.fail!(e.message)
    render json: { error: '登録処理中にエラーが発生しました', details: e.message }, status: :internal_server_error
  end

  private

  def set_bulk_import_history
    @history = current_tenant.bulk_import_histories.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'インポート履歴が見つかりません' }, status: :not_found
  end

  def process_sync(history)
    history.start_analyzing!

    history.bulk_import_items.pending.ordered.each do |item|
      analyze_item_sync(item, history)
    end

    history.finish_analyzing!
  end

  def analyze_item_sync(item, history)
    item.start_analyzing!
    history.add_log("#{item.original_filename} を解析中...", 'info')

    unless item.pdf_file.attached?
      item.mark_error!('PDFファイルが見つかりません')
      return
    end

    pdf_data = item.pdf_file.download
    service = FloorplanAnalyzerService.new(pdf_data)
    extracted_data = service.analyze

    similar_buildings = find_similar_buildings(extracted_data)
    item.finish_analyzing!(extracted_data, similar_buildings)
    history.add_log("#{item.original_filename} の解析が完了しました", 'success')
  rescue FloorplanAnalyzerService::AnalysisError => e
    item.mark_error!(e.message)
    history.add_log("#{item.original_filename} の解析に失敗: #{e.message}", 'error')
  rescue StandardError => e
    item.mark_error!(e.message)
    history.add_log("#{item.original_filename} の処理中にエラー: #{e.message}", 'error')
  end

  def find_similar_buildings(extracted_data)
    building_data = extracted_data['building'] || {}
    return [] if building_data.blank?

    matcher = BuildingMatcherService.new(tenant: current_tenant)
    results = matcher.find_similar(
      name: building_data['name'],
      address: building_data['address'],
      latitude: building_data['latitude']&.to_f,
      longitude: building_data['longitude']&.to_f
    )

    results.map do |r|
      {
        id: r[:building].id,
        name: r[:building].name,
        address: r[:building].address,
        building_type: r[:building].building_type,
        latitude: r[:building].latitude,
        longitude: r[:building].longitude,
        room_cnt: r[:building].room_cnt,
        free_cnt: r[:building].free_cnt,
        score: r[:score],
        reasons: r[:reasons]
      }
    end
  end

  def register_item(item)
    building_data = item.building_data
    room_data = item.room_data

    is_new_building = item.selected_building_id.blank?

    if is_new_building
      # 新規建物を作成
      building = current_tenant.buildings.create!(
        name: building_data['name'],
        address: building_data['address'],
        building_type: building_data['building_type'] || 'mansion',
        structure: building_data['structure'],
        floors: building_data['floors'],
        built_date: building_data['built_date'],
        total_units: building_data['total_units'],
        latitude: building_data['latitude'],
        longitude: building_data['longitude']
      )
    else
      # 既存建物を使用
      building = current_tenant.buildings.find(item.selected_building_id)
    end

    # 部屋を作成
    room = building.rooms.create!(
      room_number: room_data['room_number'] || '未設定',
      floor: room_data['floor'] || 1,
      room_type: convert_room_type(room_data['room_type']),
      area: room_data['area'],
      rent: room_data['rent'],
      management_fee: room_data['management_fee'],
      deposit: room_data['deposit'],
      key_money: room_data['key_money'],
      direction: room_data['direction'],
      parking_fee: room_data['parking_fee'],
      available_date: room_data['available_date'],
      pets_allowed: room_data['pets_allowed'],
      guarantor_required: room_data['guarantor_required'],
      two_person_allowed: room_data['two_person_allowed'],
      description: room_data['description']
    )

    # 設備を登録
    if room_data['facility_codes'].present?
      Array(room_data['facility_codes']).each do |code|
        facility = Facility.find_by(code: code)
        next unless facility

        room.room_facilities.create!(facility: facility)
      end
    end

    # 募集図面PDFを添付
    if item.pdf_file.attached?
      room.floorplan_pdf.attach(item.pdf_file.blob)
      generate_floorplan_thumbnail(room, item.pdf_file.download)
    end

    item.mark_registered!(building_id: building.id, room_id: room.id, is_new_building: is_new_building)
    @history.add_log("#{item.original_filename}: #{building.name} / #{room.room_number} を登録しました", 'success')

    { success: true, building_id: building.id, room_id: room.id }
  rescue StandardError => e
    item.mark_error!(e.message)
    @history.add_log("#{item.original_filename} の登録に失敗: #{e.message}", 'error')
    { success: false, error: e.message }
  end

  def convert_room_type(room_type)
    mapping = {
      'studio' => 'studio',
      '1K' => 'one_bedroom',
      '1DK' => 'one_dk',
      '1LDK' => 'one_ldk',
      '2K' => 'two_bedroom',
      '2DK' => 'two_dk',
      '2LDK' => 'two_ldk',
      '3K' => 'three_bedroom',
      '3DK' => 'three_dk',
      '3LDK' => 'three_ldk',
      'other' => 'other'
    }
    mapping[room_type] || room_type
  end

  def generate_floorplan_thumbnail(room, pdf_data)
    return if pdf_data.blank?

    begin
      pdf_tempfile = Tempfile.new(['floorplan', '.pdf'])
      pdf_tempfile.binmode
      pdf_tempfile.write(pdf_data)
      pdf_tempfile.rewind

      thumbnail_tempfile = Tempfile.new(['thumbnail', '.png'])

      result = system(
        'convert',
        '-density', '150',
        '-quality', '90',
        '-background', 'white',
        '-flatten',
        "#{pdf_tempfile.path}[0]",
        '-resize', '800x>',
        thumbnail_tempfile.path
      )

      if File.exist?(thumbnail_tempfile.path) && File.size(thumbnail_tempfile.path) > 0
        room.floorplan_thumbnail.attach(
          io: File.open(thumbnail_tempfile.path),
          filename: "floorplan_thumbnail_#{room.id}.png",
          content_type: 'image/png'
        )
      end

      pdf_tempfile.close
      pdf_tempfile.unlink
      thumbnail_tempfile.close
      thumbnail_tempfile.unlink
    rescue StandardError => e
      Rails.logger.error("Failed to generate floorplan thumbnail: #{e.message}")
    end
  end

  def item_to_json(item)
    {
      id: item.id,
      status: item.status,
      original_filename: item.original_filename,
      extracted_data: item.extracted_data,
      edited_data: item.edited_data,
      similar_buildings: item.similar_buildings,
      selected_building_id: item.selected_building_id,
      has_recommended_building: item.has_recommended_building?,
      best_match_building: item.best_match_building,
      created_building_id: item.created_building_id,
      created_room_id: item.created_room_id,
      error_message: item.error_message,
      display_order: item.display_order
    }
  end
end
