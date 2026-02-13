class AddLineGuidanceEmailTemplate < ActiveRecord::Migration[8.0]
  def up
    template_name = "LINE友だち追加のご案内"

    Tenant.find_each do |tenant|
      next if tenant.email_templates.exists?(name: template_name)

      template_attrs = Tenant::DEFAULT_EMAIL_TEMPLATES.find { |t| t[:name] == template_name }
      next unless template_attrs

      tenant.email_templates.create!(template_attrs)
    end
  end

  def down
    EmailTemplate.where(name: "LINE友だち追加のご案内").destroy_all
  end
end
