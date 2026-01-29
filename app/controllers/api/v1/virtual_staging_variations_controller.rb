class Api::V1::VirtualStagingVariationsController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :set_virtual_staging
  before_action :set_variation, only: [:update, :destroy]

  # POST /api/v1/virtual_stagings/:virtual_staging_id/variations
  def create
    @variation = @virtual_staging.variations.build(variation_params)

    # display_orderを自動設定（最後に追加）
    max_order = @virtual_staging.variations.maximum(:display_order) || -1
    @variation.display_order = max_order + 1

    if @variation.save
      render json: @variation.as_json(
        only: [:id, :style_name, :display_order, :after_photo_id],
        methods: [:after_photo_url]
      ), status: :created
    else
      render json: { errors: @variation.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/virtual_stagings/:virtual_staging_id/variations/:id
  def update
    if @variation.update(variation_params)
      render json: @variation.as_json(
        only: [:id, :style_name, :display_order, :after_photo_id],
        methods: [:after_photo_url]
      )
    else
      render json: { errors: @variation.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/virtual_stagings/:virtual_staging_id/variations/:id
  def destroy
    if @variation.destroy
      render json: { success: true, message: 'バリエーションを削除しました' }
    else
      render json: { success: false, error: '削除に失敗しました' }, status: :unprocessable_entity
    end
  end

  # POST /api/v1/virtual_stagings/:virtual_staging_id/variations/reorder
  def reorder
    params[:order].each_with_index do |id, index|
      @virtual_staging.variations.find(id).update(display_order: index)
    end
    render json: { success: true }
  end

  private

  def set_virtual_staging
    @virtual_staging = VirtualStaging.joins(room: :building)
                                      .where(buildings: { tenant_id: current_user.tenant_id })
                                      .find(params[:virtual_staging_id])
  end

  def set_variation
    @variation = @virtual_staging.variations.find(params[:id])
  end

  def variation_params
    params.require(:variation).permit(:after_photo_id, :style_name, :display_order)
  end

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end
end
