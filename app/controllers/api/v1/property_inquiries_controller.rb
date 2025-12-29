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
      # メール通知を非同期で送信
      send_notification_emails(@property_inquiry)

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
    params.require(:property_inquiry).permit(:name, :email, :phone, :message, :source, :utm_source, :utm_medium, :utm_campaign, :referrer)
  end

  def send_notification_emails(property_inquiry)
    # 管理者への通知メール
    PropertyInquiryMailer.notify_admin(property_inquiry).deliver_later

    # 顧客への自動返信メール
    PropertyInquiryMailer.confirm_to_customer(property_inquiry).deliver_later
  rescue => e
    # メール送信エラーはログに記録するが、レスポンスには影響させない
    Rails.logger.error "Failed to send inquiry notification emails: #{e.message}"
  end
end
