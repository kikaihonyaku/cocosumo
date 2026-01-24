# frozen_string_literal: true

class BulkImportHistory < ApplicationRecord
  belongs_to :tenant
  belongs_to :user
  has_many :bulk_import_items, dependent: :destroy

  # PDFファイル添付（Active Storage）
  has_many_attached :pdf_files

  # ステータス定義
  STATUSES = {
    pending: 'pending',
    analyzing: 'analyzing',
    confirming: 'confirming',
    processing: 'processing',
    completed: 'completed',
    failed: 'failed'
  }.freeze

  # スコープ
  scope :recent, -> { order(created_at: :desc) }
  scope :by_status, ->(status) { where(status: status) }
  scope :not_completed, -> { where.not(status: %w[completed failed]) }

  # バリデーション
  validates :status, inclusion: { in: STATUSES.values }

  # ステータスチェックメソッド
  def pending?
    status == STATUSES[:pending]
  end

  def analyzing?
    status == STATUSES[:analyzing]
  end

  def confirming?
    status == STATUSES[:confirming]
  end

  def processing?
    status == STATUSES[:processing]
  end

  def completed?
    status == STATUSES[:completed]
  end

  def failed?
    status == STATUSES[:failed]
  end

  # ログデータをJSONとして取得
  def parsed_logs
    return [] if log_data.blank?

    JSON.parse(log_data)
  rescue JSON::ParserError
    []
  end

  # ログを追加
  def add_log(message, type = 'info')
    logs = parsed_logs
    logs << {
      timestamp: Time.current.strftime('%H:%M:%S'),
      message: message,
      type: type
    }
    update_column(:log_data, logs.to_json)
  end

  # 解析開始
  def start_analyzing!
    update!(
      status: STATUSES[:analyzing],
      started_at: Time.current,
      log_data: [].to_json
    )
    add_log('解析を開始しました', 'info')
  end

  # 解析完了（確認待ち状態へ）
  def finish_analyzing!
    update!(status: STATUSES[:confirming])
    update_analyzed_count
    add_log('解析が完了しました。内容を確認してください。', 'success')
  end

  # 登録処理開始
  def start_processing!
    update!(status: STATUSES[:processing])
    add_log('登録処理を開始しました', 'info')
  end

  # 完了
  def complete!
    update!(
      status: STATUSES[:completed],
      completed_at: Time.current
    )
    update_stats
    add_log('一括登録が完了しました', 'success')
  end

  # 失敗
  def fail!(error_message)
    update!(
      status: STATUSES[:failed],
      completed_at: Time.current,
      error_count: bulk_import_items.where(status: 'error').count
    )
    add_log("エラー: #{error_message}", 'error')
  end

  # 統計情報を更新
  def update_stats
    items = bulk_import_items.where(status: 'registered')
    update!(
      buildings_created: items.where.not(created_building_id: nil).where(selected_building_id: nil).count,
      buildings_matched: items.where.not(selected_building_id: nil).count,
      rooms_created: items.where.not(created_room_id: nil).count,
      error_count: bulk_import_items.where(status: 'error').count
    )
  end

  # 解析完了数を更新
  def update_analyzed_count
    update!(analyzed_count: bulk_import_items.where(status: 'analyzed').count)
  end

  # 実行時間（秒）
  def duration_seconds
    return nil unless started_at

    end_time = completed_at || Time.current
    (end_time - started_at).to_i
  end

  # 進捗率（%）
  def progress_percentage
    return 0 if total_files.zero?

    (analyzed_count.to_f / total_files * 100).round
  end
end
