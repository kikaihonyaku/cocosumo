class CustomerActivity < ApplicationRecord
  # Associations
  belongs_to :customer
  belongs_to :user, optional: true
  belongs_to :property_inquiry, optional: true
  belongs_to :customer_access, optional: true
  belongs_to :property_publication, optional: true

  # Enums
  enum :activity_type, {
    note: 0,           # メモ
    phone_call: 1,     # 電話
    email: 2,          # メール
    visit: 3,          # 来店
    viewing: 4,        # 内見
    inquiry: 5,        # 問い合わせ（自動記録）
    access_issued: 6,  # アクセス発行（自動記録）
    status_change: 7,  # ステータス変更（自動記録）
    line_message: 8    # LINEメッセージ
  }, prefix: true

  enum :direction, {
    internal: 0,   # 社内メモ
    outbound: 1,   # 発信（こちらから）
    inbound: 2     # 受信（顧客から）
  }, prefix: true

  # Validations
  validates :activity_type, presence: true

  # Scopes
  scope :recent, -> { order(created_at: :desc) }
  scope :manual, -> { where.not(activity_type: [:inquiry, :access_issued, :status_change]) }

  # Callbacks
  after_create :update_customer_last_contacted

  # フォーマット済み日時
  def formatted_created_at
    created_at.strftime('%Y/%m/%d %H:%M')
  end

  # 日付のみ
  def formatted_date
    created_at.strftime('%m/%d')
  end

  # アクティビティタイプのラベル
  def activity_type_label
    {
      'note' => 'メモ',
      'phone_call' => '電話',
      'email' => 'メール',
      'visit' => '来店',
      'viewing' => '内見',
      'inquiry' => '問い合わせ',
      'access_issued' => 'アクセス発行',
      'status_change' => 'ステータス変更',
      'line_message' => 'LINE'
    }[activity_type] || activity_type
  end

  # 方向のラベル
  def direction_label
    {
      'internal' => '社内',
      'outbound' => '発信',
      'inbound' => '受信'
    }[direction] || direction
  end

  # アイコン名（フロントエンド用）
  def icon_name
    {
      'note' => 'Note',
      'phone_call' => 'Phone',
      'email' => 'Email',
      'visit' => 'Store',
      'viewing' => 'Home',
      'inquiry' => 'QuestionAnswer',
      'access_issued' => 'Key',
      'status_change' => 'Flag',
      'line_message' => 'Chat'
    }[activity_type] || 'Info'
  end

  private

  def update_customer_last_contacted
    # 顧客との接触があった場合、last_contacted_atを更新
    if activity_type_phone_call? || activity_type_email? || activity_type_visit? ||
       activity_type_viewing? || activity_type_line_message?
      customer.update_column(:last_contacted_at, created_at)
    end
  end
end
