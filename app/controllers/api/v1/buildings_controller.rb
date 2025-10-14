class Api::V1::BuildingsController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :set_building, only: [:show, :update, :destroy]

  # GET /api/v1/buildings
  def index
    @buildings = current_tenant.buildings.kept.includes(:rooms)

    # 検索条件によるフィルタリング
    @buildings = @buildings.where("name LIKE ?", "%#{params[:name]}%") if params[:name].present?
    @buildings = @buildings.where("address LIKE ?", "%#{params[:address]}%") if params[:address].present?
    @buildings = @buildings.where(building_type: params[:building_type]) if params[:building_type].present?
    @buildings = @buildings.where("total_units >= ?", params[:min_rooms]) if params[:min_rooms].present?
    @buildings = @buildings.where("total_units <= ?", params[:max_rooms]) if params[:max_rooms].present?

    # 空室有無のフィルタ
    if params[:has_vacancy].present?
      if params[:has_vacancy] == 'true'
        @buildings = @buildings.select { |b| b.rooms.where(status: :vacant).count > 0 }
      elsif params[:has_vacancy] == 'false'
        @buildings = @buildings.select { |b| b.rooms.where(status: :vacant).count == 0 }
      end
    end

    @buildings = @buildings.order(created_at: :desc)

    # 空室数・空室率を含めて返す
    render json: @buildings.as_json(methods: [:room_cnt, :free_cnt])
  end

  # GET /api/v1/buildings/:id
  def show
    render json: @building.as_json(include: {
      rooms: {
        methods: [:status_label, :room_type_label]
      },
      owners: {}
    })
  end

  # POST /api/v1/buildings
  def create
    @building = current_tenant.buildings.build(building_params)

    if @building.save
      render json: @building, status: :created
    else
      render json: { errors: @building.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/buildings/:id
  def update
    if @building.update(building_params)
      render json: @building
    else
      render json: { errors: @building.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/buildings/:id (論理削除)
  def destroy
    if @building.discard
      render json: {
        success: true,
        message: '物件を削除しました',
        deleted_at: @building.discarded_at
      }
    else
      render json: {
        success: false,
        error: '削除に失敗しました'
      }, status: :unprocessable_entity
    end
  end

  # GET /api/v1/buildings/archived (削除済み物件一覧)
  def archived
    @buildings = current_tenant.buildings.discarded.includes(:rooms).order(discarded_at: :desc)
    render json: @buildings.as_json(methods: [:room_cnt, :free_cnt])
  end

  # POST /api/v1/buildings/:id/restore (物件の復元)
  def restore
    @building = current_tenant.buildings.discarded.find(params[:id])

    if @building.undiscard
      render json: {
        success: true,
        message: '物件を復元しました'
      }
    else
      render json: {
        success: false,
        error: '復元に失敗しました'
      }, status: :unprocessable_entity
    end
  end

  private

  def set_building
    @building = current_tenant.buildings.find(params[:id])
  end

  def building_params
    params.require(:building).permit(
      :name,
      :address,
      :latitude,
      :longitude,
      :building_type,
      :total_units,
      :built_year,
      :description,
      :postcode,
      :structure,
      :floors
    )
  end

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end
end
