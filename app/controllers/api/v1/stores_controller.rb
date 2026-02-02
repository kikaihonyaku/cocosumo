class Api::V1::StoresController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :set_store, only: [:show, :update]

  # GET /api/v1/stores
  def index
    @stores = current_tenant.stores.ordered

    # 紐付き建物数と座標を含めて返す
    render json: @stores.map { |store|
      store_json(store)
    }
  end

  # GET /api/v1/stores/:id
  def show
    render json: store_json(@store)
  end

  # POST /api/v1/stores
  def create
    @store = current_tenant.stores.build(store_params)

    if @store.save
      render json: store_json(@store), status: :created
    else
      render json: { errors: @store.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/stores/:id
  def update
    if @store.update(store_params)
      render json: store_json(@store)
    else
      render json: { errors: @store.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # POST /api/v1/stores/geocode
  # 住所から座標を取得（保存せずに座標のみ返す）
  def geocode
    address = params[:address]

    if address.blank?
      render json: { error: '住所が指定されていません' }, status: :bad_request
      return
    end

    # Geocoder gemを使って住所から座標を取得
    results = Geocoder.search(address)

    if results.any?
      result = results.first
      render json: {
        latitude: result.latitude,
        longitude: result.longitude
      }
    else
      render json: { error: '住所から座標を取得できませんでした' }, status: :unprocessable_entity
    end
  end

  private

  def set_store
    @store = current_tenant.stores.find(params[:id])
  end

  def store_params
    params.require(:store).permit(:name, :code, :email, :address, :latitude, :longitude)
  end

  def store_json(store)
    {
      id: store.id,
      name: store.name,
      code: store.code,
      email: store.email,
      address: store.address,
      latitude: store.latitude,
      longitude: store.longitude,
      buildings_count: store.buildings.kept.count,
      inquiry_email_address: store.inquiry_email_address,
      portal_inquiry_email_addresses: store.portal_inquiry_email_addresses,
      created_at: store.created_at,
      updated_at: store.updated_at
    }
  end

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end
end
