class Api::V1::CustomersController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :set_customer, only: [:show, :update, :destroy, :inquiries, :accesses, :change_status]

  # GET /api/v1/customers
  def index
    @customers = current_user.tenant.customers
                             .includes(:property_inquiries, :customer_accesses, :assigned_user)
                             .recent

    # 検索フィルタ
    if params[:query].present?
      query = "%#{params[:query]}%"
      @customers = @customers.where(
        "customers.name ILIKE ? OR customers.email ILIKE ? OR customers.phone ILIKE ?",
        query, query, query
      )
    end

    # ステータスフィルタ
    if params[:status].present?
      @customers = @customers.where(status: params[:status])
    end

    # 商談ステータスフィルタ
    if params[:deal_status].present?
      @customers = @customers.where(deal_status: params[:deal_status])
    end

    # 優先度フィルタ
    if params[:priority].present?
      @customers = @customers.where(priority: params[:priority])
    end

    # アクティブな商談のみ
    if params[:active_only] == 'true'
      @customers = @customers.active_deals
    end

    # ページネーション
    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 50).to_i
    offset = (page - 1) * per_page

    total_count = @customers.count
    @customers = @customers.limit(per_page).offset(offset)

    render json: {
      customers: @customers.map { |c| customer_summary_json(c) },
      pagination: {
        current_page: page,
        per_page: per_page,
        total_count: total_count,
        total_pages: (total_count.to_f / per_page).ceil
      }
    }
  end

  # GET /api/v1/customers/:id
  def show
    render json: customer_detail_json(@customer)
  end

  # PATCH /api/v1/customers/:id
  def update
    if @customer.update(customer_params)
      render json: {
        success: true,
        message: "顧客情報を更新しました",
        customer: customer_detail_json(@customer)
      }
    else
      render json: { errors: @customer.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # POST /api/v1/customers/:id/change_status
  def change_status
    new_status = params[:deal_status]
    reason = params[:reason]

    unless Customer.deal_statuses.key?(new_status)
      return render json: { error: '無効なステータスです' }, status: :unprocessable_entity
    end

    @customer.change_deal_status!(new_status, user: current_user, reason: reason)

    render json: {
      success: true,
      message: "ステータスを「#{@customer.deal_status_label}」に変更しました",
      customer: customer_detail_json(@customer)
    }
  rescue => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  # DELETE /api/v1/customers/:id
  def destroy
    # 関連データがある場合はアーカイブ
    if @customer.property_inquiries.any? || @customer.customer_accesses.any?
      @customer.update!(status: :archived)
      render json: { success: true, message: "顧客をアーカイブしました" }
    else
      @customer.destroy!
      render json: { success: true, message: "顧客を削除しました" }
    end
  end

  # GET /api/v1/customers/:id/inquiries
  def inquiries
    inquiries = @customer.property_inquiries
                         .includes(:customer_accesses, property_publication: { room: :building })
                         .recent

    render json: inquiries.map { |i| inquiry_json(i) }
  end

  # GET /api/v1/customers/:id/accesses
  def accesses
    accesses = @customer.customer_accesses
                        .includes(property_publication: { room: :building })
                        .recent

    render json: accesses.map { |a| access_json(a) }
  end

  private

  def set_customer
    @customer = current_user.tenant.customers.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: '顧客が見つかりませんでした' }, status: :not_found
  end

  def customer_params
    params.require(:customer).permit(
      :name, :email, :phone, :notes, :status,
      :priority, :assigned_user_id,
      :expected_move_date, :budget_min, :budget_max, :requirements,
      preferred_areas: []
    )
  end

  def customer_summary_json(customer)
    {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
      deal_status: customer.deal_status,
      deal_status_label: customer.deal_status_label,
      priority: customer.priority,
      priority_label: customer.priority_label,
      assigned_user: customer.assigned_user ? {
        id: customer.assigned_user.id,
        name: customer.assigned_user.name
      } : nil,
      inquiry_count: customer.property_inquiries.size,
      access_count: customer.customer_accesses.size,
      last_inquiry_at: customer.last_inquiry_at&.strftime('%Y/%m/%d %H:%M'),
      last_contacted_at: customer.last_contacted_at&.strftime('%Y/%m/%d %H:%M'),
      created_at: customer.created_at.strftime('%Y/%m/%d'),
      has_line: customer.line_user_id.present?
    }
  end

  def customer_detail_json(customer)
    {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      line_user_id: customer.line_user_id.present?,
      notes: customer.notes,
      status: customer.status,
      deal_status: customer.deal_status,
      deal_status_label: customer.deal_status_label,
      deal_status_changed_at: customer.deal_status_changed_at&.strftime('%Y/%m/%d %H:%M'),
      priority: customer.priority,
      priority_label: customer.priority_label,
      assigned_user: customer.assigned_user ? {
        id: customer.assigned_user.id,
        name: customer.assigned_user.name
      } : nil,
      expected_move_date: customer.expected_move_date&.strftime('%Y/%m/%d'),
      budget_min: customer.budget_min,
      budget_max: customer.budget_max,
      preferred_areas: customer.preferred_areas,
      requirements: customer.requirements,
      lost_reason: customer.lost_reason,
      inquiry_count: customer.property_inquiries.count,
      access_count: customer.customer_accesses.count,
      last_inquiry_at: customer.last_inquiry_at&.strftime('%Y/%m/%d %H:%M'),
      last_contacted_at: customer.last_contacted_at&.strftime('%Y/%m/%d %H:%M'),
      created_at: customer.created_at.strftime('%Y/%m/%d %H:%M'),
      inquired_properties: customer.inquired_property_titles
    }
  end

  def inquiry_json(inquiry)
    publication = inquiry.property_publication
    {
      id: inquiry.id,
      message: inquiry.message,
      channel: inquiry.channel,
      status: inquiry.status,
      created_at: inquiry.formatted_created_at,
      property_publication: {
        id: publication.id,
        title: publication.title,
        building_name: publication.room&.building&.name,
        room_number: publication.room&.room_number
      },
      customer_accesses: inquiry.customer_accesses.map do |access|
        {
          id: access.id,
          status: access.status,
          created_at: access.created_at.strftime('%Y/%m/%d')
        }
      end
    }
  end

  def access_json(access)
    publication = access.property_publication
    {
      id: access.id,
      status: access.status,
      view_count: access.view_count,
      expires_at: access.formatted_expires_at,
      days_until_expiry: access.days_until_expiry,
      created_at: access.created_at.strftime('%Y/%m/%d'),
      property_publication: {
        id: publication.id,
        title: publication.title,
        building_name: publication.room&.building&.name,
        room_number: publication.room&.room_number
      },
      from_inquiry: access.property_inquiry_id.present?
    }
  end

  def require_login
    unless current_user
      render json: { error: "認証が必要です" }, status: :unauthorized
    end
  end
end
