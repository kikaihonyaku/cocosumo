# frozen_string_literal: true

class BulkFloorplanAnalyzeJob < ApplicationJob
  queue_as :default

  # Gemini APIのレート制限を考慮してリトライ設定
  retry_on StandardError, wait: 10.seconds, attempts: 3

  def perform(bulk_import_history_id:)
    Rails.logger.info "[BulkFloorplanAnalyzeJob] Starting analysis for history #{bulk_import_history_id}"

    history = BulkImportHistory.find(bulk_import_history_id)
    history.start_analyzing!

    # 各PDFファイルを順次処理（レート制限対策）
    history.bulk_import_items.pending.ordered.find_each do |item|
      analyze_item(item, history)
    end

    history.finish_analyzing!
    Rails.logger.info "[BulkFloorplanAnalyzeJob] Completed. Analyzed: #{history.analyzed_count}"
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.error "[BulkFloorplanAnalyzeJob] History not found: #{bulk_import_history_id}"
    raise
  rescue StandardError => e
    Rails.logger.error "[BulkFloorplanAnalyzeJob] Unexpected error: #{e.message}"
    Rails.logger.error e.backtrace.first(10).join("\n")
    history&.fail!(e.message)
    raise
  end

  private

  def analyze_item(item, history)
    item.start_analyzing!
    history.add_log("#{item.original_filename} を解析中...", 'info')

    # PDFデータを取得
    unless item.pdf_file.attached?
      item.mark_error!('PDFファイルが見つかりません')
      return
    end

    # AI解析実行
    pdf_data = item.pdf_file.download
    service = FloorplanAnalyzerService.new(pdf_data)
    extracted_data = service.analyze

    # 類似建物検索
    similar_buildings = find_similar_buildings(history.tenant, extracted_data)

    # 結果を保存
    item.finish_analyzing!(extracted_data, similar_buildings)
    history.add_log("#{item.original_filename} の解析が完了しました", 'success')

    # APIレート制限対策として少し待機
    sleep(1)
  rescue FloorplanAnalyzerService::AnalysisError => e
    Rails.logger.error "[BulkFloorplanAnalyzeJob] Analysis error for item #{item.id}: #{e.message}"
    item.mark_error!(e.message)
    history.add_log("#{item.original_filename} の解析に失敗: #{e.message}", 'error')
  rescue StandardError => e
    Rails.logger.error "[BulkFloorplanAnalyzeJob] Error for item #{item.id}: #{e.message}"
    item.mark_error!(e.message)
    history.add_log("#{item.original_filename} の処理中にエラー: #{e.message}", 'error')
  end

  def find_similar_buildings(tenant, extracted_data)
    building_data = extracted_data['building'] || {}
    return [] if building_data.blank?

    matcher = BuildingMatcherService.new(tenant: tenant)
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
end
