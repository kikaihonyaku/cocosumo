class Api::V1::CustomerMergesController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :require_admin, only: [:undo]

  # GET /api/v1/customer_merges
  def index
    merges = current_user.tenant.customer_merges
                         .includes(:primary_customer, :performed_by, :undone_by)
                         .recent

    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 20).to_i
    total_count = merges.count
    merges = merges.limit(per_page).offset((page - 1) * per_page)

    render json: {
      merges: merges.map { |m| merge_json(m) },
      pagination: {
        current_page: page,
        per_page: per_page,
        total_count: total_count,
        total_pages: (total_count.to_f / per_page).ceil
      }
    }
  end

  # POST /api/v1/customer_merges/:id/undo
  def undo
    merge_record = current_user.tenant.customer_merges.find(params[:id])
    CustomerMergeService.undo!(merge_record, undone_by: current_user)

    render json: {
      success: true,
      message: "統合を取り消しました"
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "統合履歴が見つかりませんでした" }, status: :not_found
  rescue CustomerMergeService::MergeError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def merge_json(merge)
    secondary_name = merge.secondary_snapshot.dig("customer_attributes", "name") || "不明"
    {
      id: merge.id,
      primary_customer: merge.primary_customer ? {
        id: merge.primary_customer.id,
        name: merge.primary_customer.name
      } : nil,
      secondary_name: secondary_name,
      performed_by: {
        id: merge.performed_by.id,
        name: merge.performed_by.name
      },
      merge_reason: merge.merge_reason,
      status: merge.status,
      created_at: merge.created_at.strftime("%Y/%m/%d %H:%M"),
      undone_at: merge.undone_at&.strftime("%Y/%m/%d %H:%M"),
      undone_by: merge.undone_by ? {
        id: merge.undone_by.id,
        name: merge.undone_by.name
      } : nil
    }
  end

  def require_login
    unless current_user
      render json: { error: "認証が必要です" }, status: :unauthorized
    end
  end

  def require_admin
    unless current_user&.admin? || current_user&.super_admin?
      render json: { error: "管理者権限が必要です" }, status: :forbidden
    end
  end
end
