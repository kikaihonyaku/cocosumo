# frozen_string_literal: true

require "httparty"

class Api::V1::Admin::SuumoImportsController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :require_admin

  # GET /api/v1/admin/suumo_imports
  # List import histories
  def index
    histories = SuumoImportHistory.recent.includes(:tenant).limit(50)

    render json: {
      histories: histories.map { |h| history_to_json(h) }
    }
  end

  # GET /api/v1/admin/suumo_imports/:id
  # Get import history detail
  def show
    history = SuumoImportHistory.find(params[:id])

    render json: {
      history: history_to_json(history, include_logs: true)
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "履歴が見つかりません" }, status: :not_found
  end

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

    # 履歴レコードを作成
    history = SuumoImportHistory.create!(
      tenant: tenant,
      url: url,
      status: "pending",
      options: options
    )

    # Start background job
    job = SuumoImportJob.perform_later(
      tenant_id: tenant.id,
      url: url,
      options: options,
      history_id: history.id
    )

    render json: {
      message: "インポートジョブを開始しました",
      job_id: job.job_id,
      history_id: history.id,
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

    # 履歴レコードを作成
    history = SuumoImportHistory.create!(
      tenant: tenant,
      url: url,
      status: "pending",
      options: options
    )

    # 実行開始
    history.start!
    history.add_log("URL: #{url}", "info")
    history.add_log("最大ページ数: #{options[:max_pages] || 1}", "info")
    history.add_log("画像スキップ: #{options[:skip_images] ? 'はい' : 'いいえ'}", "info")

    # Run synchronously
    service = Suumo::ScraperService.new(tenant: tenant, options: options)
    stats = service.scrape(url)

    # 完了
    history.complete!(stats)

    # ログに詳細を追加
    history.add_log("物件作成: #{stats[:buildings_created]}件", "success")
    history.add_log("物件更新: #{stats[:buildings_updated]}件", "success")
    history.add_log("部屋作成: #{stats[:rooms_created]}件", "success")
    history.add_log("部屋更新: #{stats[:rooms_updated]}件", "success")
    history.add_log("画像ダウンロード: #{stats[:images_downloaded]}件", "success")
    history.add_log("画像スキップ: #{stats[:images_skipped]}件", "info")

    if stats[:errors].present?
      stats[:errors].each { |err| history.add_log("エラー: #{err}", "error") }
    end

    render json: {
      message: "インポートが完了しました",
      stats: stats,
      history_id: history.id
    }
  rescue StandardError => e
    Rails.logger.error "[SUUMO Import] Error: #{e.message}"
    Rails.logger.error e.backtrace.first(10).join("\n")

    # 履歴を失敗状態に更新
    history&.fail!(e.message)

    render json: {
      error: "インポート中にエラーが発生しました",
      details: e.message,
      history_id: history&.id
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

  private

  def history_to_json(history, include_logs: false)
    result = {
      id: history.id,
      tenant_id: history.tenant_id,
      tenant_name: history.tenant&.name,
      url: history.url,
      status: history.status,
      started_at: history.started_at&.iso8601,
      completed_at: history.completed_at&.iso8601,
      duration_seconds: history.duration_seconds,
      buildings_created: history.buildings_created,
      buildings_updated: history.buildings_updated,
      rooms_created: history.rooms_created,
      rooms_updated: history.rooms_updated,
      images_downloaded: history.images_downloaded,
      images_skipped: history.images_skipped,
      error_count: history.error_count,
      error_message: history.error_message,
      options: history.options,
      total_items_processed: history.total_items_processed,
      created_at: history.created_at&.iso8601
    }

    result[:logs] = history.parsed_logs if include_logs

    result
  end
end
