# frozen_string_literal: true

class Api::V1::Admin::SuumoImportsController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :require_admin

  # POST /api/v1/admin/suumo_imports
  # Start a SUUMO import job
  def create
    url = params[:url]
    tenant_id = params[:tenant_id] || current_tenant&.id

    unless url.present?
      render json: { error: "URLが必要です" }, status: :unprocessable_entity
      return
    end

    unless url.start_with?("https://suumo.jp/")
      render json: { error: "SUUMOのURLを指定してください" }, status: :unprocessable_entity
      return
    end

    tenant = Tenant.find_by(id: tenant_id)
    unless tenant
      render json: { error: "テナントが見つかりません" }, status: :unprocessable_entity
      return
    end

    options = {
      max_pages: params[:max_pages]&.to_i,
      skip_images: params[:skip_images] == true || params[:skip_images] == "true"
    }.compact

    # Start background job
    job = SuumoImportJob.perform_later(
      tenant_id: tenant.id,
      url: url,
      options: options
    )

    render json: {
      message: "インポートジョブを開始しました",
      job_id: job.job_id,
      tenant: tenant.name,
      url: url,
      options: options
    }, status: :accepted
  end

  # POST /api/v1/admin/suumo_imports/sync
  # Run SUUMO import synchronously (for small imports)
  def sync
    url = params[:url]
    tenant_id = params[:tenant_id] || current_tenant&.id

    unless url.present?
      render json: { error: "URLが必要です" }, status: :unprocessable_entity
      return
    end

    unless url.start_with?("https://suumo.jp/")
      render json: { error: "SUUMOのURLを指定してください" }, status: :unprocessable_entity
      return
    end

    tenant = Tenant.find_by(id: tenant_id)
    unless tenant
      render json: { error: "テナントが見つかりません" }, status: :unprocessable_entity
      return
    end

    options = {
      max_pages: params[:max_pages]&.to_i || 1, # Limit to 1 page for sync
      skip_images: params[:skip_images] == true || params[:skip_images] == "true"
    }.compact

    # Run synchronously
    service = Suumo::ScraperService.new(tenant: tenant, options: options)
    stats = service.scrape(url)

    render json: {
      message: "インポートが完了しました",
      stats: stats
    }
  rescue StandardError => e
    Rails.logger.error "[SUUMO Import] Error: #{e.message}"
    Rails.logger.error e.backtrace.first(10).join("\n")

    render json: {
      error: "インポート中にエラーが発生しました",
      details: e.message
    }, status: :internal_server_error
  end

  # POST /api/v1/admin/suumo_imports/preview
  # Preview SUUMO page parsing without saving
  def preview
    url = params[:url]

    unless url.present?
      render json: { error: "URLが必要です" }, status: :unprocessable_entity
      return
    end

    unless url.start_with?("https://suumo.jp/")
      render json: { error: "SUUMOのURLを指定してください" }, status: :unprocessable_entity
      return
    end

    # Fetch and parse the page
    response = HTTParty.get(
      url,
      headers: {
        "User-Agent" => Rails.application.config.suumo.user_agent,
        "Accept" => "text/html"
      },
      timeout: 30
    )

    unless response.success?
      render json: { error: "ページの取得に失敗しました: HTTP #{response.code}" }, status: :bad_gateway
      return
    end

    parser = Suumo::SearchPageParser.new(response.body)
    items = parser.property_items

    render json: {
      total_count: parser.total_count,
      properties_on_page: items.size,
      has_next_page: parser.next_page_url.present?,
      properties: items.map do |item|
        {
          building_name: item[:building_name],
          address: item[:address],
          building_type: item[:building_type],
          structure: item[:structure],
          floors: item[:floors],
          built_date: item[:built_date]&.to_s,
          building_images_count: item[:building_image_urls]&.size || 0,
          rooms: item[:rooms]&.map do |room|
            {
              floor: room[:floor],
              room_type: room[:room_type],
              area: room[:area],
              rent: room[:rent],
              management_fee: room[:management_fee],
              deposit: room[:deposit],
              key_money: room[:key_money],
              images_count: room[:image_urls]&.size || 0
            }
          end
        }
      end
    }
  rescue StandardError => e
    Rails.logger.error "[SUUMO Preview] Error: #{e.message}"

    render json: {
      error: "プレビュー中にエラーが発生しました",
      details: e.message
    }, status: :internal_server_error
  end

  # GET /api/v1/admin/suumo_imports/tenants
  # List available tenants for import
  def tenants
    tenants = Tenant.all.map do |tenant|
      {
        id: tenant.id,
        name: tenant.name,
        buildings_count: tenant.buildings.count,
        rooms_count: Room.joins(:building).where(buildings: { tenant_id: tenant.id }).count
      }
    end

    render json: { tenants: tenants }
  end
end
