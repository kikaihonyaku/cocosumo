class Api::V1::VirtualStagingsController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login, except: [:show_public]
  before_action :set_room, only: [:index, :create], if: -> { params[:room_id].present? }
  before_action :set_virtual_staging, only: [:show, :update, :destroy, :publish, :unpublish]

  # GET /api/v1/virtual_stagings (全バーチャルステージング一覧)
  # GET /api/v1/rooms/:room_id/virtual_stagings (部屋単位の一覧)
  def index
    if params[:room_id]
      # 部屋単位の一覧
      @virtual_stagings = @room.virtual_stagings.includes(:before_photo, :after_photo)
      render json: @virtual_stagings.as_json(
        only: [:id, :title, :description, :status],
        methods: [:before_photo_url, :after_photo_url, :thumbnail_url]
      )
    else
      # 全バーチャルステージング一覧
      @virtual_stagings = VirtualStaging.includes(:before_photo, :after_photo, room: :building).order(updated_at: :desc)
      render json: @virtual_stagings.as_json(
        include: {
          room: {
            only: [:id, :room_number],
            include: {
              building: {
                only: [:id, :name, :address]
              }
            }
          }
        },
        methods: [:before_photo_url, :after_photo_url, :thumbnail_url]
      )
    end
  end

  # GET /api/v1/rooms/:room_id/virtual_stagings/:id
  def show
    render json: @virtual_staging.as_json(
      include: {
        before_photo: {
          only: [:id, :photo_type, :caption]
        },
        after_photo: {
          only: [:id, :photo_type, :caption]
        },
        room: {
          only: [:id, :room_number],
          include: {
            building: {
              only: [:id, :name, :address]
            }
          }
        },
        variations: {
          only: [:id, :style_name, :display_order, :after_photo_id],
          methods: [:after_photo_url]
        }
      },
      methods: [:before_photo_url, :after_photo_url]
    )
  end

  # GET /api/v1/virtual_stagings/:public_id/public (公開用、認証不要)
  def show_public
    @virtual_staging = VirtualStaging.find_by!(public_id: params[:public_id])

    if @virtual_staging.published?
      render json: @virtual_staging.as_json(
        include: {
          room: {
            only: [:id, :room_number],
            include: {
              building: {
                only: [:id, :name, :address]
              }
            }
          },
          variations: {
            only: [:id, :style_name, :display_order, :after_photo_id],
            methods: [:after_photo_url]
          }
        },
        methods: [:before_photo_url, :after_photo_url]
      )
    else
      render json: { error: 'このバーチャルステージングは公開されていません' }, status: :not_found
    end
  end

  # POST /api/v1/rooms/:room_id/virtual_stagings
  def create
    @virtual_staging = @room.virtual_stagings.build(virtual_staging_params)

    if @virtual_staging.save
      render json: @virtual_staging.as_json(methods: [:before_photo_url, :after_photo_url]), status: :created
    else
      render json: { errors: @virtual_staging.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/rooms/:room_id/virtual_stagings/:id
  def update
    if @virtual_staging.update(virtual_staging_params)
      render json: @virtual_staging.as_json(
        include: {
          room: {
            only: [:id, :room_number],
            include: {
              building: {
                only: [:id, :name, :address]
              }
            }
          }
        },
        methods: [:before_photo_url, :after_photo_url]
      )
    else
      render json: { errors: @virtual_staging.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/rooms/:room_id/virtual_stagings/:id
  def destroy
    if @virtual_staging.destroy
      render json: { success: true, message: 'バーチャルステージングを削除しました' }
    else
      render json: { success: false, error: '削除に失敗しました' }, status: :unprocessable_entity
    end
  end

  # POST /api/v1/rooms/:room_id/virtual_stagings/:id/publish
  def publish
    @virtual_staging.published!
    @virtual_staging.update(published_at: Time.current)
    render json: {
      success: true,
      message: 'バーチャルステージングを公開しました',
      virtual_staging: @virtual_staging.as_json(
        include: {
          room: {
            only: [:id, :room_number],
            include: {
              building: {
                only: [:id, :name, :address]
              }
            }
          }
        },
        methods: [:before_photo_url, :after_photo_url]
      )
    }
  end

  # POST /api/v1/rooms/:room_id/virtual_stagings/:id/unpublish
  def unpublish
    @virtual_staging.draft!
    render json: {
      success: true,
      message: 'バーチャルステージングを非公開にしました',
      virtual_staging: @virtual_staging.as_json(
        include: {
          room: {
            only: [:id, :room_number],
            include: {
              building: {
                only: [:id, :name, :address]
              }
            }
          }
        },
        methods: [:before_photo_url, :after_photo_url]
      )
    }
  end

  private

  def set_room
    @room = Room.find(params[:room_id])
  end

  def set_virtual_staging
    @virtual_staging = VirtualStaging.find(params[:id])
  end

  def virtual_staging_params
    params.require(:virtual_staging).permit(:title, :description, :before_photo_id, :after_photo_id, :status)
  end

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end
end
