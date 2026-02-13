class Api::V1::UnreadNotificationsController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login

  # GET /api/v1/unread_notifications/count
  # ポーリング用の軽量エンドポイント
  def count
    service = UnreadInquiryService.new(current_user)
    render json: { unread_count: service.unread_count }
  end

  # GET /api/v1/unread_notifications
  # ドロップダウン用の未読案件一覧
  def index
    service = UnreadInquiryService.new(current_user)
    limit = [ (params[:limit] || 20).to_i, 50 ].min

    render json: {
      inquiries: service.unread_inquiries(limit: limit),
      unread_count: service.unread_count
    }
  end

  # POST /api/v1/unread_notifications/mark_read
  # 特定案件を既読にする
  def mark_read
    inquiry = current_user.tenant.inquiries.find(params[:inquiry_id])
    InquiryReadStatus.mark_as_read!(user: current_user, inquiry: inquiry)

    render json: { success: true }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "案件が見つかりませんでした" }, status: :not_found
  end

  # POST /api/v1/unread_notifications/mark_all_read
  # 全件既読にする
  def mark_all_read
    service = UnreadInquiryService.new(current_user)
    inquiry_ids = service.unread_inquiry_ids

    InquiryReadStatus.mark_all_as_read!(user: current_user, inquiry_ids: inquiry_ids)

    render json: { success: true, marked_count: inquiry_ids.size }
  end

  private

  def require_login
    unless current_user
      render json: { error: "認証が必要です" }, status: :unauthorized
    end
  end
end
