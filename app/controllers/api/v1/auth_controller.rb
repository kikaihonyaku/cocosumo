class Api::V1::AuthController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login, only: [:me, :logout]

  # GET /api/v1/auth/me - 現在のユーザー情報取得
  def me
    render json: {
      user: {
        id: current_user.id,
        email: current_user.email,
        name: current_user.name,
        role: current_user.role,
        tenant_id: current_user.tenant_id,
        auth_provider: current_user.auth_provider
      }
    }
  end

  # POST /api/v1/auth/login - ログイン
  def login
    user = User.find_by(email: params[:email])

    if user&.authenticate(params[:password])
      session[:user_id] = user.id
      session[:tenant_id] = user.tenant_id

      render json: {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenant_id: user.tenant_id
        }
      }
    else
      render json: {
        success: false,
        error: 'メールアドレスまたはパスワードが正しくありません'
      }, status: :unauthorized
    end
  end

  # POST /api/v1/auth/logout - ログアウト
  def logout
    session.delete(:user_id)
    session.delete(:tenant_id)
    render json: { success: true, message: 'ログアウトしました' }
  end

  private

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end
end
