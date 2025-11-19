class Api::V1::Admin::MapLayersController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :require_admin
  before_action :set_map_layer, only: [:show, :update, :destroy, :append_features, :replace_features]

  # GET /api/v1/admin/map_layers
  # レイヤー一覧を取得
  def index
    @layers = current_tenant.map_layers.ordered

    # feature_countを更新（古いデータの場合）
    @layers.each do |layer|
      if layer.feature_count.zero? && layer.layer_type == 'school_districts'
        layer.update_feature_count!
      end
    end

    render json: @layers.map(&:display_config)
  end

  # GET /api/v1/admin/map_layers/:id
  # 特定レイヤーの詳細を取得
  def show
    render json: {
      layer: @layer.display_config,
      geojson: @layer.to_geojson
    }
  end

  # POST /api/v1/admin/map_layers
  # 新規レイヤーを作成
  def create
    @layer = current_tenant.map_layers.build(layer_params)

    # JSONファイルがアップロードされた場合、データをインポート
    if params[:file].present?
      result = import_geojson_file(params[:file], @layer)
      unless result[:success]
        render json: { error: result[:error] }, status: :unprocessable_entity
        return
      end
    end

    # フィーチャー数を更新
    @layer.update_feature_count!

    if @layer.save
      render json: @layer.display_config, status: :created
    else
      render json: { errors: @layer.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/admin/map_layers/:id
  # レイヤーのメタ情報を更新
  def update
    if @layer.update(layer_params)
      render json: @layer.display_config
    else
      render json: { errors: @layer.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/admin/map_layers/:id
  # レイヤーとそのデータを削除
  def destroy
    @layer.destroy
    head :no_content
  end

  # POST /api/v1/admin/map_layers/:id/append_features
  # 既存レイヤーに新しいフィーチャーを追記
  def append_features
    unless params[:file].present?
      render json: { error: 'ファイルが必要です' }, status: :unprocessable_entity
      return
    end

    result = import_geojson_file(params[:file], @layer, append: true)

    if result[:success]
      @layer.update_feature_count!
      render json: {
        message: "#{result[:count]}件のフィーチャーを追加しました",
        layer: @layer.display_config
      }
    else
      render json: { error: result[:error] }, status: :unprocessable_entity
    end
  end

  # POST /api/v1/admin/map_layers/:id/replace_features
  # レイヤーデータを完全上書き
  def replace_features
    unless params[:file].present?
      render json: { error: 'ファイルが必要です' }, status: :unprocessable_entity
      return
    end

    # 既存データを削除
    case @layer.layer_type
    when 'school_districts'
      @layer.school_districts.destroy_all
    end

    # 新しいデータをインポート
    result = import_geojson_file(params[:file], @layer)

    if result[:success]
      @layer.update_feature_count!
      render json: {
        message: "データを上書きしました（#{result[:count]}件）",
        layer: @layer.display_config
      }
    else
      render json: { error: result[:error] }, status: :unprocessable_entity
    end
  end

  private

  def set_map_layer
    @layer = current_tenant.map_layers.find(params[:id])
  end

  def layer_params
    params.permit(:name, :layer_key, :description, :layer_type, :color, :opacity, :display_order, :is_active, :icon, :attribution)
  end

  # GeoJSONファイルをインポート
  # @param file [ActionDispatch::Http::UploadedFile] アップロードされたファイル
  # @param layer [MapLayer] 対象レイヤー
  # @param append [Boolean] 既存データに追記するか（デフォルト: false）
  # @return [Hash] { success: Boolean, count: Integer, error: String }
  def import_geojson_file(file, layer, append: false)
    begin
      # ファイルサイズチェック（100MB制限）
      if file.size > 100.megabytes
        return { success: false, error: 'ファイルサイズが大きすぎます（最大100MB）' }
      end

      # JSONを解析
      file_content = file.read
      geojson = JSON.parse(file_content)

      # GeoJSON形式チェック
      unless geojson['type'] == 'FeatureCollection' && geojson['features'].is_a?(Array)
        return { success: false, error: 'FeatureCollection形式のGeoJSONが必要です' }
      end

      # レイヤータイプに応じてデータをインポート
      case layer.layer_type
      when 'school_districts'
        count = import_school_districts(geojson, layer)
        { success: true, count: count }
      else
        { success: false, error: 'サポートされていないレイヤータイプです' }
      end

    rescue JSON::ParserError => e
      { success: false, error: "JSONの解析に失敗しました: #{e.message}" }
    rescue => e
      { success: false, error: "インポートエラー: #{e.message}" }
    end
  end

  # 学区データをインポート
  def import_school_districts(geojson, layer)
    count = 0

    # レイヤー名から学校種別を判定
    detected_school_type = if layer.name.include?('中学')
                            '中学校'
                          elsif layer.name.include?('高校') || layer.name.include?('高等学校')
                            '高校'
                          else
                            '小学校'
                          end

    geojson['features'].each do |feature|
      properties = feature['properties']
      geometry = feature['geometry']

      # 国土数値情報の標準的なプロパティマッピング（実際の構造に基づく）
      # 小学校: A27_*** プロパティ
      #   A27_001: 都道府県コード（例：11208）
      #   A27_002: 設置者名（例：所沢市立）
      #   A27_003: 学校コード（例：B111220800179）
      #   A27_004: 学校名（例：泉小学校）
      #   A27_005: 住所（例：所沢市山口657）
      # 中学校: A32_*** プロパティ
      #   A32_001: 都道府県コード（例：11230）
      #   A32_002: 市区町村名（例：新座市）
      #   A32_003: 学校コード（例：C111223000062）
      #   A32_004: 学校名（例：第六中学校）
      #   A32_005: 住所（例：新座市野寺4-8-1）
      school_name = properties['A32_004'] || properties['A27_004'] || properties['school_name'] || '不明'
      city = properties['A32_002'] || properties['A27_002'] || properties['city'] || ''
      school_code = (properties['A32_003'] || properties['A27_003'] || properties['code'])&.to_s || ''
      district_name = properties['name'] || "#{school_name}区"

      school_district = layer.school_districts.build(
        name: district_name,
        school_name: school_name,
        school_code: school_code,
        prefecture: properties['prefecture'] || '埼玉県',
        city: city,
        school_type: properties['school_type'] || detected_school_type,
        geometry: geometry
      )

      if school_district.save
        count += 1
      else
        Rails.logger.error("学区データの保存に失敗: #{school_district.errors.full_messages}")
      end
    end

    count
  end
end
