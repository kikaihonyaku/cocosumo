class Api::V1::PublishedContentsController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login

  # GET /api/v1/published_contents?q=検索ワード
  def index
    query = params[:q].to_s.strip

    vr_tours = VrTour.joins(room: :building)
                     .where(buildings: { tenant_id: current_tenant.id })
                     .where(status: :published)
                     .includes(room: :building)

    virtual_stagings = VirtualStaging.joins(room: :building)
                                     .where(buildings: { tenant_id: current_tenant.id })
                                     .where(status: :published)
                                     .includes(room: :building)

    property_publications = PropertyPublication.joins(room: :building)
                                               .where(buildings: { tenant_id: current_tenant.id })
                                               .where(status: :published)
                                               .includes(room: :building)

    if query.present?
      like_query = "%#{query}%"
      vr_tours = vr_tours.where(
        "vr_tours.title ILIKE :q OR buildings.name ILIKE :q OR rooms.room_number ILIKE :q",
        q: like_query
      )
      virtual_stagings = virtual_stagings.where(
        "virtual_stagings.title ILIKE :q OR buildings.name ILIKE :q OR rooms.room_number ILIKE :q",
        q: like_query
      )
      property_publications = property_publications.where(
        "property_publications.title ILIKE :q OR buildings.name ILIKE :q OR rooms.room_number ILIKE :q",
        q: like_query
      )
    end

    render json: {
      vr_tours: vr_tours.limit(50).map { |vt| vr_tour_json(vt) },
      virtual_stagings: virtual_stagings.limit(50).map { |vs| virtual_staging_json(vs) },
      property_publications: property_publications.limit(50).map { |pp_record| publication_json(pp_record) }
    }
  end

  private

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end

  def vr_tour_json(vt)
    {
      id: vt.id,
      title: vt.title,
      public_id: vt.public_id,
      public_url: vt.public_url,
      thumbnail_url: vt.thumbnail_url,
      building_name: vt.room&.building&.name,
      room_number: vt.room&.room_number
    }
  end

  def virtual_staging_json(vs)
    {
      id: vs.id,
      title: vs.title,
      public_id: vs.public_id,
      public_url: vs.public_url,
      thumbnail_url: vs.thumbnail_url,
      building_name: vs.room&.building&.name,
      room_number: vs.room&.room_number
    }
  end

  def publication_json(pp_record)
    {
      id: pp_record.id,
      title: pp_record.title,
      publication_id: pp_record.publication_id,
      public_url: pp_record.public_url,
      thumbnail_url: pp_record.thumbnail_url,
      building_name: pp_record.room&.building&.name,
      room_number: pp_record.room&.room_number
    }
  end
end
