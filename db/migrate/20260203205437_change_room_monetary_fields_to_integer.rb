class ChangeRoomMonetaryFieldsToInteger < ActiveRecord::Migration[8.0]
  def up
    change_column :rooms, :rent, :integer, using: 'rent::integer'
    change_column :rooms, :management_fee, :integer, using: 'management_fee::integer'
    change_column :rooms, :deposit, :integer, using: 'deposit::integer'
    change_column :rooms, :key_money, :integer, using: 'key_money::integer'
    change_column :rooms, :parking_fee, :integer, using: 'parking_fee::integer'
    change_column :rooms, :renewal_fee, :integer, using: 'renewal_fee::integer'
  end

  def down
    change_column :rooms, :rent, :decimal
    change_column :rooms, :management_fee, :decimal
    change_column :rooms, :deposit, :decimal
    change_column :rooms, :key_money, :decimal
    change_column :rooms, :parking_fee, :decimal
    change_column :rooms, :renewal_fee, :decimal
  end
end
