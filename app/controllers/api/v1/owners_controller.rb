class Api::V1::OwnersController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :set_building
  before_action :set_owner, only: [:show, :update, :destroy]

  # GET /api/v1/buildings/:building_id/owners
  def index
    @owners = @building.owners.order(is_primary: :desc, created_at: :asc)
    render json: @owners
  end

  # GET /api/v1/buildings/:building_id/owners/:id
  def show
    render json: @owner
  end

  # POST /api/v1/buildings/:building_id/owners
  def create
    @owner = @building.owners.build(owner_params)
    @owner.tenant = current_tenant

    if @owner.save
      render json: @owner, status: :created
    else
      render json: { errors: @owner.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/buildings/:building_id/owners/:id
  def update
    if @owner.update(owner_params)
      render json: @owner
    else
      render json: { errors: @owner.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/buildings/:building_id/owners/:id
  def destroy
    @owner.destroy
    head :no_content
  end

  private

  def set_building
    @building = current_tenant.buildings.find(params[:building_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: '建物(土地)が見つかりません' }, status: :not_found
  end

  def set_owner
    @owner = @building.owners.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: '家主が見つかりません' }, status: :not_found
  end

  def owner_params
    params.require(:owner).permit(
      :name,
      :phone,
      :email,
      :address,
      :notes,
      :is_primary
    )
  end

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end
end
