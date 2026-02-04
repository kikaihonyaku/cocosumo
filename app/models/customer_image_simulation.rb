class CustomerImageSimulation < ApplicationRecord
  belongs_to :property_publication
  belongs_to :customer_access, optional: true

  enum :status, { pending: 0, success: 1, failed: 2 }

  validates :session_id, :source_photo_type, :source_photo_id, :prompt, :simulation_date, presence: true
  validates :source_photo_type, inclusion: { in: %w[room_photo building_photo continued] }
  validates :customer_access_id, presence: true, if: -> { saved? }

  scope :today, -> { where(simulation_date: Date.current) }
  scope :for_publication, ->(pub_id) { where(property_publication_id: pub_id) }
  scope :for_session, ->(session_id) { where(session_id: session_id) }
  scope :recent, -> { order(created_at: :desc) }
  scope :saved_items, -> { where(saved: true) }
  scope :for_customer_access, ->(ca_id) { where(customer_access_id: ca_id) }

  # 1日あたりの利用制限
  DAILY_LIMIT = 10

  # 保存上限
  MAX_SAVED_PER_ACCESS = 5

  # 保存可能かチェック
  def self.can_save?(customer_access_id)
    where(customer_access_id: customer_access_id, saved: true).count < MAX_SAVED_PER_ACCESS
  end

  # 残り回数を取得
  def self.remaining_quota(property_publication_id, session_id)
    used_count = where(property_publication_id: property_publication_id)
                   .where(session_id: session_id)
                   .today
                   .count
    [DAILY_LIMIT - used_count, 0].max
  end

  # 制限内かチェック
  def self.within_limit?(property_publication_id, session_id)
    remaining_quota(property_publication_id, session_id) > 0
  end

  # 結果画像のData URL
  def result_image_data_url
    return nil unless result_image_base64.present?
    "data:image/jpeg;base64,#{result_image_base64}"
  end
end
