class Api::V1::LineTemplatesController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :set_line_template, only: [ :update, :destroy ]

  # GET /api/v1/line_templates
  def index
    templates = current_user.tenant.line_templates.kept.ordered
    render json: templates.map { |t| template_json(t) }
  end

  # POST /api/v1/line_templates
  def create
    template = current_user.tenant.line_templates.build(template_params)

    if template.save
      render json: { success: true, template: template_json(template) }, status: :created
    else
      render json: { errors: template.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /api/v1/line_templates/:id
  def update
    if @template.update(template_params)
      render json: { success: true, template: template_json(@template) }
    else
      render json: { errors: @template.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/line_templates/:id
  def destroy
    @template.update!(discarded_at: Time.current)
    render json: { success: true }
  end

  private

  def set_line_template
    @template = current_user.tenant.line_templates.kept.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "テンプレートが見つかりませんでした" }, status: :not_found
  end

  def template_params
    params.require(:line_template).permit(:name, :message_type, :content, :image_url, :flex_alt_text, :position)
  end

  def template_json(template)
    {
      id: template.id,
      name: template.name,
      message_type: template.message_type,
      content: template.content,
      image_url: template.image_url,
      flex_alt_text: template.flex_alt_text,
      position: template.position
    }
  end
end
