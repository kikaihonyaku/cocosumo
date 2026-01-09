class Api::V1::AuthController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login, only: [:me, :logout, :change_password]

  # GET /api/v1/auth/me - 現在のユーザー情報取得
  def me
    response_data = {
      user: {
        id: current_user.id,
        email: current_user.email,
        name: current_user.name,
        role: current_user.role,
        tenant_id: current_user.tenant_id,
        auth_provider: current_user.auth_provider
      },
      tenant: current_tenant&.as_json(only: [:id, :name, :subdomain, :status]),
      impersonating: impersonating?,
      original_tenant: original_tenant&.as_json(only: [:id, :name, :subdomain])
    }

    render json: response_data
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
          tenant_id: user.tenant_id,
          auth_provider: user.auth_provider
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

  # POST /api/v1/auth/change_password - パスワード変更
  def change_password
    # OAuth連携ユーザーはパスワード変更不可
    if current_user.auth_provider == 'google'
      return render json: {
        success: false,
        error: '外部認証（Google等）でログインしているため、パスワードは変更できません'
      }, status: :forbidden
    end

    # 現在のパスワードを確認
    unless current_user.authenticate(params[:current_password])
      return render json: {
        success: false,
        error: '現在のパスワードが正しくありません'
      }, status: :unprocessable_entity
    end

    # 新しいパスワードのバリデーション
    if params[:new_password].blank?
      return render json: {
        success: false,
        error: '新しいパスワードを入力してください'
      }, status: :unprocessable_entity
    end

    if params[:new_password].length < 8
      return render json: {
        success: false,
        error: 'パスワードは8文字以上で入力してください'
      }, status: :unprocessable_entity
    end

    # パスワード更新
    if current_user.update(password: params[:new_password])
      render json: { success: true, message: 'パスワードを変更しました' }
    else
      render json: {
        success: false,
        error: current_user.errors.full_messages.join(', ')
      }, status: :unprocessable_entity
    end
  end

  private

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end
end
