# frozen_string_literal: true

class Api::V1::BuildingRoutesController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :set_building
  before_action :set_route, only: [:show, :update, :destroy, :calculate, :streetview_points]

  # GET /api/v1/buildings/:building_id/routes
  def index
    @routes = @building.building_routes.ordered
    render json: @routes
  end

  # GET /api/v1/buildings/:building_id/routes/:id
  def show
    render json: @route
  end

  # POST /api/v1/buildings/:building_id/routes
  def create
    @route = @building.building_routes.build(route_params)
    @route.tenant = current_tenant

    # 出発地の座標を設定（指定がなければ建物の位置を使用）
    set_origin_from_params

    # 目的地の座標を設定
    set_destination_from_params

    if @route.save
      # 経路計算を実行
      calculate_route_async

      render json: @route, status: :created
    else
      render json: { errors: @route.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/buildings/:building_id/routes/:id
  def update
    set_origin_from_params if origin_params_present?
    set_destination_from_params if destination_params_present?

    if @route.update(route_params)
      # 経路に影響する変更があれば再計算
      recalculate_if_needed

      render json: @route
    else
      render json: { errors: @route.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/buildings/:building_id/routes/:id
  def destroy
    @route.destroy
    head :no_content
  end

  # POST /api/v1/buildings/:building_id/routes/:id/calculate
  # 経路を再計算
  def calculate
    service = DirectionsService.new(@route)

    if service.calculate_and_save
      render json: @route.reload
    else
      render json: { error: '経路計算に失敗しました' }, status: :unprocessable_entity
    end
  end

  # GET /api/v1/buildings/:building_id/routes/:id/streetview_points
  # 経路上のストリートビューポイントを取得
  def streetview_points
    interval = params[:interval]&.to_i || 10

    points = if @route.streetview_points.present?
               @route.streetview_points
             else
               service = DirectionsService.new(@route)
               service.streetview_points(interval_meters: interval)
             end

    render json: { points: points, total: points.length }
  end

  private

  def set_building
    @building = current_tenant.buildings.kept.find(params[:building_id])
  end

  def set_route
    @route = @building.building_routes.find(params[:id])
  end

  def route_params
    params.require(:route).permit(
      :route_type, :name, :description,
      :destination_name, :destination_place_id,
      :travel_mode, :is_default, :display_order,
      waypoints: [:lat, :lng, :name]
    )
  end

  def origin_params_present?
    params.dig(:route, :origin_lat).present? ||
      params.dig(:route, :origin_lng).present? ||
      params.dig(:route, :use_building_origin).present?
  end

  def destination_params_present?
    params.dig(:route, :destination_lat).present? ||
      params.dig(:route, :destination_lng).present? ||
      params.dig(:route, :destination_latlng).present?
  end

  def set_origin_from_params
    route_data = params[:route]
    return unless route_data

    # use_building_origin が true の場合は建物の位置を使用
    if route_data[:use_building_origin].to_s == 'true' || route_data[:use_building_origin] == true
      @route.origin = @building.location if @building.location.present?
    elsif route_data[:origin_lat].present? && route_data[:origin_lng].present?
      @route.origin_latlng = {
        lat: route_data[:origin_lat].to_f,
        lng: route_data[:origin_lng].to_f
      }
    elsif @route.origin.blank? && @building.location.present?
      # デフォルト: 建物の位置を使用
      @route.origin = @building.location
    end
  end

  def set_destination_from_params
    route_data = params[:route]
    return unless route_data

    if route_data[:destination_lat].present? && route_data[:destination_lng].present?
      @route.destination_latlng = {
        lat: route_data[:destination_lat].to_f,
        lng: route_data[:destination_lng].to_f
      }
    elsif route_data[:destination_latlng].present?
      @route.destination_latlng = route_data[:destination_latlng]
    end
  end

  def calculate_route_async
    # 出発地と目的地が設定されている場合のみ計算
    return unless @route.origin.present? && @route.destination.present?

    service = DirectionsService.new(@route)
    service.calculate_and_save
  end

  def recalculate_if_needed
    # 出発地、目的地、経由点、移動手段が変更された場合は再計算
    return unless @route.saved_change_to_waypoints? ||
                  @route.saved_change_to_travel_mode? ||
                  @route.saved_change_to_origin? ||
                  @route.saved_change_to_destination?

    calculate_route_async
  end
end
