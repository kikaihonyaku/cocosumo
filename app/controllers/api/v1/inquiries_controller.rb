class Api::V1::InquiriesController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :set_inquiry, only: [ :show, :update, :change_status ]

  # GET /api/v1/inquiries
  def index
    @inquiries = current_user.tenant.inquiries
                              .includes(:customer, :assigned_user, property_inquiries: { room: :building })
                              .recent

    if params[:deal_status].present?
      @inquiries = @inquiries.by_deal_status(params[:deal_status])
    end

    if params[:priority].present?
      @inquiries = @inquiries.by_priority(params[:priority])
    end

    if params[:assigned_user_id].present?
      @inquiries = @inquiries.where(assigned_user_id: params[:assigned_user_id])
    end

    if params[:customer_id].present?
      @inquiries = @inquiries.where(customer_id: params[:customer_id])
    end

    # ページネーション
    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 50).to_i
    offset = (page - 1) * per_page

    total_count = @inquiries.count
    @inquiries = @inquiries.limit(per_page).offset(offset)

    render json: {
      inquiries: @inquiries.map { |i| inquiry_json(i) },
      pagination: {
        current_page: page,
        per_page: per_page,
        total_count: total_count,
        total_pages: (total_count.to_f / per_page).ceil
      }
    }
  end

  # GET /api/v1/inquiries/:id
  def show
    render json: inquiry_detail_json(@inquiry)
  end

  # POST /api/v1/inquiries
  def create
    customer = current_user.tenant.customers.find(params[:customer_id])

    @inquiry = current_user.tenant.inquiries.build(
      customer: customer,
      assigned_user_id: params[:assigned_user_id],
      deal_status: params[:deal_status] || :new_inquiry,
      priority: params[:priority] || :normal,
      notes: params[:notes]
    )

    if @inquiry.save
      render json: {
        success: true,
        message: "案件を作成しました",
        inquiry: inquiry_json(@inquiry)
      }, status: :created
    else
      render json: { errors: @inquiry.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: "顧客が見つかりませんでした" }, status: :not_found
  end

  # PATCH /api/v1/inquiries/:id
  def update
    if @inquiry.update(update_params)
      render json: {
        success: true,
        message: "案件を更新しました",
        inquiry: inquiry_json(@inquiry)
      }
    else
      render json: { errors: @inquiry.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # POST /api/v1/inquiries/:id/change_status
  def change_status
    new_status = params[:deal_status]
    reason = params[:reason]

    unless Inquiry.deal_statuses.key?(new_status)
      return render json: { error: "無効なステータスです" }, status: :unprocessable_entity
    end

    @inquiry.change_deal_status!(new_status, user: current_user, reason: reason)

    render json: {
      success: true,
      message: "ステータスを「#{@inquiry.deal_status_label}」に変更しました",
      inquiry: inquiry_json(@inquiry)
    }
  rescue => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def require_login
    unless current_user
      render json: { error: "認証が必要です" }, status: :unauthorized
    end
  end

  def set_inquiry
    @inquiry = current_user.tenant.inquiries.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "案件が見つかりませんでした" }, status: :not_found
  end

  def update_params
    params.require(:inquiry).permit(:assigned_user_id, :priority, :notes)
  end

  def inquiry_json(inquiry)
    {
      id: inquiry.id,
      deal_status: inquiry.deal_status,
      deal_status_label: inquiry.deal_status_label,
      deal_status_changed_at: inquiry.deal_status_changed_at&.strftime("%Y/%m/%d %H:%M"),
      priority: inquiry.priority,
      priority_label: inquiry.priority_label,
      lost_reason: inquiry.lost_reason,
      notes: inquiry.notes,
      assigned_user: inquiry.assigned_user ? {
        id: inquiry.assigned_user.id,
        name: inquiry.assigned_user.name
      } : nil,
      customer: {
        id: inquiry.customer.id,
        name: inquiry.customer.name
      },
      property_inquiry_count: inquiry.property_inquiries.size,
      created_at: inquiry.created_at.strftime("%Y/%m/%d %H:%M"),
      updated_at: inquiry.updated_at.strftime("%Y/%m/%d %H:%M")
    }
  end

  def inquiry_detail_json(inquiry)
    inquiry_json(inquiry).merge(
      property_inquiries: inquiry.property_inquiries.includes(:room, :property_publication).map { |pi|
        {
          id: pi.id,
          property_title: pi.property_title,
          media_type: pi.media_type,
          media_type_label: pi.media_type_label,
          origin_type: pi.origin_type,
          origin_type_label: pi.origin_type_label,
          status: pi.status,
          status_label: pi.status_label,
          channel: pi.channel,
          message: pi.message,
          created_at: pi.formatted_created_at,
          room: pi.room ? {
            id: pi.room.id,
            room_number: pi.room.room_number,
            building_id: pi.room.building_id,
            building_name: pi.room.building&.name
          } : nil,
          property_publication: pi.property_publication ? {
            id: pi.property_publication.id,
            title: pi.property_publication.title,
            publication_id: pi.property_publication.publication_id
          } : nil
        }
      },
      activities: inquiry.customer_activities.includes(:user).recent.limit(50).map { |a|
        {
          id: a.id,
          activity_type: a.activity_type,
          activity_type_label: a.activity_type_label,
          direction: a.direction,
          direction_label: a.direction_label,
          icon_name: a.icon_name,
          subject: a.subject,
          content: a.content,
          user: a.user ? { id: a.user.id, name: a.user.name } : nil,
          created_at: a.created_at,
          formatted_created_at: a.formatted_created_at
        }
      }
    )
  end
end
