class AddAdditionalFieldsToRooms < ActiveRecord::Migration[8.0]
  def change
    add_column :rooms, :management_fee, :decimal
    add_column :rooms, :deposit, :decimal
    add_column :rooms, :key_money, :decimal
    add_column :rooms, :facilities, :text
    add_column :rooms, :tenant_name, :string
    add_column :rooms, :tenant_phone, :string
    add_column :rooms, :contract_start_date, :date
    add_column :rooms, :contract_end_date, :date
    add_column :rooms, :notes, :text
  end
end
