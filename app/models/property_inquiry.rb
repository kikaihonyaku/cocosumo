class PropertyInquiry < ApplicationRecord
  # Temporary attribute for tracking who made the change
  attr_accessor :changed_by

  # Associations
  belongs_to :room
  belongs_to :property_publication, optional: true
  belongs_to :customer
  belongs_to :assigned_user, class_name: 'User', optional: true
  has_many :customer_accesses
  has_many :customer_activities

  # Callbacks for automatic activity recording
  after_create :record_inquiry_activity
  after_update :record_status_change_activity, if: :saved_change_to_status?
  after_update :record_assigned_user_change_activity, if: :saved_change_to_assigned_user_id?

  # Enums
  enum :media_type, {
    suumo: 0,
    athome: 1,
    homes: 2,
    lifull: 3,
    own_website: 10,
    line: 11,
    phone: 12,
    walk_in: 13,
    referral: 14,
    email: 15,
    other_media: 99
  }, prefix: true

  enum :origin_type, {
    document_request: 0,
    visit_reservation: 1,
    general_inquiry: 2,
    staff_proposal: 10,
    other_origin: 99
  }, prefix: true

  enum :status, {
    pending: 0,
    in_progress: 1,
    completed: 2
  }, prefix: true

  enum :channel, { web_form: 0, line: 1, email: 2 }, prefix: true

  # Validations
  validates :name, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true

  # Delegations
  delegate :building, to: :room
  delegate :tenant, to: :building

  # Scopes
  scope :recent, -> { order(created_at: :desc) }
  scope :active, -> { where.not(status: :completed) }

  # Get formatted created time
  def formatted_created_at
    created_at.strftime('%Y年%m月%d日 %H:%M')
  end

  # Get formatted replied time
  def formatted_replied_at
    replied_at&.strftime('%Y年%m月%d日 %H:%M')
  end

  # ラベルメソッド
  def media_type_label
    I18n.t("activerecord.enums.property_inquiry.media_type.#{media_type}", default: media_type)
  end

  def origin_type_label
    I18n.t("activerecord.enums.property_inquiry.origin_type.#{origin_type}", default: origin_type)
  end

  def status_label
    I18n.t("activerecord.enums.property_inquiry.status.#{status}", default: status)
  end

  # 物件タイトル（room経由で取得）
  def property_title
    if property_publication.present?
      property_publication.title
    else
      "#{room.building.name} #{room.room_number}"
    end
  end

  # 顧客の他の問い合わせ
  def other_inquiries_from_same_customer
    return [] unless customer.present?
    customer.property_inquiries.where.not(id: id)
  end

  # 同一顧客の他物件問い合わせ件数
  def other_inquiry_count
    other_inquiries_from_same_customer.count
  end

  private

  # 問い合わせ作成時のアクティビティ記録
  def record_inquiry_activity
    customer_activities.create!(
      customer: customer,
      user: changed_by,
      activity_type: :inquiry,
      direction: :inbound,
      subject: "#{origin_type_label}（#{media_type_label}）",
      content: message.presence
    )
  end

  # ステータス変更時のアクティビティ記録
  def record_status_change_activity
    old_status, new_status = saved_change_to_status
    old_label = I18n.t("activerecord.enums.property_inquiry.status.#{old_status}", default: old_status)
    new_label = status_label

    customer_activities.create!(
      customer: customer,
      user: changed_by,
      activity_type: :status_change,
      direction: :internal,
      subject: "案件ステータスを「#{new_label}」に変更",
      content: "#{property_title}：#{old_label} → #{new_label}"
    )
  end

  # 担当者変更時のアクティビティ記録
  def record_assigned_user_change_activity
    old_user_id, new_user_id = saved_change_to_assigned_user_id
    old_user = User.find_by(id: old_user_id)
    new_user = assigned_user

    old_name = old_user&.name || '未設定'
    new_name = new_user&.name || '未設定'

    customer_activities.create!(
      customer: customer,
      user: changed_by,
      activity_type: :assigned_user_change,
      direction: :internal,
      subject: "担当者を「#{new_name}」に変更",
      content: "#{property_title}：#{old_name} → #{new_name}"
    )
  end
end
