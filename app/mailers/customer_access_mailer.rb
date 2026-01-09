class CustomerAccessMailer < ApplicationMailer
  # 顧客へのアクセス権発行通知メール
  def notify_customer(customer_access, raw_password = nil)
    @customer_access = customer_access
    @publication = customer_access.property_publication
    @room = @publication.room
    @building = @room.building
    @raw_password = raw_password

    @access_url = customer_access_url(customer_access)

    mail(
      to: customer_access.customer_email,
      subject: "[CoCoスモ] 物件情報のご案内 - #{@building.name} #{@room.room_number}号室"
    )
  end

  private

  def customer_access_url(customer_access)
    tenant = customer_access.tenant
    base_url = tenant_base_url(tenant)
    "#{base_url}/customer/#{customer_access.access_token}"
  end
end
