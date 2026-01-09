class ApplicationController < ActionController::Base
  include TenantResolver

  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  helper_method :current_user, :current_tenant, :logged_in?, :impersonating?, :original_tenant

  private

  # 現在のユーザーを取得
  def current_user
    @current_user ||= User.find_by(id: session[:user_id]) if session[:user_id]
  end

  # 現在のテナントを取得
  def current_tenant
    return @current_tenant if defined?(@current_tenant)

    # 1. 代理ログイン中の場合
    if session[:impersonating_tenant_id]
      @current_tenant = Tenant.find_by(id: session[:impersonating_tenant_id])
      return @current_tenant
    end

    # 2. サブドメインから解決されたテナント
    if @resolved_tenant
      @current_tenant = @resolved_tenant
      return @current_tenant
    end

    # 3. セッションからのテナント（フォールバック）
    @current_tenant = Tenant.find_by(id: session[:tenant_id]) if session[:tenant_id]
    @current_tenant
  end

  # ログイン状態を確認
  def logged_in?
    current_user.present?
  end

  # 代理ログイン中かどうか
  def impersonating?
    session[:impersonating_tenant_id].present?
  end

  # 代理ログイン時の元のテナント
  def original_tenant
    return nil unless impersonating?
    @original_tenant ||= Tenant.find_by(id: session[:original_tenant_id])
  end

  # ログインを要求
  def require_login
    unless logged_in?
      respond_to do |format|
        format.html { redirect_to root_path, alert: 'ログインが必要です' }
        format.json { render json: { error: '認証が必要です' }, status: :unauthorized }
      end
    end
  end

  # 管理者権限を要求
  def require_admin
    unless current_user&.admin? || current_user&.super_admin?
      respond_to do |format|
        format.html { redirect_to root_path, alert: '管理者権限が必要です' }
        format.json { render json: { error: '管理者権限が必要です' }, status: :forbidden }
      end
    end
  end

  # スーパー管理者権限を要求
  def require_super_admin
    unless current_user&.super_admin?
      respond_to do |format|
        format.html { redirect_to root_path, alert: 'スーパー管理者権限が必要です' }
        format.json { render json: { error: 'スーパー管理者権限が必要です' }, status: :forbidden }
      end
    end
  end
end
