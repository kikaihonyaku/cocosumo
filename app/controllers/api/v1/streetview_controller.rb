# frozen_string_literal: true

class Api::V1::StreetviewController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login

  # POST /api/v1/streetview/metadata
  # 指定位置のストリートビューメタデータを取得
  def metadata
    lat = params[:lat].to_f
    lng = params[:lng].to_f
    radius = params[:radius]&.to_i || 50

    service = StreetviewService.new
    result = service.get_metadata(lat, lng, radius: radius)

    render json: result
  rescue StreetviewService::StreetviewError => e
    render json: { error: e.message }, status: :service_unavailable
  end
end
