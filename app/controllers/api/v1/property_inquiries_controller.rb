class Api::V1::PropertyInquiriesController < ApplicationController
  skip_before_action :verify_authenticity_token

  # POST /api/v1/property_publications/:publication_id/inquiries
  def create
    @property_publication = PropertyPublication.kept.find_by!(publication_id: params[:publication_id])

    unless @property_publication.published?
      render json: { error: 'この物件公開ページは公開されていません' }, status: :not_found
      return
    end

    @property_inquiry = @property_publication.property_inquiries.build(property_inquiry_params)

    if @property_inquiry.save
      # メール通知を非同期で送信
      send_notification_emails(@property_inquiry)

      render json: {
        success: true,
        message: 'お問い合わせを受け付けました。担当者より折り返しご連絡いたします。'
      }, status: :created
    else
      render json: { errors: @property_inquiry.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'この物件公開ページは見つかりませんでした' }, status: :not_found
  end

  # GET /api/v1/property_publications/:property_publication_id/inquiries (認証必要)
  def index
    return render json: { error: '認証が必要です' }, status: :unauthorized unless current_user

    @property_publication = PropertyPublication.kept.find(params[:property_publication_id])
    @property_inquiries = @property_publication.property_inquiries.recent

    render json: @property_inquiries.as_json(
      methods: [:formatted_created_at],
      only: [:id, :name, :email, :phone, :message, :source, :utm_source, :utm_medium, :utm_campaign, :referrer, :created_at]
    )
  rescue ActiveRecord::RecordNotFound
    render json: { error: '物件公開ページが見つかりませんでした' }, status: :not_found
  end

  # GET /api/v1/inquiries/export_csv (認証必要)
  def export_csv
    return render json: { error: '認証が必要です' }, status: :unauthorized unless current_user

    # ユーザーに紐づく物件のみ
    user_publication_ids = PropertyPublication.kept.joins(room: :building)
                                              .where(buildings: { user_id: current_user.id })
                                              .pluck(:id)

    inquiries = PropertyInquiry.where(property_publication_id: user_publication_ids)
                               .includes(:property_publication)
                               .order(created_at: :desc)

    # Date range filter
    if params[:start_date].present?
      inquiries = inquiries.where('created_at >= ?', Date.parse(params[:start_date]).beginning_of_day)
    end
    if params[:end_date].present?
      inquiries = inquiries.where('created_at <= ?', Date.parse(params[:end_date]).end_of_day)
    end

    require 'csv'

    csv_data = CSV.generate(headers: true, force_quotes: true) do |csv|
      csv << ['ID', '問い合わせ日時', '物件名', '名前', 'メール', '電話番号', 'メッセージ', '流入元', 'UTMソース', 'UTMメディア', 'UTMキャンペーン', 'リファラー']

      inquiries.each do |inquiry|
        csv << [
          inquiry.id,
          inquiry.created_at.strftime('%Y-%m-%d %H:%M:%S'),
          inquiry.property_publication.title,
          inquiry.name,
          inquiry.email,
          inquiry.phone,
          inquiry.message&.gsub(/\r?\n/, ' '),
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
              type: 'text/csv; charset=utf-8'
  end

  # GET /api/v1/inquiry_analytics (認証必要)
  def analytics
    return render json: { error: '認証が必要です' }, status: :unauthorized unless current_user

    # 期間パラメータ（デフォルト: 過去30日）
    days = (params[:days] || 30).to_i
    start_date = days.days.ago.beginning_of_day

    # 全問い合わせ（ユーザーに紐づく物件のみ）
    user_publication_ids = PropertyPublication.kept.joins(room: :building)
                                              .where(buildings: { user_id: current_user.id })
                                              .pluck(:id)

    base_query = PropertyInquiry.where(property_publication_id: user_publication_ids)
    period_query = base_query.where('created_at >= ?', start_date)

    # 基本統計
    total_count = period_query.count
    previous_period_count = base_query.where(created_at: (start_date - days.days)..start_date).count

    # ソース別集計
    source_breakdown = period_query.group(:source).count.transform_keys { |k| k || 'unknown' }

    # 日別推移（過去30日）
    daily_trend = period_query.group("DATE(created_at)").count.transform_keys(&:to_s)

    # 週別推移（過去12週）
    weekly_trend = base_query.where('created_at >= ?', 12.weeks.ago)
                             .group("DATE_TRUNC('week', created_at)")
                             .count
                             .transform_keys { |k| k.to_date.to_s }

    # 物件別ランキング（トップ10）
    top_publications = period_query.joins(:property_publication)
                                   .group(:property_publication_id, 'property_publications.title')
                                   .order('count_all DESC')
                                   .limit(10)
                                   .count
                                   .map { |(pub_id, title), count| { id: pub_id, title: title, count: count } }

    # キャンペーン別集計
    campaign_breakdown = period_query.where.not(utm_campaign: [nil, ''])
                                     .group(:utm_campaign)
                                     .count

    # テンプレート別パフォーマンス
    template_performance = period_query.joins(:property_publication)
                                       .group('property_publications.template_type')
                                       .count
                                       .transform_keys { |k| k || 'template1' }

    # テンプレート別の物件数（分母）
    template_publication_counts = PropertyPublication.kept
                                                     .where(id: user_publication_ids)
                                                     .group(:template_type)
                                                     .count

    # テンプレート別パフォーマンス詳細を計算
    template_breakdown = PropertyPublication::template_types.keys.map do |template|
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
                                   .order(created_at: :desc)
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
      recent_inquiries: recent_inquiries
    }
  end

  private

  def property_inquiry_params
    params.require(:property_inquiry).permit(:name, :email, :phone, :message, :source, :utm_source, :utm_medium, :utm_campaign, :referrer)
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
end
