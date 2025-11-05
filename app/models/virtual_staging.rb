class VirtualStaging < ApplicationRecord
  belongs_to :room
  belongs_to :before_photo, class_name: 'RoomPhoto', foreign_key: :before_photo_id
  belongs_to :after_photo, class_name: 'RoomPhoto', foreign_key: :after_photo_id

  # ステータス管理
  enum :status, { draft: 0, published: 1 }, default: :draft

  # バリデーション
  validates :title, presence: true
  validates :before_photo_id, presence: true
  validates :after_photo_id, presence: true

  # スコープ
  scope :published, -> { where(status: :published) }
  scope :draft, -> { where(status: :draft) }

  # Before画像のURL取得
  def before_photo_url
    before_photo&.photo_url
  end

  # After画像のURL取得
  def after_photo_url
    after_photo&.photo_url
  end

  # サムネイル画像（Before画像を使用）
  def thumbnail_url
    before_photo_url
  end
end
