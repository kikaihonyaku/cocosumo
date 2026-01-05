class Api::V1::FacilitiesController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login

  # GET /api/v1/facilities
  # 設備マスタ一覧を返す
  def index
    facilities = Facility.active.ordered

    # カテゴリごとにグループ化
    grouped = facilities.group_by(&:category).transform_values do |items|
      items.map do |f|
        {
          code: f.code,
          name: f.name,
          is_popular: f.is_popular
        }
      end
    end

    # 人気設備のみを抽出
    popular = facilities.popular.map do |f|
      {
        code: f.code,
        name: f.name,
        category: f.category
      }
    end

    render json: {
      facilities: grouped,
      popular: popular,
      categories: Facility::CATEGORIES
    }
  end

  private

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end
end
