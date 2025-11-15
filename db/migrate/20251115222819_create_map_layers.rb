class CreateMapLayers < ActiveRecord::Migration[8.0]
  def change
    create_table :map_layers do |t|
      t.references :tenant, null: false, foreign_key: true
      t.string :name, null: false              # 表示名（例：「埼玉県小学校区」）
      t.string :layer_key, null: false         # システム識別子（例：'elementary-school-district'）
      t.text :description                      # 説明文
      t.string :layer_type, null: false        # データタイプ（例：'school_districts', 'parks'）
      t.string :color, default: '#FF6B00'      # 表示色
      t.float :opacity, default: 0.15          # 透明度
      t.integer :display_order, default: 0     # 表示順序
      t.boolean :is_active, default: true      # 有効/無効
      t.string :icon                           # アイコン（将来のポイントデータ用）
      t.integer :feature_count, default: 0     # フィーチャー数（キャッシュ）

      t.timestamps
    end

    add_index :map_layers, [:tenant_id, :layer_key], unique: true
    add_index :map_layers, :layer_type
    add_index :map_layers, :is_active
  end
end
