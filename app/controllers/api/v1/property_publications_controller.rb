class Api::V1::PropertyPublicationsController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login, except: [:show_public]
  before_action :set_room, only: [:index, :create], if: -> { params[:room_id].present? }
  before_action :set_property_publication, only: [:show, :update, :destroy, :publish, :unpublish]

  # GET /api/v1/property_publications (全物件公開ページ一覧)
  # GET /api/v1/rooms/:room_id/property_publications (部屋単位の物件公開ページ一覧)
  def index
    if params[:room_id]
      # 部屋単位の一覧
      @property_publications = @room.property_publications.kept
      render json: @property_publications.as_json(
        methods: [:thumbnail_url, :public_url]
      )
    else
      # 全物件公開ページ一覧
      @property_publications = PropertyPublication.kept.includes(room: :building).order(updated_at: :desc)
      render json: @property_publications.as_json(
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
        methods: [:thumbnail_url, :public_url]
      )
    end
  end

  # GET /api/v1/rooms/:room_id/property_publications/:id
  def show
    render json: @property_publication.as_json(
      include: {
        property_publication_photos: {
          only: [:id, :display_order, :comment],
          include: {
            room_photo: {
              only: [:id, :photo_type, :caption],
              methods: [:photo_url]
            }
          }
        },
        property_publication_vr_tours: {
          include: {
            vr_tour: {
              only: [:id, :title, :status, :description],
              methods: [:thumbnail_url]
            }
          }
        },
        property_publication_virtual_stagings: {
          include: {
            virtual_staging: {
              only: [:id, :title, :status, :description],
              methods: [:before_photo_url, :after_photo_url]
            }
          }
        },
        room: {
          only: [:id, :room_number, :floor, :room_type, :area, :rent, :management_fee, :deposit, :key_money, :status, :description, :facilities],
          include: {
            building: {
              only: [:id, :name, :address, :building_type, :structure, :built_year, :floors, :latitude, :longitude]
            }
          }
        }
      },
      methods: [:thumbnail_url, :public_url, :visible_fields_with_defaults]
    )
  end

  # GET /property/:publication_id (公開用、認証不要)
  def show_public
    @property_publication = PropertyPublication.kept.find_by!(publication_id: params[:publication_id])

    if @property_publication.published?
      # Get host from request
      host = "#{request.protocol}#{request.host_with_port}"

      result = @property_publication.as_json(
        include: {
          property_publication_photos: {
            only: [:id, :display_order, :comment],
            include: {
              room_photo: {
                only: [:id, :photo_type, :caption],
                methods: [:photo_url]
              }
            }
          },
          property_publication_vr_tours: {
            include: {
              vr_tour: {
                only: [:id, :title, :description, :public_id],
                methods: [:thumbnail_url]
              }
            }
          },
          property_publication_virtual_stagings: {
            include: {
              virtual_staging: {
                only: [:id, :title, :description, :public_id],
                methods: [:before_photo_url, :after_photo_url]
              }
            }
          },
          room: {
            only: [:id, :room_number, :floor, :room_type, :area, :rent, :management_fee, :deposit, :key_money, :description, :facilities],
            include: {
              building: {
                only: [:id, :name, :address, :building_type, :structure, :built_year, :floors, :latitude, :longitude]
              }
            }
          }
        },
        methods: [:visible_fields_with_defaults, :public_url]
      )

      # Add QR code with host information
      result['qr_code_data_url'] = @property_publication.qr_code_data_url(host: host)

      render json: result
    else
      render json: { error: 'この物件公開ページは公開されていません' }, status: :not_found
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'この物件公開ページは見つかりませんでした' }, status: :not_found
  end

  # POST /api/v1/rooms/:room_id/property_publications
  def create
    @property_publication = @room.property_publications.build(property_publication_params)

    ActiveRecord::Base.transaction do
      if @property_publication.save
        # 写真の関連付け（新形式）
        if params[:photos].present?
          params[:photos].each_with_index do |photo_data, index|
            @property_publication.property_publication_photos.create!(
              room_photo_id: photo_data[:photo_id],
              comment: photo_data[:comment],
              display_order: index
            )
          end
        # 写真の関連付け（旧形式との互換性）
        elsif params[:photo_ids].present?
          params[:photo_ids].each_with_index do |photo_id, index|
            @property_publication.property_publication_photos.create!(
              room_photo_id: photo_id,
              display_order: index
            )
          end
        end

        # VRツアーの関連付け
        if params[:vr_tour_ids].present?
          params[:vr_tour_ids].each_with_index do |vr_tour_id, index|
            @property_publication.property_publication_vr_tours.create!(
              vr_tour_id: vr_tour_id,
              display_order: index
            )
          end
        end

        # バーチャルステージングの関連付け
        if params[:virtual_staging_ids].present?
          params[:virtual_staging_ids].each_with_index do |virtual_staging_id, index|
            @property_publication.property_publication_virtual_stagings.create!(
              virtual_staging_id: virtual_staging_id,
              display_order: index
            )
          end
        end

        render json: @property_publication, status: :created
      else
        render json: { errors: @property_publication.errors.full_messages }, status: :unprocessable_entity
      end
    end
  rescue => e
    render json: { errors: [e.message] }, status: :unprocessable_entity
  end

  # PATCH/PUT /api/v1/rooms/:room_id/property_publications/:id
  def update
    ActiveRecord::Base.transaction do
      if @property_publication.update(property_publication_params)
        # 写真の関連付けを更新（新形式）
        if params[:photos]
          @property_publication.property_publication_photos.destroy_all
          params[:photos].each_with_index do |photo_data, index|
            @property_publication.property_publication_photos.create!(
              room_photo_id: photo_data[:photo_id],
              comment: photo_data[:comment],
              display_order: index
            )
          end
        # 写真の関連付けを更新（旧形式との互換性）
        elsif params[:photo_ids]
          @property_publication.property_publication_photos.destroy_all
          params[:photo_ids].each_with_index do |photo_id, index|
            @property_publication.property_publication_photos.create!(
              room_photo_id: photo_id,
              display_order: index
            )
          end
        end

        # VRツアーの関連付けを更新
        if params[:vr_tour_ids]
          @property_publication.property_publication_vr_tours.destroy_all
          params[:vr_tour_ids].each_with_index do |vr_tour_id, index|
            @property_publication.property_publication_vr_tours.create!(
              vr_tour_id: vr_tour_id,
              display_order: index
            )
          end
        end

        # バーチャルステージングの関連付けを更新
        if params[:virtual_staging_ids]
          @property_publication.property_publication_virtual_stagings.destroy_all
          params[:virtual_staging_ids].each_with_index do |virtual_staging_id, index|
            @property_publication.property_publication_virtual_stagings.create!(
              virtual_staging_id: virtual_staging_id,
              display_order: index
            )
          end
        end

        render json: @property_publication.as_json(
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
          methods: [:public_url]
        )
      else
        render json: { errors: @property_publication.errors.full_messages }, status: :unprocessable_entity
      end
    end
  rescue => e
    render json: { errors: [e.message] }, status: :unprocessable_entity
  end

  # DELETE /api/v1/rooms/:room_id/property_publications/:id
  def destroy
    if @property_publication.discard
      render json: { success: true, message: '物件公開ページを削除しました' }
    else
      render json: { success: false, error: '削除に失敗しました' }, status: :unprocessable_entity
    end
  end

  # POST /api/v1/rooms/:room_id/property_publications/:id/publish
  def publish
    if @property_publication.publish!
      render json: {
        success: true,
        message: '物件公開ページを公開しました',
        property_publication: @property_publication.as_json(
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
          methods: [:public_url, :qr_code_data_url]
        )
      }
    else
      render json: { errors: @property_publication.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # POST /api/v1/rooms/:room_id/property_publications/:id/unpublish
  def unpublish
    if @property_publication.unpublish!
      render json: {
        success: true,
        message: '物件公開ページを非公開にしました',
        property_publication: @property_publication.as_json(
          include: {
            room: {
              only: [:id, :room_number],
              include: {
                building: {
                  only: [:id, :name, :address]
                }
              }
            }
          }
        )
      }
    else
      render json: { errors: @property_publication.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_room
    @room = Room.find(params[:room_id])
  end

  def set_property_publication
    @property_publication = PropertyPublication.kept.find(params[:id])
  end

  def property_publication_params
    params.require(:property_publication).permit(
      :title,
      :catch_copy,
      :pr_text,
      :status,
      visible_fields: {}
    )
  end

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end
end
