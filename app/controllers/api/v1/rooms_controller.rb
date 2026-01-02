class Api::V1::RoomsController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login
  before_action :set_room, only: [:show, :update, :destroy, :upload_floorplan, :delete_floorplan]

  # GET /api/v1/rooms
  def index
    if params[:building_id]
      @rooms = current_tenant.buildings.find(params[:building_id]).rooms
    else
      @rooms = Room.joins(:building).where(buildings: { tenant_id: current_tenant.id })
    end

    @rooms = @rooms.order(created_at: :desc)
    render json: @rooms.as_json(include: :building, methods: [:status_label, :room_type_label])
  end

  # GET /api/v1/rooms/:id
  def show
    room_json = @room.as_json(
      include: {
        building: {},
        room_photos: {},
        vr_tours: {}
      },
      methods: [:status_label, :room_type_label]
    )

    # 募集図面PDFのURLを追加
    if @room.floorplan_pdf.attached?
      room_json['floorplan_pdf_url'] = if Rails.env.production?
        @room.floorplan_pdf.url
      else
        Rails.application.routes.url_helpers.rails_blob_path(@room.floorplan_pdf, only_path: true)
      end
      room_json['floorplan_pdf_filename'] = @room.floorplan_pdf.filename.to_s
    end

    render json: room_json
  end

  # POST /api/v1/buildings/:building_id/rooms
  def create
    # ネストされたルートとスタンドアロンの両方に対応
    building_id = params[:building_id] || params[:room][:building_id]
    building = current_tenant.buildings.find(building_id)
    @room = building.rooms.build(room_params)

    if @room.save
      render json: @room.as_json(methods: [:status_label, :room_type_label]), status: :created
    else
      render json: { errors: @room.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/rooms/:id
  def update
    if @room.update(room_params)
      render json: @room
    else
      render json: { errors: @room.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/rooms/:id
  def destroy
    @room.destroy
    head :no_content
  end

  # POST /api/v1/rooms/:id/upload_floorplan
  def upload_floorplan
    unless params[:file].present?
      return render json: { error: 'ファイルが指定されていません' }, status: :bad_request
    end

    # PDFファイルのみ許可
    unless params[:file].content_type == 'application/pdf'
      return render json: { error: 'PDFファイルのみアップロード可能です' }, status: :unprocessable_entity
    end

    @room.floorplan_pdf.attach(params[:file])

    if @room.floorplan_pdf.attached?
      floorplan_url = if Rails.env.production?
        @room.floorplan_pdf.url
      else
        Rails.application.routes.url_helpers.rails_blob_path(@room.floorplan_pdf, only_path: true)
      end

      render json: {
        success: true,
        message: '募集図面をアップロードしました',
        floorplan_pdf_url: floorplan_url,
        floorplan_pdf_filename: @room.floorplan_pdf.filename.to_s
      }
    else
      render json: { error: 'アップロードに失敗しました' }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/rooms/:id/delete_floorplan
  def delete_floorplan
    if @room.floorplan_pdf.attached?
      @room.floorplan_pdf.purge
      render json: { success: true, message: '募集図面を削除しました' }
    else
      render json: { error: '募集図面が存在しません' }, status: :not_found
    end
  end

  private

  def set_room
    @room = Room.joins(:building).where(buildings: { tenant_id: current_tenant.id }).find(params[:id])
  end

  def room_params
    params.require(:room).permit(
      :room_number,
      :floor,
      :room_type,
      :area,
      :rent,
      :management_fee,
      :deposit,
      :key_money,
      :status,
      :description,
      :facilities,
      :tenant_name,
      :tenant_phone,
      :contract_start_date,
      :contract_end_date,
      :notes,
      :direction,
      :parking_fee,
      :available_date,
      :renewal_fee,
      :guarantor_required,
      :pets_allowed,
      :two_person_allowed,
      :office_use_allowed
    )
  end

  def require_login
    unless current_user
      render json: { error: '認証が必要です' }, status: :unauthorized
    end
  end
end
