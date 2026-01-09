class Api::V1::PresentationAccessesController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login, except: [:show_public, :verify_access, :track_view, :track_step]
  before_action :set_property_publication, only: [:index, :create]
  before_action :set_presentation_access, only: [:show, :update, :destroy, :revoke, :set_password, :remove_password]

  # GET /api/v1/property_publications/:property_publication_id/presentation_accesses
  def index
    @presentation_accesses = @property_publication.presentation_accesses.recent

    render json: @presentation_accesses.as_json(
      only: [:id, :access_token, :title, :status, :expires_at, :view_count,
             :last_accessed_at, :first_accessed_at, :notes, :created_at],
      methods: [:public_url, :accessible?, :password_protected?, :days_until_expiry]
    )
  end

  # POST /api/v1/property_publications/:property_publication_id/presentation_accesses
  def create
    @presentation_access = @property_publication.presentation_accesses.build(presentation_access_params)
    @presentation_access.expires_at ||= 7.days.from_now

    if @presentation_access.save
      render json: {
        success: true,
        message: "プレゼンURLを発行しました",
        presentation_access: @presentation_access.as_json(
          only: [:id, :access_token, :title, :expires_at, :status],
          methods: [:public_url]
        )
      }, status: :created
    else
      render json: { errors: @presentation_access.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # GET /api/v1/presentation_accesses/:id
  def show
    render json: @presentation_access.as_json(
      only: [:id, :access_token, :title, :status, :expires_at, :view_count,
             :last_accessed_at, :first_accessed_at, :access_history, :notes,
             :step_config, :created_at, :updated_at],
      methods: [:public_url, :accessible?, :password_protected?, :days_until_expiry, :ordered_steps],
      include: {
        property_publication: {
          only: [:id, :title, :publication_id],
          include: {
            room: {
              only: [:id, :room_number],
              include: {
                building: { only: [:id, :name, :address] }
              }
            }
          }
        }
      }
    )
  end

  # PATCH /api/v1/presentation_accesses/:id
  def update
    if @presentation_access.update(presentation_access_update_params)
      render json: {
        success: true,
        message: "プレゼン設定を更新しました",
        presentation_access: @presentation_access.as_json(
          methods: [:public_url, :accessible?, :ordered_steps]
        )
      }
    else
      render json: { errors: @presentation_access.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/presentation_accesses/:id
  def destroy
    @presentation_access.destroy
    render json: { success: true, message: "プレゼンURLを削除しました" }
  end

  # POST /api/v1/presentation_accesses/:id/revoke
  def revoke
    @presentation_access.revoke!
    render json: {
      success: true,
      message: "プレゼンURLを取り消しました",
      presentation_access: @presentation_access.as_json(methods: [:accessible?])
    }
  end

  # POST /api/v1/presentation_accesses/:id/set_password
  def set_password
    password = params[:password]

    if password.blank?
      return render json: { error: "パスワードを入力してください" }, status: :unprocessable_entity
    end

    if password.length < 4
      return render json: { error: "パスワードは4文字以上で入力してください" }, status: :unprocessable_entity
    end

    @presentation_access.password = password
    if @presentation_access.save
      render json: {
        success: true,
        message: "パスワードを設定しました",
        presentation_access: @presentation_access.as_json(methods: [:password_protected?])
      }
    else
      render json: { errors: @presentation_access.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # POST /api/v1/presentation_accesses/:id/remove_password
  def remove_password
    @presentation_access.password_digest = nil
    if @presentation_access.save
      render json: {
        success: true,
        message: "パスワード保護を解除しました",
        presentation_access: @presentation_access.as_json(methods: [:password_protected?])
      }
    else
      render json: { errors: @presentation_access.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # ===== 公開API（認証不要） =====

  # GET /api/v1/present/:access_token
  def show_public
    @presentation_access = PresentationAccess.find_by!(access_token: params[:access_token])

    unless @presentation_access.accessible?
      if @presentation_access.revoked?
        return render json: { error: "このプレゼンURLは取り消されています" }, status: :forbidden
      elsif @presentation_access.expired?
        return render json: { error: "このプレゼンURLの有効期限が切れています" }, status: :gone
      end
    end

    # パスワード認証チェック
    if @presentation_access.password_protected?
      if params[:password].present?
        unless @presentation_access.authenticate_password(params[:password])
          return render json: {
            error: "invalid_password",
            message: "パスワードが正しくありません"
          }, status: :unauthorized
        end
      else
        return render json: {
          error: "password_required",
          message: "このページはパスワードで保護されています",
          password_protected: true
        }, status: :unauthorized
      end
    end

    @property_publication = @presentation_access.property_publication

    unless @property_publication.published?
      return render json: { error: "この物件公開ページは現在公開されていません" }, status: :not_found
    end

    render json: build_presentation_data(@presentation_access)

  rescue ActiveRecord::RecordNotFound
    render json: { error: "このページは見つかりませんでした" }, status: :not_found
  end

  # POST /api/v1/present/:access_token/verify_access
  def verify_access
    @presentation_access = PresentationAccess.find_by!(access_token: params[:access_token])

    unless @presentation_access.accessible?
      return render json: { error: "このプレゼンURLは無効です" }, status: :forbidden
    end

    if @presentation_access.authenticate_password(params[:password])
      render json: { success: true, message: "パスワードが確認されました" }
    else
      render json: { success: false, error: "パスワードが正しくありません" }, status: :unauthorized
    end

  rescue ActiveRecord::RecordNotFound
    render json: { error: "このページは見つかりませんでした" }, status: :not_found
  end

  # POST /api/v1/present/:access_token/track_view
  def track_view
    @presentation_access = PresentationAccess.find_by!(access_token: params[:access_token])

    if @presentation_access.accessible?
      @presentation_access.record_access!(
        device_type: params[:device_type],
        ip_address: request.remote_ip,
        user_agent: request.user_agent
      )
    end

    render json: { success: true, view_count: @presentation_access.view_count }

  rescue ActiveRecord::RecordNotFound
    render json: { error: "Not found" }, status: :not_found
  end

  # POST /api/v1/present/:access_token/track_step
  def track_step
    @presentation_access = PresentationAccess.find_by!(access_token: params[:access_token])
    # 将来的にステップごとの分析機能を追加可能
    render json: { success: true, step: params[:step] }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Not found" }, status: :not_found
  end

  private

  def set_property_publication
    @property_publication = PropertyPublication.kept.find(params[:property_publication_id])
  end

  def set_presentation_access
    @presentation_access = PresentationAccess.find(params[:id])
  end

  def presentation_access_params
    params.require(:presentation_access).permit(:title, :password, :expires_at, :notes, step_config: {})
  end

  def presentation_access_update_params
    params.require(:presentation_access).permit(:title, :expires_at, :notes, step_config: {})
  end

  def build_presentation_data(presentation_access)
    publication = presentation_access.property_publication
    room = publication.room
    building = room.building
    host = "#{request.protocol}#{request.host_with_port}"

    {
      access_token: presentation_access.access_token,
      title: presentation_access.title || publication.title,
      steps: presentation_access.ordered_steps,
      expires_at: presentation_access.expires_at,
      days_until_expiry: presentation_access.days_until_expiry,
      property: {
        publication: publication.as_json(
          only: [:id, :title, :catch_copy, :pr_text, :publication_id],
          methods: [:visible_fields_with_defaults]
        ),
        room: room.as_json(
          only: [:id, :room_number, :floor, :room_type, :area, :rent, :management_fee,
                 :deposit, :key_money, :renewal_fee, :parking_fee, :notes,
                 :direction, :available_date, :guarantor_required, :pets_allowed,
                 :two_person_allowed, :office_use_allowed],
          methods: [:facility_names]
        ),
        building: building.as_json(
          only: [:id, :name, :address, :building_type, :structure, :built_year,
                 :floors, :total_units, :latitude, :longitude, :has_parking,
                 :has_elevator, :has_bicycle_parking]
        ),
        photos: publication.property_publication_photos.includes(:room_photo).map do |p|
          photo = p.room_photo
          {
            id: p.id,
            url: photo.photo_url,
            comment: p.comment,
            alt_text: photo.alt_text,
            photo_type: photo.photo_type
          }
        end,
        vr_tours: publication.property_publication_vr_tours.includes(:vr_tour).map do |v|
          tour = v.vr_tour
          {
            id: tour.id,
            title: tour.title,
            description: tour.description,
            public_id: tour.public_id,
            thumbnail_url: tour.thumbnail_url
          }
        end,
        virtual_stagings: publication.property_publication_virtual_stagings.includes(:virtual_staging).map do |vs|
          staging = vs.virtual_staging
          {
            id: staging.id,
            title: staging.title,
            description: staging.description,
            public_id: staging.public_id,
            before_photo_url: staging.before_photo_url,
            after_photo_url: staging.after_photo_url
          }
        end,
        routes: building.building_routes.order(:display_order).map do |route|
          {
            id: route.id,
            name: route.name,
            destination_name: route.destination_name,
            distance_meters: route.distance_meters,
            duration_seconds: route.duration_seconds,
            travel_mode: route.travel_mode,
            encoded_polyline: route.encoded_polyline
          }
        end
      }
    }
  end

  def require_login
    unless current_user
      render json: { error: "認証が必要です" }, status: :unauthorized
    end
  end
end
