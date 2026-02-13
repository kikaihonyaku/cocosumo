class UnreadInquiryService
  # 受信アクティビティとして扱うタイプ
  INBOUND_ACTIVITY_TYPES = %w[line_message email inquiry].freeze

  def initialize(user)
    @user = user
    @tenant = user.tenant
  end

  # 未読案件の件数（ポーリング用、軽量）
  def unread_count
    unread_base_query.count("inquiries.id")
  end

  # 未読の案件ID一覧
  def unread_inquiry_ids
    unread_base_query.pluck("inquiries.id")
  end

  # 未読案件の詳細（ドロップダウン用）
  def unread_inquiries(limit: 20)
    inquiry_ids = unread_base_query
      .order("last_inbound_at DESC")
      .limit(limit)
      .pluck("inquiries.id", "last_inbound_at")

    return [] if inquiry_ids.empty?

    ids = inquiry_ids.map(&:first)
    last_inbound_map = inquiry_ids.to_h

    inquiries = Inquiry.where(id: ids)
                       .includes(:customer, :assigned_user)
                       .index_by(&:id)

    # 各案件の最新受信アクティビティを取得
    latest_activities = CustomerActivity.where(inquiry_id: ids)
      .where(activity_type: INBOUND_ACTIVITY_TYPES, direction: :inbound)
      .select("DISTINCT ON (inquiry_id) inquiry_id, activity_type, subject, content, created_at")
      .order("inquiry_id, created_at DESC")
      .index_by(&:inquiry_id)

    ids.filter_map do |id|
      inquiry = inquiries[id]
      next unless inquiry

      activity = latest_activities[id]

      {
        id: inquiry.id,
        customer: {
          id: inquiry.customer.id,
          name: inquiry.customer.name
        },
        assigned_user: inquiry.assigned_user ? {
          id: inquiry.assigned_user.id,
          name: inquiry.assigned_user.name
        } : nil,
        status: inquiry.status,
        status_label: inquiry.status_label,
        last_activity: activity ? {
          activity_type: activity.activity_type,
          subject: activity.subject,
          content: activity.content&.truncate(100),
          created_at: activity.created_at
        } : nil,
        last_inbound_at: last_inbound_map[id]
      }
    end
  end

  private

  # 未読案件のベースクエリ
  # 1. 対象案件を担当者ルールに基づいてフィルタ
  # 2. 各案件の最新受信アクティビティの時刻を集計
  # 3. inquiry_read_statuses と LEFT JOIN
  # 4. last_read_at IS NULL OR last_inbound_at > last_read_at → 未読
  def unread_base_query
    target_inquiries = target_inquiry_scope

    target_inquiries
      .joins(<<~SQL)
        INNER JOIN (
          SELECT inquiry_id, MAX(created_at) AS last_inbound_at
          FROM customer_activities
          WHERE activity_type IN (#{INBOUND_ACTIVITY_TYPES.map { |t| CustomerActivity.activity_types[t] }.join(', ')})
            AND direction = #{CustomerActivity.directions[:inbound]}
          GROUP BY inquiry_id
        ) AS latest_inbound ON latest_inbound.inquiry_id = inquiries.id
      SQL
      .joins(<<~SQL)
        LEFT JOIN inquiry_read_statuses
          ON inquiry_read_statuses.inquiry_id = inquiries.id
          AND inquiry_read_statuses.user_id = #{@user.id}
      SQL
      .where("inquiry_read_statuses.last_read_at IS NULL OR latest_inbound.last_inbound_at > inquiry_read_statuses.last_read_at")
      .select("inquiries.id, latest_inbound.last_inbound_at")
  end

  # 対象案件のスコープ（担当者ルールに基づく）
  # - admin/super_admin: テナント内の全案件
  # - member:
  #   - 担当者なしの案件 → 表示する
  #   - 自分が担当の案件 → 表示する
  #   - 他人が担当の案件 → 表示しない
  def target_inquiry_scope
    scope = @tenant.inquiries.where.not(status: :closed)

    unless @user.admin? || @user.super_admin?
      scope = scope.where("inquiries.assigned_user_id IS NULL OR inquiries.assigned_user_id = ?", @user.id)
    end

    scope
  end
end
