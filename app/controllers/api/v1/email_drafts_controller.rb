class Api::V1::EmailDraftsController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :set_customer
  before_action :set_draft, only: [:update, :destroy]

  # GET /api/v1/customers/:customer_id/email_drafts
  def index
    drafts = @customer.email_drafts
                      .where(user: current_user)
                      .recent
                      .limit(5)

    render json: drafts.map { |d| draft_json(d) }
  end

  # POST /api/v1/customers/:customer_id/email_drafts
  def create
    draft = @customer.email_drafts.new(draft_params)
    draft.tenant = current_user.tenant
    draft.user = current_user

    if draft.save
      render json: draft_json(draft), status: :created
    else
      render json: { errors: draft.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /api/v1/customers/:customer_id/email_drafts/:id
  def update
    if @draft.update(draft_params)
      render json: draft_json(@draft)
    else
      render json: { errors: @draft.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/customers/:customer_id/email_drafts/:id
  def destroy
    @draft.destroy!
    render json: { success: true }
  end

  private

  def set_customer
    @customer = current_user.tenant.customers.find(params[:customer_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "顧客が見つかりませんでした" }, status: :not_found
  end

  def set_draft
    @draft = @customer.email_drafts.where(user: current_user).find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "下書きが見つかりませんでした" }, status: :not_found
  end

  def draft_params
    params.permit(:subject, :body, :body_format, :inquiry_id, metadata: {})
  end

  def draft_json(draft)
    {
      id: draft.id,
      subject: draft.subject,
      body: draft.body,
      body_format: draft.body_format,
      inquiry_id: draft.inquiry_id,
      metadata: draft.metadata,
      updated_at: draft.updated_at.strftime("%Y/%m/%d %H:%M")
    }
  end

  def require_login
    unless current_user
      render json: { error: "認証が必要です" }, status: :unauthorized
    end
  end
end
