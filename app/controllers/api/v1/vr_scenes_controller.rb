class Api::V1::VrScenesController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :set_vr_tour
  before_action :set_vr_scene, only: [:show, :update, :destroy, :reorder]

  # GET /api/v1/vr_tours/:vr_tour_id/vr_scenes
  def index
    @vr_scenes = @vr_tour.vr_scenes.includes(:room_photo)
    render json: @vr_scenes.as_json(
      methods: [:photo_url],
      include: {
        room_photo: {
          only: [:id, :photo_type, :caption]
        }
      }
    )
  end

  # GET /api/v1/vr_tours/:vr_tour_id/vr_scenes/:id
  def show
    render json: @vr_scene.as_json(
      methods: [:photo_url],
      include: {
        room_photo: {
          only: [:id, :photo_type, :caption]
        }
      }
    )
  end

  # POST /api/v1/vr_tours/:vr_tour_id/vr_scenes
  def create
    @vr_scene = @vr_tour.vr_scenes.build(vr_scene_params)

    # 自動的に最後の順序を設定
    if @vr_scene.display_order.nil?
      max_order = @vr_tour.vr_scenes.maximum(:display_order) || 0
      @vr_scene.display_order = max_order + 1
    end

    if @vr_scene.save
      render json: @vr_scene.as_json(methods: [:photo_url]), status: :created
    else
      render json: { errors: @vr_scene.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/vr_tours/:vr_tour_id/vr_scenes/:id
  def update
    if @vr_scene.update(vr_scene_params)
      render json: @vr_scene.as_json(methods: [:photo_url])
    else
      render json: { errors: @vr_scene.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/vr_tours/:vr_tour_id/vr_scenes/:id
  def destroy
    if @vr_scene.destroy
      # 残りのシーンの順序を詰める
      @vr_tour.vr_scenes.unscoped.where('display_order > ?', @vr_scene.display_order).each do |scene|
        scene.update(display_order: scene.display_order - 1)
      end

      render json: { success: true, message: 'シーンを削除しました' }
    else
      render json: { success: false, error: '削除に失敗しました' }, status: :unprocessable_entity
    end
  end

  # POST /api/v1/vr_tours/:vr_tour_id/vr_scenes/:id/reorder
  def reorder
    new_order = params[:new_order].to_i
    old_order = @vr_scene.display_order

    return render json: { success: true } if new_order == old_order

    if new_order > old_order
      # 下に移動：間のシーンを上に
      @vr_tour.vr_scenes.unscoped.where('display_order > ? AND display_order <= ?', old_order, new_order).each do |scene|
        scene.update(display_order: scene.display_order - 1)
      end
    else
      # 上に移動：間のシーンを下に
      @vr_tour.vr_scenes.unscoped.where('display_order >= ? AND display_order < ?', new_order, old_order).each do |scene|
        scene.update(display_order: scene.display_order + 1)
      end
    end

    @vr_scene.update(display_order: new_order)

    render json: { success: true, message: 'シーンの順序を変更しました' }
  end

  private

  def set_vr_tour
    @vr_tour = VrTour.find(params[:vr_tour_id])
  end

  def set_vr_scene
    @vr_scene = @vr_tour.vr_scenes.unscoped.find(params[:id])
  end

  def vr_scene_params
    params.require(:vr_scene).permit(
      :room_photo_id,
      :title,
      :display_order,
      initial_view: {},
      hotspots: [:id, :text, :yaw, :pitch, :tooltip, :html, data: {}],
      minimap_position: {}
    )
  end

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end
end
