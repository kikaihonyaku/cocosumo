class Api::V1::CustomerActivitiesController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :set_customer
  before_action :set_activity, only: [ :update, :destroy ]

  # GET /api/v1/customers/:customer_id/activities
  def index
    @activities = @customer.customer_activities
                           .includes(:user, :inquiry, :property_inquiry, :customer_access, :property_publication)
                           .recent
                           .limit(100)

    render json: @activities.map { |a| activity_json(a) }
  end

  # POST /api/v1/customers/:customer_id/activities
  def create
    @activity = @customer.customer_activities.build(activity_params)
    @activity.user = current_user

    if @activity.save
      render json: {
        success: true,
        message: "対応履歴を追加しました",
        activity: activity_json(@activity)
      }, status: :created
    else
      render json: { errors: @activity.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /api/v1/customers/:customer_id/activities/:id
  def update
    if @activity.update(activity_params)
      render json: {
        success: true,
        message: "対応履歴を更新しました",
        activity: activity_json(@activity)
      }
    else
      render json: { errors: @activity.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/customers/:customer_id/activities/:id
  def destroy
    @activity.destroy!
    render json: { success: true, message: "対応履歴を削除しました" }
  end

  private

  def require_login
    unless current_user
      render json: { error: "認証が必要です" }, status: :unauthorized
    end
  end

  def set_customer
    @customer = current_user.tenant.customers.find(params[:customer_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "顧客が見つかりませんでした" }, status: :not_found
  end

  def set_activity
    @activity = @customer.customer_activities.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "対応履歴が見つかりませんでした" }, status: :not_found
  end

  def activity_params
    params.require(:activity).permit(
      :activity_type, :direction, :subject, :content,
      :inquiry_id, :property_inquiry_id, :customer_access_id, :property_publication_id
    )
  end

  def activity_json(activity)
    {
      id: activity.id,
      activity_type: activity.activity_type,
      activity_type_label: activity.activity_type_label,
      direction: activity.direction,
      direction_label: activity.direction_label,
      icon_name: activity.icon_name,
      subject: activity.subject,
      content: activity.content,
      inquiry_id: activity.inquiry_id,
      property_inquiry_id: activity.property_inquiry_id,
      user: activity.user ? {
        id: activity.user.id,
        name: activity.user.name
      } : nil,
      inquiry: activity.inquiry ? {
        id: activity.inquiry.id,
        status: activity.inquiry.status,
        status_label: activity.inquiry.status_label
      } : nil,
      property_inquiry: activity.property_inquiry ? {
        id: activity.property_inquiry.id,
        property_title: activity.property_inquiry.property_publication&.title
      } : nil,
      customer_access: activity.customer_access ? {
        id: activity.customer_access.id,
        property_title: activity.customer_access.property_publication&.title
      } : nil,
      property_publication: activity.property_publication ? {
        id: activity.property_publication.id,
        title: activity.property_publication.title
      } : nil,
      created_at: activity.created_at,
      formatted_created_at: activity.formatted_created_at,
      formatted_date: activity.formatted_date
    }
  end
end
