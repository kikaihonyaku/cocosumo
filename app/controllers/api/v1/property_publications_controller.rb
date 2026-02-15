class Api::V1::PropertyPublicationsController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login, except: [:show_public, :verify_password, :track_view, :track_analytics]
  before_action :set_room, only: [:index, :create], if: -> { params[:room_id].present? }
  before_action :set_property_publication, only: [:show, :update, :destroy, :publish, :unpublish, :duplicate]

  # GET /api/v1/property_publications (全物件公開ページ一覧)
  # GET /api/v1/rooms/:room_id/property_publications (部屋単位の物件公開ページ一覧)
  def index
    if params[:room_id]
      # 部屋単位の一覧
      @property_publications = @room.property_publications.kept.includes(:created_by, :updated_by)
      render json: @property_publications.as_json(
        include: {
          created_by: { only: [:id, :name] },
          updated_by: { only: [:id, :name] }
        },
        methods: [:thumbnail_url, :public_url]
      )
    else
      # 全物件公開ページ一覧（テナントでフィルタリング）
      @property_publications = PropertyPublication.kept
                                                   .joins(room: :building)
                                                   .where(buildings: { tenant_id: current_user.tenant_id })
                                                   .includes(room: :building)
                                                   .order(updated_at: :desc)
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
              only: [:id, :photo_type, :caption, :alt_text],
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
          only: [:id, :room_number, :floor, :room_type, :area, :rent, :management_fee, :deposit, :key_money, :status, :description,
                 :direction, :parking_fee, :renewal_fee, :available_date, :guarantor_required, :pets_allowed, :two_person_allowed, :office_use_allowed],
          methods: [:facility_names, :categorized_facilities],
          include: {
            building: {
              only: [:id, :name, :address, :building_type, :structure, :built_year, :floors, :latitude, :longitude,
                     :postcode, :total_units, :has_elevator, :has_bicycle_parking, :has_parking, :parking_spaces, :built_date],
              include: {
                building_stations: {
                  only: [:id, :walking_minutes, :display_order],
                  include: { station: { only: [:id, :name], include: { railway_line: { only: [:id, :name, :company, :color] } } } }
                },
                building_routes: {
                  only: [:id, :name, :route_type, :travel_mode, :distance_meters, :duration_seconds, :display_order],
                  methods: [:formatted_distance, :formatted_duration]
                }
              }
            }
          }
        }
      },
      methods: [:thumbnail_url, :public_url, :visible_fields_with_defaults, :qr_code_data_url]
    )
  end

  # GET /property/:publication_id (公開用、認証不要)
  def show_public
    # N+1クエリ回避のためeager loadingを使用
    @property_publication = PropertyPublication.kept
      .includes(
        property_publication_photos: { room_photo: { photo_attachment: :blob } },
        property_publication_vr_tours: :vr_tour,
        property_publication_virtual_stagings: :virtual_staging,
        room: [
          :matched_facilities,
          { building: [
            { building_stations: { station: :railway_line } },
            :building_routes
          ] }
        ]
      )
      .find_by!(publication_id: params[:publication_id])

    # プレビューモードの場合はログインユーザーのみアクセス可能
    is_preview = params[:preview].present?

    # 有効期限チェック
    if @property_publication.expired? && !is_preview
      return render json: { error: 'この物件公開ページの有効期限が切れています' }, status: :gone
    end

    # パスワード保護チェック（プレビューモードではスキップ）
    if @property_publication.password_protected? && !is_preview && !current_user
      # パスワードが提供されているか確認
      if params[:password].present?
        # パスワード検証
        unless @property_publication.authenticate_password(params[:password])
          return render json: {
            error: 'invalid_password',
            message: 'パスワードが正しくありません'
          }, status: :unauthorized
        end
        # パスワード正しい場合は続行
      else
        return render json: {
          error: 'password_required',
          message: 'この物件公開ページはパスワードで保護されています',
          password_protected: true
        }, status: :unauthorized
      end
    end

    # 公開中か、またはプレビューモードでログイン済みの場合のみ表示
    if @property_publication.published? || (is_preview && current_user)
      result = @property_publication.as_json(
        include: {
          property_publication_photos: {
            only: [:id, :display_order, :comment],
            include: {
              room_photo: {
                only: [:id, :photo_type, :caption, :alt_text],
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
            only: [:id, :room_number, :floor, :room_type, :area, :rent, :management_fee, :deposit, :key_money, :description,
                   :direction, :parking_fee, :renewal_fee, :available_date, :guarantor_required, :pets_allowed, :two_person_allowed, :office_use_allowed],
            methods: [:facility_names, :categorized_facilities],
            include: {
              building: {
                only: [:id, :name, :address, :building_type, :structure, :built_year, :floors, :latitude, :longitude,
                       :postcode, :total_units, :has_elevator, :has_bicycle_parking, :has_parking, :parking_spaces, :built_date],
                include: {
                  building_stations: {
                    only: [:id, :walking_minutes, :display_order],
                    include: { station: { only: [:id, :name], include: { railway_line: { only: [:id, :name, :company, :color] } } } }
                  },
                  building_routes: {
                    only: [:id, :name, :route_type, :travel_mode, :distance_meters, :duration_seconds, :display_order],
                    methods: [:formatted_distance, :formatted_duration]
                  }
                }
              }
            }
          }
        },
        methods: [:visible_fields_with_defaults, :public_url, :qr_code_data_url]
      )

      # Add expiration info
      result['expires_at'] = @property_publication.expires_at
      # Add OGP metadata for social sharing
      result['og_metadata'] = @property_publication.og_metadata

      # HTTPキャッシュヘッダーを設定（プレビューモード以外）
      unless is_preview
        # ETagベースのキャッシュ（更新時に自動無効化）
        response.headers['Cache-Control'] = 'public, max-age=300' # 5分間キャッシュ
        response.headers['ETag'] = Digest::MD5.hexdigest("#{@property_publication.id}-#{@property_publication.updated_at}")
      end

      render json: result
    else
      if is_preview
        render json: { error: 'プレビューを表示するにはログインが必要です' }, status: :unauthorized
      else
        render json: { error: 'この物件公開ページは公開されていません' }, status: :not_found
      end
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'この物件公開ページは見つかりませんでした' }, status: :not_found
  end

  # POST /api/v1/property_publications/:publication_id/verify_password
  def verify_password
    @property_publication = PropertyPublication.kept.find_by!(publication_id: params[:publication_id])

    if @property_publication.expired?
      return render json: { error: 'この物件公開ページの有効期限が切れています' }, status: :gone
    end

    if @property_publication.authenticate_password(params[:password])
      render json: { success: true, message: 'パスワードが確認されました' }
    else
      render json: { success: false, error: 'パスワードが正しくありません' }, status: :unauthorized
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'この物件公開ページは見つかりませんでした' }, status: :not_found
  end

  # POST /api/v1/rooms/:room_id/property_publications
  def create
    @property_publication = @room.property_publications.build(property_publication_params)
    @property_publication.created_by = current_user
    @property_publication.updated_by = current_user

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
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: [e.message] }, status: :unprocessable_entity
  rescue => e
    Rails.logger.error("PropertyPublication create error: #{e.class} - #{e.message}")
    render json: { errors: ["物件公開ページの作成に失敗しました"] }, status: :unprocessable_entity
  end

  # PATCH/PUT /api/v1/rooms/:room_id/property_publications/:id
  def update
    ActiveRecord::Base.transaction do
      if @property_publication.update(property_publication_params.merge(updated_by: current_user))
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
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: [e.message] }, status: :unprocessable_entity
  rescue => e
    Rails.logger.error("PropertyPublication update error: #{e.class} - #{e.message}")
    render json: { errors: ["物件公開ページの更新に失敗しました"] }, status: :unprocessable_entity
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

  # POST /api/v1/property_publications/:id/duplicate
  def duplicate
    new_publication = @property_publication.duplicate
    render json: {
      success: true,
      message: '物件公開ページを複製しました',
      property_publication: new_publication.as_json(
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
    }, status: :created
  rescue => e
    render json: { errors: [e.message] }, status: :unprocessable_entity
  end

  # POST /api/v1/property_publications/:publication_id/track_view
  def track_view
    @property_publication = PropertyPublication.kept.find_by!(publication_id: params[:publication_id])

    # Only count views for published pages (not previews)
    if @property_publication.published?
      @property_publication.increment!(:view_count)

      # 詳細アナリティクス追跡
      @property_publication.track_detailed_analytics(
        device_type: params[:device_type],
        referrer: params[:referrer]
      )
    end

    render json: { success: true, view_count: @property_publication.view_count }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Not found' }, status: :not_found
  end

  # POST /api/v1/property_publications/:publication_id/track_analytics
  def track_analytics
    @property_publication = PropertyPublication.kept.find_by!(publication_id: params[:publication_id])

    # Only track for published pages (not previews)
    if @property_publication.published?
      scroll_depth = params[:scroll_depth].to_i
      session_duration = params[:session_duration].to_i

      # Update max scroll depth if higher
      if scroll_depth > (@property_publication.max_scroll_depth || 0)
        @property_publication.update(max_scroll_depth: scroll_depth)
      end

      # Calculate rolling average for session duration
      current_avg = @property_publication.avg_session_duration || 0
      view_count = @property_publication.view_count || 1
      new_avg = ((current_avg * (view_count - 1)) + session_duration) / view_count
      @property_publication.update(avg_session_duration: new_avg.to_i)
    end

    render json: { success: true }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Not found' }, status: :not_found
  end

  # GET /api/v1/property_publications/:publication_id/analytics
  def analytics
    @property_publication = PropertyPublication.kept.find_by!(publication_id: params[:publication_id])

    render json: {
      view_count: @property_publication.view_count || 0,
      max_scroll_depth: @property_publication.max_scroll_depth || 0,
      avg_session_duration: @property_publication.avg_session_duration || 0,
      device_stats: @property_publication.device_stats || {},
      referrer_stats: @property_publication.referrer_stats || {},
      hourly_stats: @property_publication.hourly_stats || {},
      published_at: @property_publication.published_at,
      expires_at: @property_publication.expires_at,
      password_protected: @property_publication.password_protected?
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Not found' }, status: :not_found
  end

  # GET /api/v1/property_publications/search
  # 公開物件を検索（案件作成用）
  def search
    return render json: { error: '認証が必要です' }, status: :unauthorized unless current_user

    query = params[:query].to_s.strip
    return render json: { publications: [] } if query.blank?

    # ユーザーのテナントの公開物件のみ
    publications = PropertyPublication.kept
                                      .published
                                      .joins(room: :building)
                                      .where(buildings: { tenant_id: current_user.tenant_id })
                                      .where(
                                        'property_publications.title ILIKE :query OR buildings.name ILIKE :query OR rooms.room_number ILIKE :query',
                                        query: "%#{query}%"
                                      )
                                      .includes(room: :building)
                                      .order('property_publications.updated_at DESC')
                                      .limit(20)

    render json: {
      publications: publications.map do |pub|
        {
          id: pub.id,
          title: pub.title,
          building_name: pub.room&.building&.name,
          room_number: pub.room&.room_number,
          room_id: pub.room_id,
          thumbnail_url: pub.thumbnail_url
        }
      end
    }
  end

  # POST /api/v1/property_publications/bulk_action
  def bulk_action
    ids = params[:ids]
    action = params[:bulk_action]

    return render json: { error: 'IDが指定されていません' }, status: :bad_request if ids.blank?
    return render json: { error: 'アクションが指定されていません' }, status: :bad_request if action.blank?

    publications = PropertyPublication.kept
                                      .joins(room: :building)
                                      .where(buildings: { tenant_id: current_user.tenant_id })
                                      .where(id: ids)

    case action
    when 'publish'
      count = 0
      publications.each do |pub|
        if pub.draft?
          pub.publish!
          count += 1
        end
      end
      render json: { success: true, message: "#{count}件の物件を公開しました", affected_count: count }

    when 'unpublish'
      count = 0
      publications.each do |pub|
        if pub.published?
          pub.unpublish!
          count += 1
        end
      end
      render json: { success: true, message: "#{count}件の物件を非公開にしました", affected_count: count }

    when 'delete'
      count = publications.count
      publications.each(&:discard)
      render json: { success: true, message: "#{count}件の物件を削除しました", affected_count: count }

    when 'change_template'
      template_type = params[:template_type]
      return render json: { error: 'テンプレートが指定されていません' }, status: :bad_request if template_type.blank?

      count = publications.update_all(template_type: template_type)
      render json: { success: true, message: "#{count}件の物件のテンプレートを変更しました", affected_count: count }

    else
      render json: { error: '不明なアクションです' }, status: :bad_request
    end
  rescue => e
    Rails.logger.error("PropertyPublication bulk_action error: #{e.class} - #{e.message}")
    render json: { errors: ["一括操作に失敗しました"] }, status: :unprocessable_entity
  end

  private

  def set_room
    @room = Room.joins(:building)
                .where(buildings: { tenant_id: current_user.tenant_id })
                .find(params[:room_id])
  end

  def set_property_publication
    @property_publication = PropertyPublication.kept
                                               .joins(room: :building)
                                               .where(buildings: { tenant_id: current_user.tenant_id })
                                               .find(params[:id])
  end

  def property_publication_params
    params.require(:property_publication).permit(
      :title,
      :catch_copy,
      :pr_text,
      :status,
      :template_type,
      :scheduled_publish_at,
      :scheduled_unpublish_at,
      :primary_color,
      :accent_color,
      :access_password,
      :expires_at,
      visible_fields: {}
    )
  end

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end
end
