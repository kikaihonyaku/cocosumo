class Api::V1::Admin::UsersController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :require_admin
  before_action :set_user, only: [:show, :update, :destroy]

  # GET /api/v1/admin/users
  def index
    @users = current_tenant.users.order(created_at: :desc)

    @users = @users.where(role: params[:role]) if params[:role].present?
    @users = @users.where('name ILIKE ? OR email ILIKE ?', "%#{params[:search]}%", "%#{params[:search]}%") if params[:search].present?

    render json: @users.as_json(
      only: [:id, :name, :email, :role, :created_at, :auth_provider, :phone, :position, :employee_code, :active, :last_login_at, :locked_at],
      include: { store: { only: [:id, :name] } }
    )
  end

  # GET /api/v1/admin/users/:id
  def show
    render json: @user.as_json(
      only: [:id, :name, :email, :role, :created_at, :auth_provider, :phone, :position, :employee_code, :active, :last_login_at, :locked_at, :store_id],
      include: { store: { only: [:id, :name] } }
    )
  end

  # POST /api/v1/admin/users
  def create
    @user = current_tenant.users.build(user_params)

    # super_adminはsuper_adminのみが作成可能
    if user_params[:role] == 'super_admin' && !current_user.super_admin?
      return render json: { error: 'スーパー管理者は作成できません' }, status: :forbidden
    end

    if @user.save
      AdminAuditLog.log_action(current_user, 'create', @user)
      render json: @user.as_json(only: [:id, :name, :email, :role]), status: :created
    else
      render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /api/v1/admin/users/:id
  def update
    # 自分自身のroleは変更不可
    if @user.id == current_user.id && user_params[:role].present? && user_params[:role] != current_user.role
      return render json: { error: '自分自身の権限は変更できません' }, status: :forbidden
    end

    # super_adminへの変更はsuper_adminのみ
    if user_params[:role] == 'super_admin' && !current_user.super_admin?
      return render json: { error: 'スーパー管理者権限の付与は許可されていません' }, status: :forbidden
    end

    if @user.update(user_params)
      AdminAuditLog.log_action(current_user, 'update', @user,
        changes: @user.previous_changes.except('updated_at', 'password_digest'))
      render json: @user.as_json(only: [:id, :name, :email, :role])
    else
      render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/admin/users/:id
  def destroy
    # 自分自身は削除不可
    if @user.id == current_user.id
      return render json: { error: '自分自身は削除できません' }, status: :forbidden
    end

    # super_adminの削除はsuper_adminのみ
    if @user.super_admin? && !current_user.super_admin?
      return render json: { error: 'スーパー管理者は削除できません' }, status: :forbidden
    end

    @user.destroy
    AdminAuditLog.log_action(current_user, 'delete', @user)
    render json: { success: true, message: 'ユーザーを削除しました' }
  end

  private

  def set_user
    @user = current_tenant.users.find(params[:id])
  end

  def user_params
    params.permit(:name, :email, :password, :role, :phone, :position, :employee_code, :active, :store_id)
  end

  # POST /api/v1/admin/users/:id/unlock - アカウントロック解除
  def unlock
    @user = current_tenant.users.find(params[:id])
    @user.unlock!
    AdminAuditLog.log_action(current_user, 'update', @user, changes: { locked_at: [nil, nil] })
    render json: { success: true, message: 'アカウントのロックを解除しました' }
  end
end
