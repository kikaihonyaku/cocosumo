class Api::V1::DashboardsController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login

  # GET /api/v1/dashboard
  def show
    render json: {
      summary: build_summary,
      inquiry_trend: build_inquiry_trend,
      deal_status_distribution: build_deal_status_distribution,
      media_breakdown: build_media_breakdown,
      pending_inquiries: build_pending_inquiries,
      recent_activities: build_recent_activities,
      alerts: build_alerts
    }
  end

  private

  def build_summary
    tenant = current_user.tenant
    today = Date.current
    this_month_start = today.beginning_of_month
    last_month_start = (today - 1.month).beginning_of_month
    last_month_end = (today - 1.month).end_of_month

    # 今月の問い合わせ
    this_month_inquiries = tenant_inquiries.where(created_at: this_month_start..today.end_of_day).count
    last_month_inquiries = tenant_inquiries.where(created_at: last_month_start..last_month_end).count
    inquiry_change = last_month_inquiries > 0 ?
      ((this_month_inquiries - last_month_inquiries).to_f / last_month_inquiries * 100).round(1) : nil

    # 進行中案件
    pending_count = tenant_inquiries.where(status: :pending).count
    in_progress_count = tenant_inquiries.where(status: :in_progress).count

    # アクティブな顧客
    active_customers = tenant.customers.active_deals.count
    contracted_this_month = tenant.customers.where(deal_status: :contracted)
                                   .where('deal_status_changed_at >= ?', this_month_start).count

    # 公開中ページ
    published_pages = PropertyPublication.kept.joins(room: :building)
                                         .where(buildings: { tenant_id: tenant.id })
                                         .where(status: :published).count

    {
      inquiries: {
        count: this_month_inquiries,
        change_percentage: inquiry_change
      },
      active_cases: {
        total: pending_count + in_progress_count,
        pending: pending_count,
        in_progress: in_progress_count
      },
      active_customers: {
        count: active_customers,
        contracted_this_month: contracted_this_month
      },
      published_pages: published_pages
    }
  end

  def build_inquiry_trend
    # 過去30日の日別問い合わせ数
    start_date = 30.days.ago.beginning_of_day
    tenant_inquiries.where('property_inquiries.created_at >= ?', start_date)
                    .group("DATE(property_inquiries.created_at)")
                    .count
                    .transform_keys(&:to_s)
  end

  def build_deal_status_distribution
    current_user.tenant.customers.where(status: :active).group(:deal_status).count
  end

  def build_media_breakdown
    # 今月の媒体別問い合わせ
    this_month_start = Date.current.beginning_of_month
    tenant_inquiries.where('property_inquiries.created_at >= ?', this_month_start)
                    .group(:media_type)
                    .count
  end

  def build_pending_inquiries
    tenant_inquiries.where(status: :pending)
                    .includes(:customer, room: :building)
                    .order(created_at: :asc)
                    .limit(10)
                    .map { |i| pending_inquiry_json(i) }
  end

  def build_recent_activities
    CustomerActivity.joins(:customer)
                    .where(customers: { tenant_id: current_user.tenant_id })
                    .includes(:customer, :user)
                    .recent
                    .limit(5)
                    .map { |a| activity_json(a) }
  end

  def build_alerts
    tenant = current_user.tenant

    # 優先度高の顧客
    high_priority_customers = tenant.customers.active_deals
                                    .where(priority: [:high, :urgent])
                                    .includes(:assigned_user)
                                    .limit(5)
                                    .map { |c| {
                                      id: c.id,
                                      name: c.name,
                                      priority: c.priority,
                                      priority_label: c.priority_label,
                                      deal_status: c.deal_status,
                                      deal_status_label: c.deal_status_label,
                                      assigned_user_name: c.assigned_user&.name
                                    } }

    # 期限切れ間近のアクセス権（7日以内）
    expiring_accesses = CustomerAccess.joins(property_publication: { room: :building })
                                      .where(buildings: { tenant_id: tenant.id })
                                      .where(status: :active)
                                      .where('customer_accesses.expires_at <= ?', 7.days.from_now)
                                      .where('customer_accesses.expires_at > ?', Time.current)
                                      .includes(property_publication: { room: :building })
                                      .limit(5)
                                      .map { |a| {
                                        id: a.id,
                                        customer_name: a.customer_name,
                                        property_title: a.property_publication&.title,
                                        days_until_expiry: a.days_until_expiry,
                                        expires_at: a.formatted_expires_at
                                      } }

    {
      high_priority_customers: high_priority_customers,
      expiring_accesses: expiring_accesses
    }
  end

  def tenant_inquiries
    PropertyInquiry.joins(room: :building)
                   .where(buildings: { tenant_id: current_user.tenant_id })
  end

  def pending_inquiry_json(inquiry)
    {
      id: inquiry.id,
      property_title: inquiry.property_title,
      customer_name: inquiry.customer&.name || inquiry.name,
      customer_id: inquiry.customer_id,
      media_type: inquiry.media_type,
      media_type_label: inquiry.media_type_label,
      days_ago: ((Time.current - inquiry.created_at) / 1.day).floor,
      created_at: inquiry.formatted_created_at
    }
  end

  def activity_json(activity)
    {
      id: activity.id,
      customer_id: activity.customer_id,
      customer_name: activity.customer.name,
      activity_type: activity.activity_type,
      activity_type_label: activity.activity_type_label,
      icon_name: activity.icon_name,
      subject: activity.subject,
      user_name: activity.user&.name,
      created_at: activity.created_at.strftime('%m/%d %H:%M')
    }
  end

  def require_login
    render json: { error: '認証が必要です' }, status: :unauthorized unless current_user
  end
end
