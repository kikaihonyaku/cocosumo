class Api::V1::RailwayLinesController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login

  # GET /api/v1/railway_lines
  # 路線一覧（会社別グループ、駅含む）
  def index
    railway_lines = RailwayLine.active.includes(:stations).by_company

    # 会社別にグループ化
    grouped = railway_lines.group_by(&:company_code).map do |company_code, lines|
      {
        company: lines.first.company,
        company_code: company_code,
        lines: lines.map do |line|
          {
            id: line.id,
            code: line.code,
            name: line.name,
            color: line.color,
            stations: line.stations.active.ordered.map do |station|
              {
                id: station.id,
                code: station.code,
                name: station.name,
                name_kana: station.name_kana
              }
            end
          }
        end
      }
    end

    render json: grouped
  end

  # GET /api/v1/railway_lines/stations_search?q=新宿
  # 駅名検索
  def stations_search
    query = params[:q].to_s.strip
    if query.blank?
      return render json: { stations: [] }
    end

    stations = Station.active
                      .includes(:railway_line)
                      .search_by_name(query)
                      .ordered
                      .limit(30)

    render json: {
      stations: stations.map do |station|
        {
          id: station.id,
          code: station.code,
          name: station.name,
          name_kana: station.name_kana,
          railway_line: {
            id: station.railway_line.id,
            code: station.railway_line.code,
            name: station.railway_line.name,
            color: station.railway_line.color
          }
        }
      end
    }
  end

  private

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end
end
