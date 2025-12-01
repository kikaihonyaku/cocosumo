class Api::V1::MapLayersController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :set_map_layer, only: [:show, :geojson]

  # GET /api/v1/map_layers
  # 有効なレイヤー一覧を取得（一般ユーザー向け）
  def index
    @layers = current_tenant.map_layers.active.ordered

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
    # layer_keyまたはIDでレイヤーを検索
    @layer = current_tenant.map_layers.active.find_by(layer_key: params[:id]) ||
             current_tenant.map_layers.active.find(params[:id])
  end
end
