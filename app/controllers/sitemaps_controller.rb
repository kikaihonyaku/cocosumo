class SitemapsController < ApplicationController
  skip_before_action :verify_authenticity_token

  # GET /sitemap.xml
  def index
    @property_publications = PropertyPublication.kept.published.includes(room: :building)

    respond_to do |format|
      format.xml { render layout: false }
    end
  end

  # GET /robots.txt
  def robots
    render plain: robots_content, content_type: 'text/plain'
  end

  private

  def robots_content
    host = request.host_with_port
    protocol = request.protocol

    <<~ROBOTS
      User-agent: *
      Allow: /property/
      Disallow: /api/
      Disallow: /admin/
      Disallow: /map
      Disallow: /room/
      Disallow: /vr-tours
      Disallow: /virtual-stagings

      Sitemap: #{protocol}#{host}/sitemap.xml
    ROBOTS
  end
end
