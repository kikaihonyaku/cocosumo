require 'csv'

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
    when 'address_points'
      @layer.address_points.destroy_all
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

  # ファイルをインポート（GeoJSONまたはCSV）
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

      file_content = file.read
      filename = file.original_filename.downcase

      # CSVファイルの場合
      if filename.end_with?('.csv')
        return import_csv_file(file_content, layer)
      end

      # ZIPファイルの場合（CSVを含むZIP）
      if filename.end_with?('.zip')
        return import_zip_file(file, layer)
      end

      # GeoJSONファイルの場合
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
      when 'address_points'
        count = import_address_points_from_geojson(geojson, layer)
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

  # CSVファイルをインポート
  def import_csv_file(file_content, layer)
    # 国土数値情報のCSVはShift-JISエンコーディング
    encodings = ['Shift_JIS', 'UTF-8', 'Windows-31J']
    csv_data = nil

    encodings.each do |encoding|
      begin
        csv_data = CSV.parse(file_content.force_encoding(encoding).encode('UTF-8'), headers: true)
        break
      rescue Encoding::InvalidByteSequenceError, Encoding::UndefinedConversionError
        next
      end
    end

    return { success: false, error: 'CSVのエンコーディングを解析できませんでした' } unless csv_data

    # 緯度・経度カラムを検出
    lat_column = csv_data.headers.find { |h| h&.include?('緯度') }
    lng_column = csv_data.headers.find { |h| h&.include?('経度') }

    unless lat_column && lng_column
      return { success: false, error: 'CSVに緯度・経度カラムが見つかりません' }
    end

    count = 0
    csv_data.each do |row|
      lat = row[lat_column]&.to_f
      lng = row[lng_column]&.to_f

      next if lat.nil? || lng.nil? || lat.zero? || lng.zero?

      # 国土数値情報のCSVフォーマットを解析
      prefecture = row['都道府県名'] || row[csv_data.headers.find { |h| h&.include?('都道府県') }]
      city = row['市区町村名'] || row[csv_data.headers.find { |h| h&.include?('市区町村') }]
      district = row['大字_丁目名'] || row[csv_data.headers.find { |h| h&.include?('大字') || h&.include?('丁目') }]
      block_number = row['街区符号_地番'] || row[csv_data.headers.find { |h| h&.include?('地番') || h&.include?('街区') }]
      representative = row['代表フラグ']&.to_s == '1'

      address_point = layer.address_points.build(
        prefecture: prefecture,
        city: city,
        district: district,
        block_number: block_number,
        latitude: lat,
        longitude: lng,
        representative: representative
      )

      if address_point.save
        count += 1
      else
        Rails.logger.error("住所ポイントの保存に失敗: #{address_point.errors.full_messages}")
      end
    end

    { success: true, count: count }
  end

  # ZIPファイルをインポート（CSVを含むZIP）
  def import_zip_file(file, layer)
    require 'zip'
    require 'tempfile'

    total_count = 0

    Zip::File.open(file.tempfile) do |zip|
      zip.each do |entry|
        next unless entry.name.downcase.end_with?('.csv')

        content = entry.get_input_stream.read
        result = import_csv_file(content, layer)

        if result[:success]
          total_count += result[:count]
        else
          return result
        end
      end
    end

    if total_count > 0
      { success: true, count: total_count }
    else
      { success: false, error: 'ZIPファイル内にCSVが見つかりませんでした' }
    end
  end

  # GeoJSONから住所ポイントをインポート
  def import_address_points_from_geojson(geojson, layer)
    count = 0

    geojson['features'].each do |feature|
      geometry = feature['geometry']
      next unless geometry && geometry['type'] == 'Point'

      properties = feature['properties'] || {}
      coordinates = geometry['coordinates']

      address_point = layer.address_points.build(
        prefecture: properties['prefecture'] || properties['都道府県名'],
        city: properties['city'] || properties['市区町村名'],
        district: properties['district'] || properties['大字_丁目名'],
        block_number: properties['block_number'] || properties['街区符号_地番'],
        latitude: coordinates[1],
        longitude: coordinates[0],
        representative: properties['representative'] || properties['代表フラグ'] == '1'
      )

      if address_point.save
        count += 1
      else
        Rails.logger.error("住所ポイントの保存に失敗: #{address_point.errors.full_messages}")
      end
    end

    count
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
