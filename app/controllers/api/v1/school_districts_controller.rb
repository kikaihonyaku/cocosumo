class Api::V1::SchoolDistrictsController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login

  # GET /api/v1/school_districts
  # GeoJSON FeatureCollectionとして学区データを返す
  def index
    # 検索条件によるフィルタリング
    @districts = SchoolDistrict.all

    # 都道府県でフィルタ
    @districts = @districts.by_prefecture(params[:prefecture]) if params[:prefecture].present?

    # 市区町村でフィルタ
    @districts = @districts.by_city(params[:city]) if params[:city].present?

    # 学校種別でフィルタ
    if params[:school_type].present?
      case params[:school_type]
      when 'elementary'
        @districts = @districts.elementary_schools
      when 'junior_high'
        @districts = @districts.junior_high_schools
      end
    end

    # 境界ボックスでフィルタ（PostGISを使用）
    if params[:bounds].present?
      bounds = params[:bounds].split(',').map(&:to_f)
      if bounds.length == 4
        south, west, north, east = bounds
        @districts = @districts.within_bounds(south, west, north, east)
      end
    end

    # GeoJSON FeatureCollectionとして返す
    render json: SchoolDistrict.to_geojson_feature_collection(@districts)
  end

  # GET /api/v1/school_districts/:id
  def show
    @district = SchoolDistrict.find(params[:id])
    render json: @district.to_geojson_feature
  end

  # GET /api/v1/school_districts/find_by_location
  # 指定座標を含む学区を検索
  def find_by_location
    lng = params[:lng].to_f
    lat = params[:lat].to_f

    @districts = SchoolDistrict.containing_point(lng, lat)

    # 学校種別でフィルタ
    if params[:school_type].present?
      case params[:school_type]
      when 'elementary'
        @districts = @districts.elementary_schools
      when 'junior_high'
        @districts = @districts.junior_high_schools
      end
    end

    render json: SchoolDistrict.to_geojson_feature_collection(@districts)
  end

  # GET /api/v1/school_districts/stats
  # 統計情報を返す
  def stats
    total_count = SchoolDistrict.count
    elementary_count = SchoolDistrict.elementary_schools.count
    junior_high_count = SchoolDistrict.junior_high_schools.count

    # 都道府県別の件数
    prefectures = SchoolDistrict.group(:prefecture).count

    # 市区町村別の件数
    cities = SchoolDistrict.group(:city).count

    render json: {
      total_count: total_count,
      by_school_type: {
        elementary: elementary_count,
        junior_high: junior_high_count
      },
      by_prefecture: prefectures,
      by_city: cities
    }
  end

  private

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end
end
