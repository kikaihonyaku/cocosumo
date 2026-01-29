class AddIsGlobalToMapLayers < ActiveRecord::Migration[8.0]
  def change
    add_column :map_layers, :is_global, :boolean, default: false, null: false

    # tenant_idをnullableに変更（グローバルレイヤー用）
    change_column_null :map_layers, :tenant_id, true

    # 外部キー制約もnullableに対応（既存のforeign keyを削除して再作成）
    remove_foreign_key :map_layers, :tenants
    add_foreign_key :map_layers, :tenants, column: :tenant_id, on_delete: :cascade, validate: true

    # 既存のユニークインデックスを置き換え
    remove_index :map_layers, [:tenant_id, :layer_key]
    # テナントレイヤー: tenant_id + layer_keyで一意
    add_index :map_layers, [:tenant_id, :layer_key], unique: true,
              where: "tenant_id IS NOT NULL", name: "index_map_layers_on_tenant_and_key"
    # グローバルレイヤー: layer_keyで一意
    add_index :map_layers, :layer_key, unique: true,
              where: "is_global = true", name: "index_map_layers_on_global_key"
  end
end
