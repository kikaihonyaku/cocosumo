class CreateSchoolDistricts < ActiveRecord::Migration[8.0]
  def change
    create_table :school_districts do |t|
      t.string :name              # 学区名
      t.string :school_name       # 学校名
      t.string :school_code       # 学校コード
      t.string :prefecture        # 都道府県
      t.string :city              # 市区町村
      t.string :school_type       # 学校種別（小学校、中学校など）
      t.json :geometry            # GeoJSON形式のポリゴンデータ

      t.timestamps
    end

    add_index :school_districts, :prefecture
    add_index :school_districts, :city
    add_index :school_districts, :school_code
  end
end
