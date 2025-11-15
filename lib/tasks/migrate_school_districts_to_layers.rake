namespace :map_layers do
  desc "Migrate existing school districts to map layers"
  task migrate_school_districts: :environment do
    puts "=" * 80
    puts "既存の学区データをレイヤーとして登録します"
    puts "=" * 80
    puts ""

    # テナントごとに処理
    Tenant.find_each do |tenant|
      puts "テナント: #{tenant.name} (ID: #{tenant.id})"
      puts "-" * 80

      # 小学校区レイヤーの作成または取得
      elementary_layer = tenant.map_layers.find_or_initialize_by(layer_key: 'elementary-school-district')
      if elementary_layer.new_record?
        elementary_layer.assign_attributes(
          name: '埼玉県小学校区',
          description: '埼玉県内の小学校区の境界データ',
          layer_type: 'school_districts',
          color: '#FF6B00',
          opacity: 0.15,
          display_order: 1,
          is_active: true
        )
        elementary_layer.save!
        puts "✓ 小学校区レイヤーを作成しました (ID: #{elementary_layer.id})"
      else
        puts "✓ 小学校区レイヤーは既に存在します (ID: #{elementary_layer.id})"
      end

      # 中学校区レイヤーの作成または取得
      junior_high_layer = tenant.map_layers.find_or_initialize_by(layer_key: 'junior-high-school-district')
      if junior_high_layer.new_record?
        junior_high_layer.assign_attributes(
          name: '埼玉県中学校区',
          description: '埼玉県内の中学校区の境界データ',
          layer_type: 'school_districts',
          color: '#2196F3',
          opacity: 0.15,
          display_order: 2,
          is_active: true
        )
        junior_high_layer.save!
        puts "✓ 中学校区レイヤーを作成しました (ID: #{junior_high_layer.id})"
      else
        puts "✓ 中学校区レイヤーは既に存在します (ID: #{junior_high_layer.id})"
      end

      puts ""

      # 小学校区データを関連付け
      elementary_count = 0
      SchoolDistrict.elementary_schools.where(map_layer_id: nil).find_each do |district|
        district.update!(map_layer_id: elementary_layer.id)
        elementary_count += 1
      end
      puts "✓ 小学校区データを関連付けました: #{elementary_count}件"

      # 中学校区データを関連付け
      junior_high_count = 0
      SchoolDistrict.junior_high_schools.where(map_layer_id: nil).find_each do |district|
        district.update!(map_layer_id: junior_high_layer.id)
        junior_high_count += 1
      end
      puts "✓ 中学校区データを関連付けました: #{junior_high_count}件"

      puts ""

      # フィーチャー数を更新
      elementary_layer.update_feature_count!
      junior_high_layer.update_feature_count!

      puts "✓ フィーチャー数を更新しました"
      puts "  - 小学校区: #{elementary_layer.feature_count}件"
      puts "  - 中学校区: #{junior_high_layer.feature_count}件"

      puts ""
      puts "=" * 80
      puts ""
    end

    puts "移行完了！"
    puts ""
    puts "確認方法:"
    puts "  1. ブラウザで /admin/layers にアクセス"
    puts "  2. 小学校区レイヤーと中学校区レイヤーが表示されることを確認"
    puts "  3. 各レイヤーのフィーチャー数が正しいことを確認"
    puts ""
  end

  desc "Show migration status"
  task status: :environment do
    puts "=" * 80
    puts "学区データの移行状態"
    puts "=" * 80
    puts ""

    Tenant.find_each do |tenant|
      puts "テナント: #{tenant.name} (ID: #{tenant.id})"
      puts "-" * 80

      layers = tenant.map_layers.where(layer_type: 'school_districts')
      puts "登録済みレイヤー数: #{layers.count}"

      layers.each do |layer|
        puts ""
        puts "  レイヤー: #{layer.name}"
        puts "  キー: #{layer.layer_key}"
        puts "  フィーチャー数: #{layer.feature_count}"
        puts "  有効: #{layer.is_active ? 'はい' : 'いいえ'}"
      end

      puts ""
      elementary_without_layer = SchoolDistrict.elementary_schools.where(map_layer_id: nil).count
      junior_high_without_layer = SchoolDistrict.junior_high_schools.where(map_layer_id: nil).count

      puts "レイヤー未関連付けの学区:"
      puts "  - 小学校区: #{elementary_without_layer}件"
      puts "  - 中学校区: #{junior_high_without_layer}件"

      puts ""
      puts "=" * 80
      puts ""
    end
  end
end
