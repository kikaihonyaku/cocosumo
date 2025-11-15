class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  helper_method :current_user, :current_tenant, :logged_in?

  private

  # 現在のユーザーを取得
  def current_user
    @current_user ||= User.find_by(id: session[:user_id]) if session[:user_id]
  end

  # 現在のテナントを取得
  def current_tenant
    @current_tenant ||= Tenant.find_by(id: session[:tenant_id]) if session[:tenant_id]
  end

  # ログイン状態を確認
  def logged_in?
    current_user.present?
  end

  # ログインを要求
  def require_login
    unless logged_in?
      redirect_to root_path, alert: 'ログインが必要です'
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
end
