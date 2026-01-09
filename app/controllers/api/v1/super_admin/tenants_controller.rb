class Api::V1::SuperAdmin::TenantsController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :require_super_admin
  before_action :set_tenant, only: [:show, :update, :destroy, :suspend, :reactivate, :impersonate]

  # GET /api/v1/super_admin/tenants
  def index
    @tenants = Tenant.ordered.includes(:users, :buildings)

    # フィルタリング
    @tenants = @tenants.where(status: params[:status]) if params[:status].present?
    @tenants = @tenants.where('name ILIKE ?', "%#{params[:search]}%") if params[:search].present?

    render json: @tenants.map { |t| tenant_with_stats(t) }
  end

  # GET /api/v1/super_admin/tenants/:id
  def show
    render json: tenant_with_stats(@tenant).merge(
      recent_users: @tenant.users.order(created_at: :desc).limit(5).as_json(only: [:id, :name, :email, :role]),
      recent_audit_logs: @tenant.admin_audit_logs.recent.limit(10).as_json(include: { user: { only: [:id, :name] } })
    )
  end

  # POST /api/v1/super_admin/tenants
  def create
    @tenant = Tenant.new(tenant_params)
    @tenant.created_by = current_user

    if @tenant.save
      AdminAuditLog.log_action(current_user, 'create', @tenant)
      render json: tenant_with_stats(@tenant), status: :created
    else
      render json: { errors: @tenant.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /api/v1/super_admin/tenants/:id
  def update
    if @tenant.update(tenant_params)
      AdminAuditLog.log_action(current_user, 'update', @tenant,
        changes: @tenant.previous_changes.except('updated_at'))
      render json: tenant_with_stats(@tenant)
    else
      render json: { errors: @tenant.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/super_admin/tenants/:id
  def destroy
    @tenant.update!(status: :deleted)
    AdminAuditLog.log_action(current_user, 'delete', @tenant)
    render json: { success: true, message: 'テナントを削除しました' }
  end

  # POST /api/v1/super_admin/tenants/:id/suspend
  def suspend
    @tenant.suspend!(reason: params[:reason], by_user: current_user)
    render json: { success: true, message: 'テナントを停止しました' }
  end

  # POST /api/v1/super_admin/tenants/:id/reactivate
  def reactivate
    @tenant.reactivate!(by_user: current_user)
    render json: { success: true, message: 'テナントを再有効化しました' }
  end

  # POST /api/v1/super_admin/tenants/:id/impersonate
  def impersonate
    # 元のテナントを保存
    session[:original_tenant_id] = current_user.tenant_id
    session[:impersonating_tenant_id] = @tenant.id

    AdminAuditLog.log_action(current_user, 'impersonate_start', @tenant)

    render json: {
      success: true,
      message: "#{@tenant.name}としてログインしました",
      tenant: tenant_with_stats(@tenant)
    }
  end

  # POST /api/v1/super_admin/tenants/stop_impersonation
  def stop_impersonation
    if session[:impersonating_tenant_id]
      impersonated_tenant = Tenant.find_by(id: session[:impersonating_tenant_id])
      AdminAuditLog.log_action(current_user, 'impersonate_end', impersonated_tenant)
    end

    session.delete(:impersonating_tenant_id)
    session.delete(:original_tenant_id)

    render json: { success: true, message: '代理ログインを終了しました' }
  end

  # GET /api/v1/super_admin/tenants/dashboard
  def dashboard
    render json: {
      total_tenants: Tenant.count,
      active_tenants: Tenant.active.count,
      suspended_tenants: Tenant.suspended.count,
      total_users: User.count,
      total_buildings: Building.kept.count,
      recent_tenants: Tenant.ordered.limit(5).map { |t| tenant_with_stats(t) },
      recent_audit_logs: AdminAuditLog.recent.limit(20).as_json(include: { user: { only: [:id, :name] } })
    }
  end

  private

  def set_tenant
    @tenant = Tenant.find(params[:id])
  end

  def tenant_params
    params.permit(:name, :subdomain, :status, :plan, :max_users, :max_buildings, settings: {})
  end

  def tenant_with_stats(tenant)
    tenant.as_json.merge(
      statistics: tenant.statistics,
      created_by_name: tenant.created_by&.name
    )
  end
end
