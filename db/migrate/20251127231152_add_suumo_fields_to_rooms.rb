class AddSuumoFieldsToRooms < ActiveRecord::Migration[8.0]
  def change
    add_column :rooms, :direction, :string
    add_column :rooms, :parking_fee, :decimal
    add_column :rooms, :available_date, :date
    add_column :rooms, :renewal_fee, :decimal
    add_column :rooms, :guarantor_required, :boolean, default: true
    add_column :rooms, :pets_allowed, :boolean, default: false
    add_column :rooms, :two_person_allowed, :boolean, default: false
    add_column :rooms, :office_use_allowed, :boolean, default: false
  end
end
