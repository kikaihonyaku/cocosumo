# frozen_string_literal: true

class SuumoImportHistory < ApplicationRecord
  belongs_to :tenant

  # ステータス定義
  STATUSES = {
    pending: "pending",
    running: "running",
    completed: "completed",
    failed: "failed"
  }.freeze

  scope :recent, -> { order(started_at: :desc) }
  scope :by_status, ->(status) { where(status: status) }

  # ログデータをJSONとして取得
  def parsed_logs
    return [] if log_data.blank?

    JSON.parse(log_data)
  rescue JSON::ParserError
    []
  end

  # ログを追加
  def add_log(message, type = "info")
    logs = parsed_logs
    logs << {
      timestamp: Time.current.strftime("%H:%M:%S"),
      message: message,
      type: type
    }
    update_column(:log_data, logs.to_json)
  end

  # 統計情報を更新
  def update_stats(stats)
    update(
      buildings_created: stats[:buildings_created] || 0,
      buildings_updated: stats[:buildings_updated] || 0,
      rooms_created: stats[:rooms_created] || 0,
      rooms_updated: stats[:rooms_updated] || 0,
      images_downloaded: stats[:images_downloaded] || 0,
      images_skipped: stats[:images_skipped] || 0,
      error_count: stats[:errors]&.size || 0
    )
  end

  # 実行開始
  def start!
    update(
      status: STATUSES[:running],
      started_at: Time.current,
      log_data: [].to_json
    )
    add_log("インポートを開始しました", "info")
  end

  # 完了
  def complete!(stats)
    update_stats(stats)
    update(
      status: STATUSES[:completed],
      completed_at: Time.current
    )
    add_log("インポートが完了しました", "success")
  end

  # 失敗
  def fail!(error_message)
    update(
      status: STATUSES[:failed],
      completed_at: Time.current,
      error_message: error_message
    )
    add_log("エラー: #{error_message}", "error")
  end

  # 実行時間（秒）
  def duration_seconds
    return nil unless started_at

    end_time = completed_at || Time.current
    (end_time - started_at).to_i
  end

  # 合計処理件数
  def total_items_processed
    (buildings_created || 0) + (buildings_updated || 0) +
      (rooms_created || 0) + (rooms_updated || 0)
  end
end
