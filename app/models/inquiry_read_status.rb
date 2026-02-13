class InquiryReadStatus < ApplicationRecord
  belongs_to :user
  belongs_to :inquiry

  validates :user_id, uniqueness: { scope: :inquiry_id }

  # 特定の案件を既読にする（UPSERT）
  def self.mark_as_read!(user:, inquiry:)
    upsert(
      { user_id: user.id, inquiry_id: inquiry.id, last_read_at: Time.current },
      unique_by: [ :user_id, :inquiry_id ]
    )
  end

  # 複数案件を一括既読にする
  def self.mark_all_as_read!(user:, inquiry_ids:)
    return if inquiry_ids.blank?

    now = Time.current
    records = inquiry_ids.map do |inquiry_id|
      { user_id: user.id, inquiry_id: inquiry_id, last_read_at: now }
    end

    upsert_all(records, unique_by: [ :user_id, :inquiry_id ])
  end
end
