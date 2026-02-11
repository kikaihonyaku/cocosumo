class AddBodyFormatToEmailTemplates < ActiveRecord::Migration[8.0]
  def change
    add_column :email_templates, :body_format, :string, default: 'text', null: false
  end
end
