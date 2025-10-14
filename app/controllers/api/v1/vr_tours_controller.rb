class Api::V1::VrToursController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login, except: [:show_public]
  before_action :set_room, only: [:index, :create]
  before_action :set_vr_tour, only: [:show, :update, :destroy, :publish, :unpublish]

  # GET /api/v1/rooms/:room_id/vr_tours
  def index
    @vr_tours = @room.vr_tours.includes(:vr_scenes)
    render json: @vr_tours.as_json(include: {
      vr_scenes: {
        methods: [:photo_url]
      }
    })
  end

  # GET /api/v1/rooms/:room_id/vr_tours/:id
  def show
    render json: @vr_tour.as_json(include: {
      vr_scenes: {
        methods: [:photo_url],
        include: {
          room_photo: {
            only: [:id, :photo_type, :caption]
          }
        }
      }
    }, methods: [:initial_scene])
  end

  # GET /vr/:id (公開用、認証不要)
  def show_public
    @vr_tour = VrTour.find(params[:id])

    if @vr_tour.published?
      render json: @vr_tour.as_json(include: {
        vr_scenes: {
          methods: [:photo_url]
        },
        room: {
          only: [:id, :room_number],
          include: {
            building: {
              only: [:id, :name, :address]
            }
          }
        }
      })
    else
      render json: { error: 'このVRツアーは公開されていません' }, status: :not_found
    end
  end

  # POST /api/v1/rooms/:room_id/vr_tours
  def create
    @vr_tour = @room.vr_tours.build(vr_tour_params)

    if @vr_tour.save
      render json: @vr_tour, status: :created
    else
      render json: { errors: @vr_tour.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/rooms/:room_id/vr_tours/:id
  def update
    if @vr_tour.update(vr_tour_params)
      render json: @vr_tour
    else
      render json: { errors: @vr_tour.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/rooms/:room_id/vr_tours/:id
  def destroy
    if @vr_tour.destroy
      render json: { success: true, message: 'VRツアーを削除しました' }
    else
      render json: { success: false, error: '削除に失敗しました' }, status: :unprocessable_entity
    end
  end

  # POST /api/v1/rooms/:room_id/vr_tours/:id/publish
  def publish
    @vr_tour.published!
    @vr_tour.update(published_at: Time.current)
    render json: { success: true, message: 'VRツアーを公開しました', vr_tour: @vr_tour }
  end

  # POST /api/v1/rooms/:room_id/vr_tours/:id/unpublish
  def unpublish
    @vr_tour.draft!
    render json: { success: true, message: 'VRツアーを非公開にしました', vr_tour: @vr_tour }
  end

  private

  def set_room
    @room = Room.find(params[:room_id])
  end

  def set_vr_tour
    @vr_tour = VrTour.find(params[:id])
  end

  def vr_tour_params
    params.require(:vr_tour).permit(:title, :description, :status, config: {})
  end

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end
end
