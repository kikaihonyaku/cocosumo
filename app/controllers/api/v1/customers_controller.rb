class Api::V1::CustomersController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :set_customer, only: [ :show, :update, :destroy, :inquiries, :accesses, :create_inquiry, :send_email ]

  # GET /api/v1/customers
  def index
    @customers = current_user.tenant.customers.recent

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

    # 商談ステータスフィルタ（PropertyInquiry経由）
    if params[:deal_status].present?
      @customers = @customers.joins(:property_inquiries).where(property_inquiries: { deal_status: params[:deal_status] }).distinct
    end

    # 優先度フィルタ（PropertyInquiry経由）
    if params[:priority].present?
      @customers = @customers.joins(:property_inquiries).where(property_inquiries: { priority: params[:priority] }).distinct
    end

    # アクティブな商談のみ
    if params[:active_only] == "true"
      @customers = @customers.joins(:property_inquiries).merge(PropertyInquiry.active_deals).distinct
    end

    # ページネーション
    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 50).to_i
    offset = (page - 1) * per_page

    total_count = @customers.count
    @customers = @customers
                   .includes(property_inquiries: :assigned_user)
                   .includes(:customer_accesses)
                   .limit(per_page).offset(offset)

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
    @customer = current_user.tenant.customers
                  .includes(property_inquiries: [:assigned_user, :property_publication], customer_accesses: [], inquiries: [])
                  .find(@customer.id)
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
    customer_inquiries = @customer.inquiries
                                  .includes(:assigned_user, property_inquiries: [ :assigned_user, { room: :building } ])
                                  .recent

    render json: customer_inquiries.map { |i| inquiry_json(i) }
  end

  # GET /api/v1/customers/:id/accesses
  def accesses
    accesses = @customer.customer_accesses
                        .includes(property_publication: { room: :building })
                        .recent

    render json: accesses.map { |a| access_json(a) }
  end

  # POST /api/v1/customers/:id/create_inquiry
  # 顧客詳細画面から新規案件を作成
  # room_id がある場合は Inquiry + PropertyInquiry を作成
  # room_id がない場合は Inquiry のみ作成（一般問い合わせ）
  def create_inquiry
    room = nil
    if params[:room_id].present?
      room = Room.find(params[:room_id])

      # テナント権限チェック
      unless room.building&.tenant_id == current_user.tenant_id
        return render json: { error: "この物件への案件を作成する権限がありません" }, status: :forbidden
      end
    end

    # 担当者の検証（指定されていれば同じテナントのユーザーか確認）
    assigned_user = nil
    if params[:assigned_user_id].present?
      assigned_user = current_user.tenant.users.find_by(id: params[:assigned_user_id])
    end

    ActiveRecord::Base.transaction do
      # Inquiry（案件）を作成
      @inquiry = current_user.tenant.inquiries.create!(
        customer: @customer,
        notes: params[:message],
        assigned_user: assigned_user
      )

      # room_id がある場合のみ PropertyInquiry を作成
      if room
        # 任意でproperty_publicationを関連付け
        property_publication = nil
        if params[:property_publication_id].present?
          property_publication = PropertyPublication.kept.find_by(id: params[:property_publication_id], room_id: room.id)
        end

        property_inquiry = PropertyInquiry.new(
          room: room,
          property_publication: property_publication,
          customer: @customer,
          inquiry: @inquiry,
          name: @customer.name,
          email: @customer.email.presence || "noreply@example.com",
          phone: @customer.phone,
          message: params[:message].presence || "",
          media_type: params[:media_type] || :other_media,
          origin_type: params[:origin_type] || :staff_proposal,
          status: :pending,
          deal_status: :new_inquiry,
          priority: params[:priority] || :normal,
          assigned_user: assigned_user,
          channel: :web_form,
          source: params[:source] || "staff_created"
        )

        property_inquiry.changed_by = current_user
        property_inquiry.save!
      end
    end

    render json: {
      success: true,
      message: "案件を作成しました",
      inquiry: inquiry_json(@inquiry.reload)
    }, status: :created
  rescue ActiveRecord::RecordNotFound
    render json: { error: "物件が見つかりませんでした" }, status: :not_found
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: [ e.message ] }, status: :unprocessable_entity
  end

  # POST /api/v1/customers/:id/send_email
  # 顧客詳細画面からメールを送信し、対応履歴に記録
  def send_email
    subject = params[:subject].to_s.strip
    body = params[:body].to_s.strip
    inquiry_id = params[:inquiry_id]

    if subject.blank? || body.blank?
      return render json: { errors: [ "件名と本文は必須です" ] }, status: :unprocessable_entity
    end

    if @customer.email.blank?
      return render json: { errors: [ "顧客のメールアドレスが登録されていません" ] }, status: :unprocessable_entity
    end

    if current_user.store&.email.blank?
      return render json: { errors: [ "店舗のメールアドレスが設定されていません。管理者に連絡してください。" ] }, status: :unprocessable_entity
    end

    inquiry = @customer.inquiries.find_by(id: inquiry_id)
    unless inquiry
      return render json: { errors: [ "案件が見つかりませんでした" ] }, status: :unprocessable_entity
    end

    CustomerMailer.send_to_customer(@customer, current_user, subject, body, inquiry).deliver_later

    @customer.add_activity!(
      activity_type: :email,
      direction: :outbound,
      inquiry: inquiry,
      user: current_user,
      subject: subject,
      content: body
    )

    render json: { success: true, message: "メールを送信しました" }
  end

  private

  def set_customer
    @customer = current_user.tenant.customers.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "顧客が見つかりませんでした" }, status: :not_found
  end

  def customer_params
    params.require(:customer).permit(
      :name, :email, :phone, :notes, :status,
      :expected_move_date, :budget_min, :budget_max, :requirements,
      preferred_areas: []
    )
  end

  def customer_summary_json(customer)
    # プリロード済みの関連データを使用（N+1回避）
    pis = customer.property_inquiries.sort_by(&:created_at).reverse
    latest_pi = pis.first
    {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
      deal_status: latest_pi&.deal_status,
      deal_status_label: latest_pi&.deal_status_label,
      priority: latest_pi&.priority,
      priority_label: latest_pi&.priority_label,
      assigned_user: latest_pi&.assigned_user ? {
        id: latest_pi.assigned_user.id,
        name: latest_pi.assigned_user.name
      } : nil,
      inquiry_count: pis.size,
      access_count: customer.customer_accesses.size,
      last_inquiry_at: pis.first&.created_at&.strftime("%Y/%m/%d %H:%M"),
      last_contacted_at: customer.last_contacted_at&.strftime("%Y/%m/%d %H:%M"),
      created_at: customer.created_at.strftime("%Y/%m/%d"),
      has_line: customer.line_user_id.present?
    }
  end

  def customer_detail_json(customer)
    # プリロード済みの関連データを使用（N+1回避）
    pis = customer.property_inquiries.sort_by(&:created_at).reverse
    latest_pi = pis.first
    inquiries_sorted = customer.inquiries.sort_by(&:created_at).reverse
    # プリロード済みのproperty_publicationからタイトルを取得（N+1回避）
    property_titles = pis.filter_map { |pi| pi.property_publication&.title }.uniq
    {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      line_user_id: customer.line_user_id.present?,
      notes: customer.notes,
      status: customer.status,
      deal_status: latest_pi&.deal_status,
      deal_status_label: latest_pi&.deal_status_label,
      deal_status_changed_at: latest_pi&.deal_status_changed_at&.strftime("%Y/%m/%d %H:%M"),
      priority: latest_pi&.priority,
      priority_label: latest_pi&.priority_label,
      assigned_user: latest_pi&.assigned_user ? {
        id: latest_pi.assigned_user.id,
        name: latest_pi.assigned_user.name
      } : nil,
      latest_inquiry_id: inquiries_sorted.first&.id,
      expected_move_date: customer.expected_move_date&.strftime("%Y/%m/%d"),
      budget_min: customer.budget_min,
      budget_max: customer.budget_max,
      preferred_areas: customer.preferred_areas,
      requirements: customer.requirements,
      lost_reason: latest_pi&.lost_reason,
      inquiry_count: pis.size,
      access_count: customer.customer_accesses.size,
      last_inquiry_at: pis.first&.created_at&.strftime("%Y/%m/%d %H:%M"),
      last_contacted_at: customer.last_contacted_at&.strftime("%Y/%m/%d %H:%M"),
      created_at: customer.created_at.strftime("%Y/%m/%d %H:%M"),
      inquired_properties: property_titles
    }
  end

  def inquiry_json(inquiry)
    {
      id: inquiry.id,
      status: inquiry.status,
      status_label: inquiry.status_label,
      notes: inquiry.notes,
      assigned_user: inquiry.assigned_user ? {
        id: inquiry.assigned_user.id,
        name: inquiry.assigned_user.name
      } : nil,
      property_inquiries: inquiry.property_inquiries.map { |pi|
        {
          id: pi.id,
          property_title: pi.property_title,
          media_type: pi.media_type,
          media_type_label: pi.media_type_label,
          origin_type: pi.origin_type,
          origin_type_label: pi.origin_type_label,
          status: pi.status,
          status_label: pi.status_label,
          deal_status: pi.deal_status,
          deal_status_label: pi.deal_status_label,
          deal_status_changed_at: pi.deal_status_changed_at&.strftime("%Y/%m/%d %H:%M"),
          priority: pi.priority,
          priority_label: pi.priority_label,
          lost_reason: pi.lost_reason,
          assigned_user: pi.assigned_user ? {
            id: pi.assigned_user.id,
            name: pi.assigned_user.name
          } : nil,
          channel: pi.channel,
          message: pi.message,
          created_at: pi.formatted_created_at,
          room: pi.room ? {
            id: pi.room.id,
            room_number: pi.room.room_number,
            building_id: pi.room.building_id,
            building_name: pi.room.building&.name
          } : nil
        }
      },
      created_at: inquiry.created_at.strftime("%Y/%m/%d %H:%M"),
      updated_at: inquiry.updated_at.strftime("%Y/%m/%d %H:%M")
    }
  end

  def access_json(access)
    publication = access.property_publication
    {
      id: access.id,
      access_token: access.access_token,
      status: access.status,
      view_count: access.view_count,
      expires_at: access.formatted_expires_at,
      days_until_expiry: access.days_until_expiry,
      created_at: access.created_at.strftime("%Y/%m/%d"),
      property_publication: {
        id: publication.id,
        room_id: publication.room_id,
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
