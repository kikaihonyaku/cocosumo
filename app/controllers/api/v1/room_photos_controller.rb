class Api::V1::RoomPhotosController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :set_room
  before_action :set_room_photo, only: [:show, :update, :destroy]

  # GET /api/v1/rooms/:room_id/room_photos
  def index
    @room_photos = @room.room_photos.with_attached_photo
    render json: @room_photos.as_json(
      methods: [:photo_url],
      only: [:id, :photo_type, :caption, :display_order, :created_at, :updated_at]
    )
  end

  # GET /api/v1/rooms/:room_id/room_photos/:id
  def show
    render json: @room_photo.as_json(
      methods: [:photo_url],
      only: [:id, :photo_type, :caption, :display_order, :created_at, :updated_at]
    )
  end

  # POST /api/v1/rooms/:room_id/room_photos
  def create
    @room_photo = @room.room_photos.build(room_photo_params.except(:photo))

    # 自動的に最後の順序を設定
    if @room_photo.display_order.nil?
      max_order = @room.room_photos.maximum(:display_order) || 0
      @room_photo.display_order = max_order + 1
    end

    # 写真ファイルを添付
    if params[:room_photo][:photo].present?
      @room_photo.photo.attach(params[:room_photo][:photo])
    end

    if @room_photo.save
      render json: @room_photo.as_json(methods: [:photo_url]), status: :created
    else
      render json: { errors: @room_photo.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/rooms/:room_id/room_photos/:id
  def update
    # 写真ファイルの更新
    if params[:room_photo][:photo].present?
      @room_photo.photo.attach(params[:room_photo][:photo])
    end

    if @room_photo.update(room_photo_params.except(:photo))
      render json: @room_photo.as_json(methods: [:photo_url])
    else
      render json: { errors: @room_photo.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/rooms/:room_id/room_photos/:id
  def destroy
    if @room_photo.destroy
      # 残りの写真の順序を詰める
      @room.room_photos.unscoped.where('display_order > ?', @room_photo.display_order).each do |photo|
        photo.update(display_order: photo.display_order - 1)
      end

      render json: { success: true, message: '写真を削除しました' }
    else
      render json: { success: false, error: '削除に失敗しました' }, status: :unprocessable_entity
    end
  end

  private

  def set_room
    @room = Room.find(params[:room_id])
  end

  def set_room_photo
    @room_photo = @room.room_photos.unscoped.find(params[:id])
  end

  def room_photo_params
    params.require(:room_photo).permit(
      :photo,
      :photo_type,
      :caption,
      :display_order
    )
  end

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end
end
