class Api::V1::AuthController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login, only: [:me, :logout, :change_password, :profile, :update_profile]

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
    # サブドメインからテナントが解決された場合、そのテナント内でユーザーを検索
    if @resolved_tenant
      user = @resolved_tenant.users.find_by(email: params[:email])
    else
      # サブドメインが無い場合はエラー
      return render json: {
        success: false,
        error: 'テナントを特定できません。正しいURLからアクセスしてください。'
      }, status: :bad_request
    end

    # ユーザーが存在しない場合
    unless user
      return render json: {
        success: false,
        error: 'メールアドレスまたはパスワードが正しくありません'
      }, status: :unauthorized
    end

    # アカウントロック中の場合
    if user.locked?
      return render json: {
        success: false,
        error: 'アカウントがロックされています。しばらく経ってから再試行してください。'
      }, status: :forbidden
    end

    # 無効なアカウントの場合
    unless user.active?
      return render json: {
        success: false,
        error: 'このアカウントは無効化されています。管理者にお問い合わせください。'
      }, status: :forbidden
    end

    # パスワード認証
    if user.authenticate(params[:password])
      user.record_login!
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
      user.increment_failed_login!
      remaining = User::MAX_FAILED_LOGIN_ATTEMPTS - user.failed_login_count
      error_message = if user.locked?
        'アカウントがロックされました。しばらく経ってから再試行してください。'
      elsif remaining > 0
        "メールアドレスまたはパスワードが正しくありません（残り#{remaining}回）"
      else
        'メールアドレスまたはパスワードが正しくありません'
      end

      render json: {
        success: false,
        error: error_message
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

  # GET /api/v1/auth/profile - プロフィール情報取得
  def profile
    render json: {
      user: current_user.as_json(
        only: [:id, :name, :email, :phone, :position, :employee_code, :auth_provider, :last_login_at, :password_changed_at, :created_at],
        include: { store: { only: [:id, :name] } }
      )
    }
  end

  # PATCH /api/v1/auth/profile - プロフィール更新
  def update_profile
    permitted = [:name, :phone]

    if current_user.update(params.permit(*permitted))
      render json: {
        success: true,
        message: 'プロフィールを更新しました',
        user: current_user.as_json(
          only: [:id, :name, :email, :phone, :position, :employee_code, :auth_provider],
          include: { store: { only: [:id, :name] } }
        )
      }
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
