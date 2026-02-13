class BulkLineGuidanceEmailJob < ApplicationJob
  queue_as :default

  def perform(tenant_id:, customer_ids:, template_id:, sender_user_id:)
    tenant = Tenant.find(tenant_id)
    sender_user = tenant.users.find(sender_user_id)
    template = tenant.email_templates.find(template_id)
    line_config = tenant.line_config

    customers = tenant.customers.where(id: customer_ids)
                      .where.not(email: [nil, ""])
                      .where(line_user_id: [nil, ""])

    customers.find_each do |customer|
      inquiry = customer.inquiries.order(created_at: :desc).first
      next unless inquiry

      subject = replace_placeholders(template.subject, customer, tenant, sender_user, line_config)
      body = replace_placeholders(template.body, customer, tenant, sender_user, line_config)

      activity = customer.add_activity!(
        activity_type: :email,
        direction: :outbound,
        inquiry: inquiry,
        user: sender_user,
        subject: subject,
        content: body,
        content_format: template.body_format || "text"
      )

      CustomerMailer.send_to_customer(
        customer, sender_user, subject, body, inquiry,
        body_format: template.body_format || "text",
        activity_id: activity.id
      ).deliver_later
    end
  end

  private

  def replace_placeholders(text, customer, tenant, sender_user, line_config)
    return text if text.blank?

    text.gsub("{{LINE友だち追加URL}}", line_config&.friend_add_url.presence || "")
        .gsub("{{お客様名}}", customer.name.presence || "")
        .gsub("{{会社名}}", tenant.name.presence || "")
        .gsub("{{担当者名}}", sender_user.name.presence || "")
  end
end
