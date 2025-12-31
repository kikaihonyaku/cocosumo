class Api::V1::CustomerAccessesController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login, except: [:show_public, :verify_access, :track_view]
  before_action :set_property_publication, only: [:index, :create]
  before_action :set_customer_access, only: [:show, :update, :destroy, :revoke, :extend_expiry]

  # GET /api/v1/property_publications/:property_publication_id/customer_accesses
  def index
    @customer_accesses = @property_publication.customer_accesses.recent

    render json: @customer_accesses.as_json(
      only: [:id, :access_token, :customer_name, :customer_email, :customer_phone,
             :status, :expires_at, :view_count, :last_accessed_at, :first_accessed_at,
             :notes, :created_at],
      methods: [:public_url, :accessible?, :formatted_expires_at, :days_until_expiry]
    )
  end

  # GET /api/v1/customer_accesses/:id
  def show
    render json: @customer_access.as_json(
      only: [:id, :access_token, :customer_name, :customer_email, :customer_phone,
             :status, :expires_at, :view_count, :last_accessed_at, :first_accessed_at,
             :access_history, :notes, :created_at, :updated_at],
      methods: [:public_url, :accessible?, :formatted_expires_at, :days_until_expiry],
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

  # POST /api/v1/property_publications/:property_publication_id/customer_accesses
  def create
    @customer_access = @property_publication.customer_accesses.build(customer_access_params)

    # デフォルト有効期限を14日後に設定
    @customer_access.expires_at ||= 14.days.from_now

    if @customer_access.save
      # メール通知送信（オプション）
      if params[:send_notification] == true || params[:send_notification] == "true"
        CustomerAccessMailer.notify_customer(@customer_access, params[:raw_password]).deliver_later
      end

      render json: {
        success: true,
        message: '顧客アクセス権を発行しました',
        customer_access: @customer_access.as_json(
          only: [:id, :access_token, :customer_name, :customer_email, :expires_at, :status],
          methods: [:public_url, :formatted_expires_at]
        )
      }, status: :created
    else
      render json: { errors: @customer_access.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /api/v1/customer_accesses/:id
  def update
    if @customer_access.update(customer_access_update_params)
      render json: {
        success: true,
        message: '顧客アクセス情報を更新しました',
        customer_access: @customer_access.as_json(
          methods: [:public_url, :accessible?, :formatted_expires_at]
        )
      }
    else
      render json: { errors: @customer_access.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/customer_accesses/:id
  def destroy
    @customer_access.destroy
    render json: { success: true, message: '顧客アクセス権を削除しました' }
  end

  # POST /api/v1/customer_accesses/:id/revoke
  def revoke
    @customer_access.revoke!
    render json: {
      success: true,
      message: '顧客アクセス権を取り消しました',
      customer_access: @customer_access.as_json(methods: [:accessible?])
    }
  end

  # POST /api/v1/customer_accesses/:id/extend_expiry
  def extend_expiry
    new_expiry = params[:expires_at] ? Time.parse(params[:expires_at]) : 14.days.from_now

    if @customer_access.extend_expiry!(new_expiry)
      render json: {
        success: true,
        message: "有効期限を#{new_expiry.strftime('%Y年%m月%d日')}まで延長しました",
        customer_access: @customer_access.as_json(
          methods: [:accessible?, :formatted_expires_at, :days_until_expiry]
        )
      }
    else
      render json: { errors: @customer_access.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # ===== 公開API（認証不要） =====

  # GET /api/v1/customer/:access_token
  def show_public
    @customer_access = CustomerAccess.find_by!(access_token: params[:access_token])

    # アクセス可能性チェック
    unless @customer_access.accessible?
      if @customer_access.revoked?
        return render json: { error: 'このアクセス権は取り消されています' }, status: :forbidden
      elsif @customer_access.expired?
        return render json: { error: 'このアクセス権の有効期限が切れています' }, status: :gone
      end
    end

    # パスワード認証チェック
    if @customer_access.password_digest.present?
      if params[:password].present?
        unless @customer_access.authenticate_password(params[:password])
          return render json: {
            error: 'invalid_password',
            message: 'パスワードが正しくありません'
          }, status: :unauthorized
        end
      else
        return render json: {
          error: 'password_required',
          message: 'このページはパスワードで保護されています',
          customer_name: @customer_access.customer_name,
          password_protected: true
        }, status: :unauthorized
      end
    end

    # PropertyPublicationのデータを取得
    @property_publication = @customer_access.property_publication

    # 物件が公開されているか確認
    unless @property_publication.published?
      return render json: { error: 'この物件公開ページは現在公開されていません' }, status: :not_found
    end

    # レスポンスデータ生成
    host = "#{request.protocol}#{request.host_with_port}"

    result = build_property_data(@property_publication, host)

    # 顧客アクセス情報を追加
    result['customer_access'] = {
      customer_name: @customer_access.customer_name,
      expires_at: @customer_access.expires_at,
      formatted_expires_at: @customer_access.formatted_expires_at,
      days_until_expiry: @customer_access.days_until_expiry
    }

    # 顧客専用経路を追加
    customer_routes = @customer_access.customer_routes.ordered.map(&:as_route_json)
    result['customer_routes'] = customer_routes
    result['can_add_more_routes'] = customer_routes.length < 4

    render json: result

  rescue ActiveRecord::RecordNotFound
    render json: { error: 'このページは見つかりませんでした' }, status: :not_found
  end

  # POST /api/v1/customer/:access_token/verify_access
  def verify_access
    @customer_access = CustomerAccess.find_by!(access_token: params[:access_token])

    unless @customer_access.accessible?
      return render json: { error: 'このアクセス権は無効です' }, status: :forbidden
    end

    if @customer_access.authenticate_password(params[:password])
      render json: { success: true, message: 'パスワードが確認されました' }
    else
      render json: { success: false, error: 'パスワードが正しくありません' }, status: :unauthorized
    end

  rescue ActiveRecord::RecordNotFound
    render json: { error: 'このページは見つかりませんでした' }, status: :not_found
  end

  # POST /api/v1/customer/:access_token/track_view
  def track_view
    @customer_access = CustomerAccess.find_by!(access_token: params[:access_token])

    if @customer_access.accessible?
      @customer_access.record_access!(
        device_type: params[:device_type],
        ip_address: request.remote_ip,
        user_agent: request.user_agent
      )
    end

    render json: { success: true, view_count: @customer_access.view_count }

  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Not found' }, status: :not_found
  end

  # ==========================================
  # お客様専用経路 API
  # ==========================================

  # GET /api/v1/customer/:access_token/routes
  def customer_routes
    @customer_access = CustomerAccess.find_by!(access_token: params[:access_token])

    unless @customer_access.accessible?
      return render json: { error: 'このアクセス権は無効です' }, status: :forbidden
    end

    routes = @customer_access.customer_routes.ordered.map(&:as_route_json)
    render json: { routes: routes, can_add_more: @customer_access.customer_routes.count < 4 }

  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Not found' }, status: :not_found
  end

  # POST /api/v1/customer/:access_token/routes/preview
  # 経路候補をプレビュー（保存しない）
  def preview_customer_route
    @customer_access = CustomerAccess.find_by!(access_token: params[:access_token])

    unless @customer_access.accessible?
      return render json: { error: 'このアクセス権は無効です' }, status: :forbidden
    end

    # 4件制限チェック
    if @customer_access.customer_routes.count >= 4
      return render json: { error: '登録できる経路は最大4件までです' }, status: :unprocessable_entity
    end

    building = @customer_access.property_publication.room.building
    unless building&.latitude && building&.longitude
      return render json: { error: '物件の位置情報がありません' }, status: :unprocessable_entity
    end

    destination_lat = params.dig(:customer_route, :destination_lat)
    destination_lng = params.dig(:customer_route, :destination_lng)
    travel_mode = params.dig(:customer_route, :travel_mode) || 'walking'

    unless destination_lat && destination_lng
      return render json: { error: '目的地が必要です' }, status: :unprocessable_entity
    end

    # Google Directions APIで経路候補を取得
    candidates = fetch_route_alternatives(
      origin_lat: building.latitude,
      origin_lng: building.longitude,
      destination_lat: destination_lat,
      destination_lng: destination_lng,
      travel_mode: travel_mode
    )

    if candidates
      render json: {
        candidates: candidates,
        route_params: {
          origin_lat: building.latitude,
          origin_lng: building.longitude,
          destination_lat: destination_lat,
          destination_lng: destination_lng,
          travel_mode: travel_mode
        }
      }
    else
      render json: { error: '経路の取得に失敗しました' }, status: :unprocessable_entity
    end

  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Not found' }, status: :not_found
  end

  # POST /api/v1/customer/:access_token/routes
  # 選択した経路候補を保存
  def create_customer_route
    @customer_access = CustomerAccess.find_by!(access_token: params[:access_token])

    unless @customer_access.accessible?
      return render json: { error: 'このアクセス権は無効です' }, status: :forbidden
    end

    # 4件制限チェック
    if @customer_access.customer_routes.count >= 4
      return render json: { error: '登録できる経路は最大4件までです' }, status: :unprocessable_entity
    end

    building = @customer_access.property_publication.room.building
    unless building&.latitude && building&.longitude
      return render json: { error: '物件の位置情報がありません' }, status: :unprocessable_entity
    end

    route = @customer_access.customer_routes.build(customer_route_params)
    route.display_order = @customer_access.customer_routes.count
    route.origin_lat = building.latitude
    route.origin_lng = building.longitude

    # selected_indexが指定されている場合は、その経路候補のデータを使用
    selected_index = params[:selected_index]&.to_i
    if selected_index.present?
      candidates = fetch_route_alternatives(
        origin_lat: building.latitude,
        origin_lng: building.longitude,
        destination_lat: route.destination_lat,
        destination_lng: route.destination_lng,
        travel_mode: route.travel_mode
      )

      if candidates && candidates[selected_index]
        selected = candidates[selected_index]
        route.distance_meters = selected[:distance_meters]
        route.duration_seconds = selected[:duration_seconds]
        route.encoded_polyline = selected[:encoded_polyline]
        route.calculated = true
      end
    end

    if route.save
      # selected_indexがない場合は経路計算を実行
      route.calculate_route! unless route.calculated?

      render json: {
        success: true,
        route: route.as_route_json,
        can_add_more: @customer_access.customer_routes.count < 4
      }, status: :created
    else
      render json: { error: route.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end

  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Not found' }, status: :not_found
  end

  # DELETE /api/v1/customer/:access_token/routes/:route_id
  def destroy_customer_route
    @customer_access = CustomerAccess.find_by!(access_token: params[:access_token])

    unless @customer_access.accessible?
      return render json: { error: 'このアクセス権は無効です' }, status: :forbidden
    end

    route = @customer_access.customer_routes.find(params[:route_id])
    route.destroy!

    render json: {
      success: true,
      message: '経路を削除しました',
      can_add_more: @customer_access.customer_routes.count < 4
    }

  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Not found' }, status: :not_found
  end

  # POST /api/v1/customer/:access_token/routes/:route_id/recalculate
  def recalculate_customer_route
    @customer_access = CustomerAccess.find_by!(access_token: params[:access_token])

    unless @customer_access.accessible?
      return render json: { error: 'このアクセス権は無効です' }, status: :forbidden
    end

    route = @customer_access.customer_routes.find(params[:route_id])

    if route.calculate_route!
      render json: { success: true, route: route.as_route_json }
    else
      render json: { error: '経路計算に失敗しました' }, status: :unprocessable_entity
    end

  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Not found' }, status: :not_found
  end

  # GET /api/v1/customer/:access_token/routes/:route_id/streetview_points
  def customer_route_streetview_points
    @customer_access = CustomerAccess.find_by!(access_token: params[:access_token])

    unless @customer_access.accessible?
      return render json: { error: 'このアクセス権は無効です' }, status: :forbidden
    end

    route = @customer_access.customer_routes.find(params[:route_id])

    unless route.calculated? && route.encoded_polyline.present?
      return render json: { error: '経路が計算されていません' }, status: :unprocessable_entity
    end

    # ストリートビューポイントを生成
    points = generate_streetview_points_from_polyline(route.encoded_polyline)

    render json: { points: points }

  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Not found' }, status: :not_found
  end

  private

  def set_property_publication
    @property_publication = PropertyPublication.kept.find(params[:property_publication_id])
  end

  def set_customer_access
    @customer_access = CustomerAccess.find(params[:id])
  end

  def customer_access_params
    params.require(:customer_access).permit(
      :customer_name,
      :customer_email,
      :customer_phone,
      :password,
      :expires_at,
      :notes
    )
  end

  def customer_access_update_params
    params.require(:customer_access).permit(
      :customer_name,
      :customer_email,
      :customer_phone,
      :expires_at,
      :notes
    )
  end

  def build_property_data(property_publication, host)
    result = property_publication.as_json(
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
          only: [:id, :room_number, :floor, :room_type, :area, :rent, :management_fee,
                 :deposit, :key_money, :description, :facilities, :available_date],
          include: {
            building: {
              only: [:id, :name, :address, :building_type, :structure, :built_year,
                     :floors, :latitude, :longitude, :postcode]
            }
          }
        }
      },
      methods: [:visible_fields_with_defaults, :public_url]
    )

    result['qr_code_data_url'] = property_publication.qr_code_data_url(host: host)
    result['og_metadata'] = property_publication.og_metadata(host: host)

    # 経路情報を追加
    building = property_publication.room.building
    if building.building_routes.any?
      result['building_routes'] = building.building_routes.order(:display_order).as_json(
        only: [:id, :name, :route_type, :destination_name, :distance_meters,
               :duration_seconds, :travel_mode, :display_order, :encoded_polyline, :calculated,
               :origin_lat, :origin_lng, :destination_lat, :destination_lng]
      )
    end

    result
  end

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end

  def customer_route_params
    params.require(:customer_route).permit(
      :name,
      :destination_name,
      :destination_address,
      :destination_lat,
      :destination_lng,
      :travel_mode
    )
  end

  # Google Directions APIで経路候補を取得
  def fetch_route_alternatives(origin_lat:, origin_lng:, destination_lat:, destination_lng:, travel_mode:)
    api_key = ENV['GOOGLE_MAPS_API_KEY'] || ENV['VITE_GOOGLE_MAPS_API_KEY']
    return nil unless api_key

    uri = URI('https://maps.googleapis.com/maps/api/directions/json')
    params = {
      origin: "#{origin_lat},#{origin_lng}",
      destination: "#{destination_lat},#{destination_lng}",
      mode: travel_mode || 'walking',
      alternatives: 'true',
      key: api_key,
      language: 'ja'
    }
    uri.query = URI.encode_www_form(params)

    response = Net::HTTP.get_response(uri)
    return nil unless response.is_a?(Net::HTTPSuccess)

    result = JSON.parse(response.body)
    return nil unless result['status'] == 'OK'

    result['routes'].map.with_index do |route_data, index|
      leg = route_data['legs'].first
      {
        index: index,
        distance_meters: leg['distance']['value'],
        distance_text: leg['distance']['text'],
        duration_seconds: leg['duration']['value'],
        duration_text: leg['duration']['text'],
        encoded_polyline: route_data['overview_polyline']['points'],
        summary: route_data['summary'] || '',
        warnings: route_data['warnings'] || []
      }
    end
  rescue StandardError => e
    Rails.logger.error("fetch_route_alternatives error: #{e.message}")
    nil
  end

  def generate_streetview_points_from_polyline(encoded_polyline)
    return [] unless encoded_polyline.present?

    begin
      # ポリラインをデコード（Google Polyline Algorithm）
      points = decode_polyline(encoded_polyline)

      # 10メートル間隔でストリートビューポイントを生成
      interval_meters = 10
      streetview_points = []
      accumulated_distance = 0

      points.each_with_index do |point, index|
        if index == 0
          streetview_points << { lat: point[0], lng: point[1], heading: 0 }
          next
        end

        prev_point = points[index - 1]
        distance = haversine_distance(prev_point[0], prev_point[1], point[0], point[1])
        accumulated_distance += distance

        if accumulated_distance >= interval_meters
          # 方角を計算
          heading = calculate_heading(prev_point[0], prev_point[1], point[0], point[1])
          streetview_points << { lat: point[0], lng: point[1], heading: heading.round(1) }
          accumulated_distance = 0
        end
      end

      # 最後の地点を追加
      if points.length > 1
        last_point = points.last
        second_last = points[-2]
        heading = calculate_heading(second_last[0], second_last[1], last_point[0], last_point[1])
        streetview_points << { lat: last_point[0], lng: last_point[1], heading: heading.round(1) }
      end

      streetview_points.uniq { |p| [p[:lat].round(5), p[:lng].round(5)] }
    rescue => e
      Rails.logger.error("Failed to generate streetview points: #{e.message}")
      []
    end
  end

  # Google Polyline Algorithm のデコード
  def decode_polyline(encoded)
    return [] if encoded.blank?

    points = []
    index = 0
    lat = 0
    lng = 0

    while index < encoded.length
      # Decode latitude
      shift = 0
      result = 0
      loop do
        b = encoded[index].ord - 63
        index += 1
        result |= (b & 0x1f) << shift
        shift += 5
        break if b < 0x20
      end
      lat += (result & 1).nonzero? ? ~(result >> 1) : (result >> 1)

      # Decode longitude
      shift = 0
      result = 0
      loop do
        b = encoded[index].ord - 63
        index += 1
        result |= (b & 0x1f) << shift
        shift += 5
        break if b < 0x20
      end
      lng += (result & 1).nonzero? ? ~(result >> 1) : (result >> 1)

      points << [lat / 1e5, lng / 1e5]
    end

    points
  end

  def haversine_distance(lat1, lng1, lat2, lng2)
    rad_per_deg = Math::PI / 180
    earth_radius = 6371000 # meters

    dlat = (lat2 - lat1) * rad_per_deg
    dlng = (lng2 - lng1) * rad_per_deg

    a = Math.sin(dlat / 2)**2 + Math.cos(lat1 * rad_per_deg) * Math.cos(lat2 * rad_per_deg) * Math.sin(dlng / 2)**2
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    earth_radius * c
  end

  def calculate_heading(lat1, lng1, lat2, lng2)
    rad_per_deg = Math::PI / 180
    deg_per_rad = 180 / Math::PI

    lat1_rad = lat1 * rad_per_deg
    lat2_rad = lat2 * rad_per_deg
    dlng = (lng2 - lng1) * rad_per_deg

    x = Math.sin(dlng) * Math.cos(lat2_rad)
    y = Math.cos(lat1_rad) * Math.sin(lat2_rad) - Math.sin(lat1_rad) * Math.cos(lat2_rad) * Math.cos(dlng)

    heading = Math.atan2(x, y) * deg_per_rad
    (heading + 360) % 360
  end
end
