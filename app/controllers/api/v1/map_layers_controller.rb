class Api::V1::MapLayersController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :set_map_layer, only: [:show, :geojson]

  # GET /api/v1/map_layers
  # 有効なレイヤー一覧を取得（一般ユーザー向け）
  def index
    global_layers = MapLayer.global_layers.active.ordered
    tenant_layers = current_tenant.map_layers.active.ordered
    @layers = global_layers + tenant_layers

    render json: @layers.map(&:display_config)
  end

  # GET /api/v1/map_layers/:id
  # 特定レイヤーの設定情報を取得
  def show
    render json: @layer.display_config
  end

  # GET /api/v1/map_layers/:id/geojson
  # 特定レイヤーのGeoJSONデータを取得
  def geojson
    render json: @layer.to_geojson
  end

  private

  def set_map_layer
    # layer_keyまたはIDでレイヤーを検索（グローバルレイヤーも対象）
    scope = MapLayer.active.where("tenant_id = ? OR is_global = true", current_tenant.id)
    @layer = scope.find_by(layer_key: params[:id]) || scope.find(params[:id])
  end
end
