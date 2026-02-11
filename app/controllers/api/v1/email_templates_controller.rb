class Api::V1::EmailTemplatesController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :set_email_template, only: [ :update, :destroy ]

  # GET /api/v1/email_templates
  def index
    templates = current_user.tenant.email_templates.kept.ordered
    render json: templates.map { |t| template_json(t) }
  end

  # POST /api/v1/email_templates
  def create
    template = current_user.tenant.email_templates.build(template_params)

    if template.save
      render json: { success: true, template: template_json(template) }, status: :created
    else
      render json: { errors: template.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /api/v1/email_templates/:id
  def update
    if @template.update(template_params)
      render json: { success: true, template: template_json(@template) }
    else
      render json: { errors: @template.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/email_templates/:id
  def destroy
    @template.update!(discarded_at: Time.current)
    render json: { success: true }
  end

  private

  def set_email_template
    @template = current_user.tenant.email_templates.kept.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "テンプレートが見つかりませんでした" }, status: :not_found
  end

  def template_params
    params.require(:email_template).permit(:name, :subject, :body, :position, :body_format)
  end

  def template_json(template)
    {
      id: template.id,
      name: template.name,
      subject: template.subject,
      body: template.body,
      body_format: template.body_format,
      position: template.position
    }
  end
end
