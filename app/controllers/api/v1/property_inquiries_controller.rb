class Api::V1::PropertyInquiriesController < ApplicationController
  skip_before_action :verify_authenticity_token

  # POST /api/v1/property_publications/:publication_id/inquiries
  def create
    @property_publication = PropertyPublication.kept.find_by!(publication_id: params[:publication_id])

    unless @property_publication.published?
      render json: { error: 'この物件公開ページは公開されていません' }, status: :not_found
      return
    end

    @property_inquiry = @property_publication.property_inquiries.build(property_inquiry_params)

    if @property_inquiry.save
      # TODO: メール通知などの処理を追加
      render json: {
        success: true,
        message: 'お問い合わせを受け付けました。担当者より折り返しご連絡いたします。'
      }, status: :created
    else
      render json: { errors: @property_inquiry.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'この物件公開ページは見つかりませんでした' }, status: :not_found
  end

  # GET /api/v1/property_publications/:property_publication_id/inquiries (認証必要)
  def index
    return render json: { error: '認証が必要です' }, status: :unauthorized unless current_user

    @property_publication = PropertyPublication.kept.find(params[:property_publication_id])
    @property_inquiries = @property_publication.property_inquiries.recent

    render json: @property_inquiries.as_json(methods: [:formatted_created_at])
  rescue ActiveRecord::RecordNotFound
    render json: { error: '物件公開ページが見つかりませんでした' }, status: :not_found
  end

  private

  def property_inquiry_params
    params.require(:property_inquiry).permit(:name, :email, :phone, :message)
  end
end
