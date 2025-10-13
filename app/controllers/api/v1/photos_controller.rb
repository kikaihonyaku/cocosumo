class Api::V1::PhotosController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :set_building

  # GET /api/v1/buildings/:building_id/photos
  def index
    photos = @building.photos.map do |photo|
      {
        id: photo.id,
        url: url_for(photo),
        filename: photo.filename.to_s,
        content_type: photo.content_type,
        byte_size: photo.byte_size,
        created_at: photo.created_at
      }
    end

    render json: { photos: photos }
  end

  # POST /api/v1/buildings/:building_id/photos
  def create
    # 単数形と複数形の両方に対応
    photos_to_upload = if params[:photo].present?
                         [params[:photo]]
                       elsif params[:photos].present?
                         params[:photos]
                       else
                         []
                       end

    if photos_to_upload.blank?
      render json: { error: '写真を選択してください' }, status: :unprocessable_entity
      return
    end

    uploaded_photos = []
    errors = []

    photos_to_upload.each do |photo|
      if photo.content_type.start_with?('image/')
        @building.photos.attach(photo)
        uploaded_photos << {
          id: @building.photos.last.id,
          url: url_for(@building.photos.last),
          filename: @building.photos.last.filename.to_s,
          content_type: @building.photos.last.content_type,
          byte_size: @building.photos.last.byte_size,
          created_at: @building.photos.last.created_at
        }
      else
        errors << "#{photo.original_filename} は画像ファイルではありません"
      end
    end

    if errors.any?
      render json: { photos: uploaded_photos, errors: errors }, status: :unprocessable_entity
    else
      render json: { photos: uploaded_photos, message: '写真をアップロードしました' }, status: :created
    end
  end

  # DELETE /api/v1/buildings/:building_id/photos/:id
  def destroy
    photo = @building.photos.find(params[:id])
    photo.purge

    render json: { message: '写真を削除しました' }
  rescue ActiveRecord::RecordNotFound
    render json: { error: '写真が見つかりません' }, status: :not_found
  end

  private

  def set_building
    @building = current_tenant.buildings.find(params[:building_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: '建物(土地)が見つかりません' }, status: :not_found
  end

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end
end
