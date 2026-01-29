class Api::V1::PropertyInquiriesController < ApplicationController
  skip_before_action :verify_authenticity_token

  # POST /api/v1/property_publications/:publication_id/property_inquiries
  def create
    @property_publication = PropertyPublication.kept.find_by!(publication_id: params[:property_publication_publication_id])

    unless @property_publication.published?
      render json: { error: "この物件公開ページは公開されていません" }, status: :not_found
      return
    end

    # 顧客を検索または作成
    tenant = @property_publication.tenant
    inquiry_params = property_inquiry_params
    @customer = Customer.find_or_initialize_by_contact(
      tenant: tenant,
      email: inquiry_params[:email],
      name: inquiry_params[:name],
      phone: inquiry_params[:phone]
    )

    ActiveRecord::Base.transaction do
      @customer.save!

      # Inquiry（案件）を自動作成または検索
      @inquiry = @customer.inquiries.where(tenant: tenant).where(status: :active).order(created_at: :desc).first
      @inquiry ||= tenant.inquiries.create!(customer: @customer)

      @property_inquiry = @property_publication.property_inquiries.build(inquiry_params)
      @property_inquiry.room = @property_publication.room
      @property_inquiry.customer = @customer
      @property_inquiry.inquiry = @inquiry
      @property_inquiry.save!
    end

    # メール通知を非同期で送信
    send_notification_emails(@property_inquiry)

    render json: {
      success: true,
      message: "お問い合わせを受け付けました。担当者より折り返しご連絡いたします。"
    }, status: :created
  rescue ActiveRecord::RecordInvalid => e
    errors = []
    errors.concat(@customer.errors.full_messages) if @customer&.errors&.any?
    errors.concat(@property_inquiry.errors.full_messages) if @property_inquiry&.errors&.any?
    render json: { errors: errors }, status: :unprocessable_entity
  rescue ActiveRecord::RecordNotFound
    render json: { error: "この物件公開ページは見つかりませんでした" }, status: :not_found
  end

  # GET /api/v1/property_publications/:id/inquiries (認証必要)
  def index
    return render json: { error: "認証が必要です" }, status: :unauthorized unless current_user

    @property_publication = PropertyPublication.kept.find(params[:property_publication_publication_id])
    @property_inquiries = @property_publication.property_inquiries
                                               .includes(:customer, :customer_accesses)
                                               .recent

    render json: @property_inquiries.map { |inquiry| inquiry_with_customer_json(inquiry) }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "物件公開ページが見つかりませんでした" }, status: :not_found
  end

  # GET /api/v1/property_inquiries (認証必要) - 全問い合わせ一覧
  def all
    return render json: { error: "認証が必要です" }, status: :unauthorized unless current_user

    # ユーザーのテナントに紐づく物件（room経由）
    @inquiries = PropertyInquiry.joins(room: :building)
                                .where(buildings: { tenant_id: current_user.tenant_id })
                                .includes(:customer, :customer_accesses, :inquiry, :property_publication, room: :building)
                                .order(created_at: :desc)
                                .limit(500)

    render json: {
      inquiries: @inquiries.map { |inquiry| inquiry_with_publication_json(inquiry) }
    }
  end

  # GET /api/v1/inquiries/export_csv (認証必要)
  def export_csv
    return render json: { error: "認証が必要です" }, status: :unauthorized unless current_user

    # ユーザーのテナントに紐づく物件のみ
    user_publication_ids = PropertyPublication.kept.joins(room: :building)
                                              .where(buildings: { tenant_id: current_user.tenant_id })
                                              .pluck(:id)

    inquiries = PropertyInquiry.where(property_publication_id: user_publication_ids)
                               .includes(:property_publication)
                               .order(created_at: :desc)

    # Date range filter
    if params[:start_date].present?
      inquiries = inquiries.where("created_at >= ?", Date.parse(params[:start_date]).beginning_of_day)
    end
    if params[:end_date].present?
      inquiries = inquiries.where("created_at <= ?", Date.parse(params[:end_date]).end_of_day)
    end

    require "csv"

    csv_data = CSV.generate(headers: true, force_quotes: true) do |csv|
      csv << [ "ID", "問い合わせ日時", "物件名", "名前", "メール", "電話番号", "メッセージ", "流入元", "UTMソース", "UTMメディア", "UTMキャンペーン", "リファラー" ]

      inquiries.each do |inquiry|
        csv << [
          inquiry.id,
          inquiry.created_at.strftime("%Y-%m-%d %H:%M:%S"),
          inquiry.property_publication.title,
          inquiry.name,
          inquiry.email,
          inquiry.phone,
          inquiry.message&.gsub(/\r?\n/, " "),
          inquiry.source,
          inquiry.utm_source,
          inquiry.utm_medium,
          inquiry.utm_campaign,
          inquiry.referrer
        ]
      end
    end

    send_data csv_data,
              filename: "inquiries_#{Date.today.strftime('%Y%m%d')}.csv",
              type: "text/csv; charset=utf-8"
  end

  # GET /api/v1/inquiry_analytics (認証必要)
  def analytics
    return render json: { error: "認証が必要です" }, status: :unauthorized unless current_user

    # 期間パラメータ（デフォルト: 過去30日）
    days = (params[:days] || 30).to_i
    start_date = days.days.ago.beginning_of_day

    # 全問い合わせ（ユーザーのテナントに紐づく物件のみ）
    user_publication_ids = PropertyPublication.kept.joins(room: :building)
                                              .where(buildings: { tenant_id: current_user.tenant_id })
                                              .pluck(:id)

    base_query = PropertyInquiry.where(property_publication_id: user_publication_ids)
    period_query = base_query.where("property_inquiries.created_at >= ?", start_date)

    # 基本統計
    total_count = period_query.count
    previous_period_count = base_query.where(property_inquiries: { created_at: (start_date - days.days)..start_date }).count

    # ソース別集計
    source_breakdown = period_query.group(:source).count.transform_keys { |k| k || "unknown" }

    # 日別推移（過去30日）
    daily_trend = period_query.group("DATE(property_inquiries.created_at)").count.transform_keys(&:to_s)

    # 週別推移（過去12週）
    weekly_trend = base_query.where("property_inquiries.created_at >= ?", 12.weeks.ago)
                             .group("DATE_TRUNC('week', property_inquiries.created_at)")
                             .count
                             .transform_keys { |k| k.to_date.to_s }

    # 物件別ランキング（トップ10）
    top_publications = period_query.joins(:property_publication)
                                   .group(:property_publication_id, "property_publications.title")
                                   .order("count_all DESC")
                                   .limit(10)
                                   .count
                                   .map { |(pub_id, title), count| { id: pub_id, title: title, count: count } }

    # キャンペーン別集計
    campaign_breakdown = period_query.where.not(utm_campaign: [ nil, "" ])
                                     .group(:utm_campaign)
                                     .count

    # テンプレート別パフォーマンス
    template_performance = period_query.joins(:property_publication)
                                       .group("property_publications.template_type")
                                       .count
                                       .transform_keys { |k| k || "template1" }

    # テンプレート別の物件数（分母）
    template_publication_counts = PropertyPublication.kept
                                                     .where(id: user_publication_ids)
                                                     .group(:template_type)
                                                     .count

    # テンプレート別パフォーマンス詳細を計算
    template_breakdown = PropertyPublication.template_types.keys.map do |template|
      inquiry_count = template_performance[template] || 0
      publication_count = template_publication_counts[template] || 0
      avg_per_publication = publication_count > 0 ? (inquiry_count.to_f / publication_count).round(2) : 0

      {
        template: template,
        inquiry_count: inquiry_count,
        publication_count: publication_count,
        avg_per_publication: avg_per_publication
      }
    end

    # 最新の問い合わせ（5件）
    recent_inquiries = period_query.includes(:property_publication)
                                   .order("property_inquiries.created_at DESC")
                                   .limit(5)
                                   .map do |inquiry|
      {
        id: inquiry.id,
        name: inquiry.name,
        source: inquiry.source,
        property_title: inquiry.property_publication.title,
        created_at: inquiry.formatted_created_at
      }
    end

    # コンバージョンファネル用データ（実際の閲覧数を集計）
    publications_with_views = PropertyPublication.kept
                                                 .where(id: user_publication_ids)
                                                 .where(status: :published)
    funnel_data = {
      page_views: publications_with_views.sum(:view_count) || 0,
      max_scroll_50_percent: publications_with_views.where("max_scroll_depth >= 50").count,
      inquiries: total_count
    }

    render json: {
      period: {
        days: days,
        start_date: start_date.to_date,
        end_date: Date.today
      },
      summary: {
        total: total_count,
        previous_period: previous_period_count,
        change_percentage: previous_period_count > 0 ? ((total_count - previous_period_count).to_f / previous_period_count * 100).round(1) : nil
      },
      source_breakdown: source_breakdown,
      daily_trend: daily_trend,
      weekly_trend: weekly_trend,
      top_publications: top_publications,
      campaign_breakdown: campaign_breakdown,
      template_breakdown: template_breakdown,
      recent_inquiries: recent_inquiries,
      funnel_data: funnel_data
    }
  end

  # PATCH /api/v1/inquiries/:id (認証必要) - ステータス更新
  def update
    return render json: { error: "認証が必要です" }, status: :unauthorized unless current_user

    @inquiry = PropertyInquiry.find(params[:id])

    # テナント権限チェック
    unless authorized_for_inquiry?(@inquiry)
      return render json: { error: "この問い合わせを編集する権限がありません" }, status: :forbidden
    end

    # 変更者を設定（対応履歴に記録するため）
    @inquiry.changed_by = current_user

    if @inquiry.update(update_params)
      render json: {
        success: true,
        inquiry: {
          id: @inquiry.id,
          status: @inquiry.status,
          status_label: @inquiry.status_label
        }
      }
    else
      render json: { errors: @inquiry.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: "問い合わせが見つかりませんでした" }, status: :not_found
  end

  # POST /api/v1/property_inquiries/:id/change_deal_status (認証必要)
  def change_deal_status
    return render json: { error: "認証が必要です" }, status: :unauthorized unless current_user

    @inquiry = PropertyInquiry.find(params[:id])

    unless authorized_for_inquiry?(@inquiry)
      return render json: { error: "この問い合わせを編集する権限がありません" }, status: :forbidden
    end

    new_status = params[:deal_status]
    reason = params[:reason]

    unless PropertyInquiry.deal_statuses.key?(new_status)
      return render json: { error: "無効なステータスです" }, status: :unprocessable_entity
    end

    @inquiry.change_deal_status!(new_status, user: current_user, reason: reason)

    render json: {
      success: true,
      message: "商談ステータスを「#{@inquiry.deal_status_label}」に変更しました",
      property_inquiry: {
        id: @inquiry.id,
        deal_status: @inquiry.deal_status,
        deal_status_label: @inquiry.deal_status_label,
        deal_status_changed_at: @inquiry.deal_status_changed_at&.strftime("%Y/%m/%d %H:%M"),
        lost_reason: @inquiry.lost_reason
      }
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "問い合わせが見つかりませんでした" }, status: :not_found
  rescue => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  # POST /api/v1/inquiries/:id/reply (認証必要) - 返信メール送信
  def reply
    return render json: { error: "認証が必要です" }, status: :unauthorized unless current_user

    @inquiry = PropertyInquiry.find(params[:id])

    # テナント権限チェック
    unless authorized_for_inquiry?(@inquiry)
      return render json: { error: "この問い合わせに返信する権限がありません" }, status: :forbidden
    end

    subject = params[:subject]
    body = params[:body]

    if subject.blank? || body.blank?
      return render json: { error: "件名と本文は必須です" }, status: :unprocessable_entity
    end

    # メール送信
    PropertyInquiryMailer.reply_to_customer(@inquiry, subject, body).deliver_later

    # ステータス更新
    @inquiry.update!(
      status: :replied,
      replied_at: Time.current,
      reply_message: body
    )

    render json: {
      success: true,
      message: "返信メールを送信しました",
      inquiry: @inquiry.as_json(
        methods: [ :formatted_created_at, :formatted_replied_at ],
        only: [ :id, :status, :replied_at ]
      )
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "問い合わせが見つかりませんでした" }, status: :not_found
  rescue => e
    Rails.logger.error "Failed to send reply email: #{e.message}"
    render json: { error: "返信メールの送信に失敗しました" }, status: :internal_server_error
  end

  private

  def authorized_for_inquiry?(inquiry)
    # room経由でテナント権限をチェック（room_idは必須）
    building = inquiry.room&.building
    return false unless building

    building.tenant_id == current_user.tenant_id
  end

  def property_inquiry_params
    params.require(:property_inquiry).permit(:name, :email, :phone, :message, :source, :utm_source, :utm_medium, :utm_campaign, :referrer, :source_type, :source_url)
  end

  def update_params
    params.require(:property_inquiry).permit(:status, :deal_status, :priority, :assigned_user_id)
  end

  def send_notification_emails(property_inquiry)
    # 管理者への通知メール
    PropertyInquiryMailer.notify_admin(property_inquiry).deliver_later

    # 顧客への自動返信メール
    PropertyInquiryMailer.confirm_to_customer(property_inquiry).deliver_later
  rescue => e
    # メール送信エラーはログに記録するが、レスポンスには影響させない
    Rails.logger.error "Failed to send inquiry notification emails: #{e.message}"
  end

  # 問い合わせJSON（顧客・アクセス情報含む）
  def inquiry_with_customer_json(inquiry)
    {
      id: inquiry.id,
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone,
      message: inquiry.message,
      source: inquiry.source,
      source_type: inquiry.source_type,
      channel: inquiry.channel,
      status: inquiry.status,
      utm_source: inquiry.utm_source,
      utm_medium: inquiry.utm_medium,
      utm_campaign: inquiry.utm_campaign,
      referrer: inquiry.referrer,
      created_at: inquiry.created_at,
      formatted_created_at: inquiry.formatted_created_at,
      formatted_replied_at: inquiry.formatted_replied_at,
      customer: customer_summary_json(inquiry.customer),
      customer_accesses: inquiry.customer_accesses.map { |access| access_summary_json(access) }
    }
  end

  # 問い合わせJSON（物件情報含む版）
  def inquiry_with_publication_json(inquiry)
    publication = inquiry.property_publication
    room = inquiry.room
    building = room&.building

    inquiry_with_customer_json(inquiry).merge(
      source_url: inquiry.source_url,
      replied_at: inquiry.replied_at,
      reply_message: inquiry.reply_message,
      # 新しいフィールド
      media_type: inquiry.media_type,
      media_type_label: inquiry.media_type_label,
      origin_type: inquiry.origin_type,
      origin_type_label: inquiry.origin_type_label,
      status_label: inquiry.status_label,
      deal_status: inquiry.deal_status,
      deal_status_label: inquiry.deal_status_label,
      deal_status_changed_at: inquiry.deal_status_changed_at&.strftime("%Y/%m/%d %H:%M"),
      priority: inquiry.priority,
      priority_label: inquiry.priority_label,
      lost_reason: inquiry.lost_reason,
      property_title: inquiry.property_title,
      inquiry_id: inquiry.inquiry_id,
      assigned_user: inquiry.assigned_user ? {
        id: inquiry.assigned_user.id,
        name: inquiry.assigned_user.name
      } : nil,
      room: room ? {
        id: room.id,
        room_number: room.room_number,
        building_id: room.building_id,
        building_name: building&.name,
        building_address: building&.address
      } : nil,
      property_publication: publication ? {
        id: publication.id,
        title: publication.title,
        publication_id: publication.publication_id,
        room: publication.room ? {
          id: publication.room.id,
          room_number: publication.room.room_number,
          building: publication.room.building ? {
            id: publication.room.building.id,
            name: publication.room.building.name,
            address: publication.room.building.address
          } : nil
        } : nil
      } : nil
    )
  end

  def customer_summary_json(customer)
    return nil unless customer

    {
      id: customer.id,
      name: customer.name,
      inquiry_count: customer.property_inquiries.size,
      has_other_inquiries: customer.property_inquiries.size > 1,
      has_line: customer.line_user_id.present?
    }
  end

  def access_summary_json(access)
    {
      id: access.id,
      access_token: access.access_token,
      status: access.status,
      expires_at: access.formatted_expires_at,
      view_count: access.view_count,
      created_at: access.created_at.strftime("%Y/%m/%d")
    }
  end
end
