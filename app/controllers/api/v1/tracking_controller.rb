class Api::V1::TrackingController < ApplicationController
  skip_before_action :verify_authenticity_token

  # GET /api/v1/t/:token
  def redirect
    tracking = MessageTracking.find_by(token: params[:token])

    unless tracking
      head :not_found
      return
    end

    tracking.record_click!
    redirect_to tracking.destination_url, allow_other_host: true
  end
end
