class ConsolidateBuiltYearMonthToBuiltDate < ActiveRecord::Migration[8.0]
  def up
    # built_dateカラムを追加
    add_column :buildings, :built_date, :date

    # 既存データをマイグレーション（built_yearとbuilt_monthから）
    Building.reset_column_information
    Building.find_each do |building|
      if building.built_year.present?
        month = building.built_month.present? ? building.built_month : 1
        building.update_column(:built_date, Date.new(building.built_year, month, 1))
      end
    end

    # 古いカラムを削除
    remove_column :buildings, :built_year
    remove_column :buildings, :built_month
  end

  def down
    add_column :buildings, :built_year, :integer
    add_column :buildings, :built_month, :integer

    Building.reset_column_information
    Building.find_each do |building|
      if building.built_date.present?
        building.update_columns(
          built_year: building.built_date.year,
          built_month: building.built_date.month
        )
      end
    end

    remove_column :buildings, :built_date
  end
end
