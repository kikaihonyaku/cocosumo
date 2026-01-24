# frozen_string_literal: true

class BulkImportItem < ApplicationRecord
  belongs_to :bulk_import_history
  belongs_to :selected_building, class_name: 'Building', optional: true
  belongs_to :created_building, class_name: 'Building', optional: true
  belongs_to :created_room, class_name: 'Room', optional: true

  # PDFファイル添付（Active Storage）
  has_one_attached :pdf_file

  # ステータス定義
  STATUSES = {
    pending: 'pending',
    analyzing: 'analyzing',
    analyzed: 'analyzed',
    error: 'error',
    registered: 'registered'
  }.freeze

  # スコープ
  scope :pending, -> { where(status: STATUSES[:pending]) }
  scope :analyzed, -> { where(status: STATUSES[:analyzed]) }
  scope :with_errors, -> { where(status: STATUSES[:error]) }
  scope :registered, -> { where(status: STATUSES[:registered]) }
  scope :ordered, -> { order(display_order: :asc) }

  # バリデーション
  validates :original_filename, presence: true
  validates :status, inclusion: { in: STATUSES.values }

  # ステータスチェックメソッド
  def pending?
    status == STATUSES[:pending]
  end

  def analyzing?
    status == STATUSES[:analyzing]
  end

  def analyzed?
    status == STATUSES[:analyzed]
  end

  def error?
    status == STATUSES[:error]
  end

  def registered?
    status == STATUSES[:registered]
  end

  # 解析開始
  def start_analyzing!
    update!(status: STATUSES[:analyzing])
  end

  # 解析完了
  def finish_analyzing!(data, similar = [])
    update!(
      status: STATUSES[:analyzed],
      extracted_data: data,
      edited_data: data.deep_dup,
      similar_buildings: similar
    )
  end

  # エラー
  def mark_error!(message)
    update!(
      status: STATUSES[:error],
      error_message: message
    )
  end

  # 登録完了
  def mark_registered!(building_id:, room_id:, is_new_building:)
    attrs = {
      status: STATUSES[:registered],
      created_room_id: room_id
    }
    if is_new_building
      attrs[:created_building_id] = building_id
    else
      attrs[:selected_building_id] = building_id
    end
    update!(attrs)
  end

  # 編集データを更新
  def update_edited_data!(data)
    update!(edited_data: data)
  end

  # 既存建物を選択
  def select_building!(building_id)
    update!(selected_building_id: building_id)
  end

  # 既存建物選択を解除
  def deselect_building!
    update!(selected_building_id: nil)
  end

  # 建物情報を取得（編集データから）
  def building_data
    edited_data['building'] || {}
  end

  # 部屋情報を取得（編集データから）
  def room_data
    edited_data['room'] || {}
  end

  # スコアが80以上の類似建物があるか
  def has_recommended_building?
    similar_buildings.any? { |b| b['score'].to_f >= 80 }
  end

  # 最も類似度が高い建物を取得
  def best_match_building
    similar_buildings.max_by { |b| b['score'].to_f }
  end
end
