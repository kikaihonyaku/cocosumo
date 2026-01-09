class RenameChangesColumnInAdminAuditLogs < ActiveRecord::Migration[8.0]
  def change
    rename_column :admin_audit_logs, :changes, :changes_data
  end
end
