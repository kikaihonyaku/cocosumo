class Api::V1::BuildingPhotosController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :set_building
  before_action :set_building_photo, only: [:show, :update, :destroy, :replace, :duplicate, :proxy, :move_to_room]

  # GET /api/v1/buildings/:building_id/photos
  def index
    @building_photos = @building.building_photos.with_attached_photo
    render json: {
      photos: @building_photos.as_json(
        methods: [:photo_url, :url, :image_url, :thumbnail_url],
        only: [:id, :photo_type, :caption, :display_order, :created_at, :updated_at]
      )
    }
  end

  # GET /api/v1/buildings/:building_id/photos/:id
  def show
    render json: {
      photo: @building_photo.as_json(
        methods: [:photo_url, :url, :image_url, :thumbnail_url],
        only: [:id, :photo_type, :caption, :display_order, :created_at, :updated_at]
      ).merge(building_name: @building.name)
    }
  end

  # POST /api/v1/buildings/:building_id/photos
  def create
    @building_photo = @building.building_photos.build

    # photo_typeを設定
    @building_photo.photo_type = params[:photo_type] || 'exterior'
    @building_photo.caption = params[:caption] if params[:caption].present?

    # 自動的に最後の順序を設定
    if @building_photo.display_order.nil?
      max_order = @building.building_photos.maximum(:display_order) || 0
      @building_photo.display_order = max_order + 1
    end

    # 写真ファイルを添付
    if params[:photo].present?
      @building_photo.photo.attach(params[:photo])
    end

    if @building_photo.save
      render json: {
        photo: @building_photo.as_json(
          methods: [:photo_url, :url, :image_url, :thumbnail_url],
          only: [:id, :photo_type, :caption, :display_order, :created_at, :updated_at]
        )
      }, status: :created
    else
      render json: { errors: @building_photo.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/buildings/:building_id/photos/:id
  def update
    # 写真ファイルの更新
    if params[:photo].present?
      @building_photo.photo.attach(params[:photo])
    end

    # 属性の更新
    update_params = {}
    update_params[:photo_type] = params[:photo_type] if params[:photo_type].present?
    update_params[:caption] = params[:caption] if params[:caption].present?
    update_params[:display_order] = params[:display_order] if params[:display_order].present?

    if @building_photo.update(update_params)
      render json: {
        photo: @building_photo.as_json(
          methods: [:photo_url, :url, :image_url, :thumbnail_url],
          only: [:id, :photo_type, :caption, :display_order, :created_at, :updated_at]
        )
      }
    else
      render json: { errors: @building_photo.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/buildings/:building_id/photos/:id
  def destroy
    if @building_photo.destroy
      # 残りの写真の順序を詰める
      @building.building_photos.unscoped.where('display_order > ?', @building_photo.display_order).each do |photo|
        photo.update(display_order: photo.display_order - 1)
      end

      render json: { success: true, message: '写真を削除しました' }
    else
      render json: { success: false, error: '削除に失敗しました' }, status: :unprocessable_entity
    end
  end

  # POST /api/v1/buildings/:building_id/photos/:id/replace
  # 既存の写真を編集済み画像で置き換える
  def replace
    if params[:photo].present?
      @building_photo.photo.attach(params[:photo])

      if @building_photo.save
        render json: {
          success: true,
          message: '写真を更新しました',
          photo: @building_photo.as_json(
            methods: [:photo_url, :url, :image_url, :thumbnail_url],
            only: [:id, :photo_type, :caption, :display_order, :created_at, :updated_at]
          )
        }
      else
        render json: { error: '写真の更新に失敗しました' }, status: :unprocessable_entity
      end
    else
      render json: { error: '写真ファイルが指定されていません' }, status: :bad_request
    end
  end

  # POST /api/v1/buildings/:building_id/photos/:id/duplicate
  # 編集済み画像を新しい写真として保存
  def duplicate
    if params[:photo].present?
      # 元の写真の情報をコピーして新しい写真を作成
      new_photo = @building.building_photos.build(
        photo_type: @building_photo.photo_type,
        caption: @building_photo.caption ? "#{@building_photo.caption} (編集済み)" : "編集済み"
      )

      # 自動的に最後の順序を設定
      max_order = @building.building_photos.maximum(:display_order) || 0
      new_photo.display_order = max_order + 1

      # 新しい写真ファイルを添付
      new_photo.photo.attach(params[:photo])

      if new_photo.save
        render json: {
          success: true,
          message: '新しい写真として保存しました',
          photo: new_photo.as_json(
            methods: [:photo_url, :url, :image_url, :thumbnail_url],
            only: [:id, :photo_type, :caption, :display_order, :created_at, :updated_at]
          )
        }, status: :created
      else
        render json: { error: '写真の保存に失敗しました' }, status: :unprocessable_entity
      end
    else
      render json: { error: '写真ファイルが指定されていません' }, status: :bad_request
    end
  end

  # POST /api/v1/buildings/:building_id/photos/:id/move_to_room
  # 写真を部屋に移動
  def move_to_room
    room = Room.find(params[:target_room_id])

    # 移動先の部屋がこの建物に属していることを確認
    unless room.building_id == @building.id
      render json: { success: false, error: '移動先の部屋はこの建物に属していません' }, status: :unprocessable_entity
      return
    end

    service = PhotoMoverService.new(@building_photo)
    new_photo = service.move_to_room(room, target_photo_type: params[:photo_type])

    render json: {
      success: true,
      message: '写真を部屋に移動しました',
      new_photo_id: new_photo.id,
      new_photo: new_photo.as_json(methods: [:photo_url])
    }
  rescue ActiveRecord::RecordNotFound => e
    render json: { success: false, error: '移動先の部屋が見つかりません' }, status: :not_found
  end

  # GET /api/v1/buildings/:building_id/photos/:id/proxy
  # CORS回避のため、画像をプロキシ経由で提供
  def proxy
    if @building_photo.photo.attached?
      # Active Storageから画像データを取得
      blob = @building_photo.photo.blob

      # 画像データを送信
      send_data blob.download,
                type: blob.content_type,
                disposition: 'inline'
    else
      head :not_found
    end
  end

  private

  def set_building
    @building = current_tenant.buildings.find(params[:building_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: '建物(土地)が見つかりません' }, status: :not_found
  end

  def set_building_photo
    @building_photo = @building.building_photos.unscoped.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: '写真が見つかりません' }, status: :not_found
  end

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end
end
