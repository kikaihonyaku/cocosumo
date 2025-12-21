class CreateBuildingRoutes < ActiveRecord::Migration[8.0]
  def change
    create_table :building_routes do |t|
      t.references :building, null: false, foreign_key: true
      t.references :tenant, null: false, foreign_key: true

      # 経路タイプ: station(駅まで), school(学校まで), custom(カスタム)
      t.string :route_type, null: false, default: 'custom'
      t.string :name, null: false
      t.text :description

      # 出発地・目的地
      t.st_point :origin, geographic: true
      t.st_point :destination, geographic: true
      t.string :destination_name
      t.string :destination_place_id

      # 経路データ
      t.st_line_string :route_geometry, geographic: true
      t.jsonb :waypoints, default: []
      t.text :encoded_polyline
      t.jsonb :directions_response
      t.jsonb :streetview_points, default: []

      # メタデータ
      t.integer :distance_meters
      t.integer :duration_seconds
      t.string :travel_mode, default: 'walking'
      t.integer :display_order, default: 0
      t.boolean :is_default, default: false

      t.timestamps
    end

    add_index :building_routes, [:building_id, :route_type]
    add_index :building_routes, :route_geometry, using: :gist
  end
end
