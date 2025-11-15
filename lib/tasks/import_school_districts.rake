namespace :school_districts do
  desc "Import school district data from shapefile"
  task import: :environment do
    require 'rgeo/shapefile'
    require 'rgeo/geo_json'

    # Shapefileのパス
    shapefile_path = ENV['SHAPEFILE_PATH'] || '/mnt/c/Users/Administrator/Documents/ココスモ_ロゴ/国土数値情報_小学校区_埼玉県/shape/A27-16_11.shp'

    unless File.exist?(shapefile_path)
      puts "エラー: Shapefileが見つかりません: #{shapefile_path}"
      puts "使い方: SHAPEFILE_PATH=/path/to/shapefile.shp rails school_districts:import"
      exit 1
    end

    puts "Shapefileを読み込んでいます: #{shapefile_path}"

    # 既存のデータを削除するか確認
    if SchoolDistrict.count > 0
      print "既存の学区データ (#{SchoolDistrict.count}件) を削除しますか? (y/N): "
      response = STDIN.gets.chomp
      if response.downcase == 'y'
        SchoolDistrict.delete_all
        puts "既存データを削除しました"
      else
        puts "インポートをキャンセルしました"
        exit 0
      end
    end

    # Shapefileを開く
    RGeo::Shapefile::Reader.open(shapefile_path) do |file|
      puts "フィールド名: #{file.fields.map(&:name).join(', ')}"
      puts "レコード数: #{file.num_records}"
      puts ""

      imported_count = 0
      error_count = 0

      file.each do |record|
        begin
          # ジオメトリを取得
          geometry = record.geometry

          # GeoJSONに変換
          geo_json_factory = RGeo::GeoJSON::EntityFactory.instance
          feature = geo_json_factory.feature(geometry)
          geometry_hash = RGeo::GeoJSON.encode(feature)['geometry']

          # 属性データを取得
          # フィールド名は実際のShapefileの構造に合わせて調整が必要
          attributes = record.attributes

          # 学区データを作成
          school_district = SchoolDistrict.new(
            name: attributes['A27_005']&.encode('UTF-8', invalid: :replace, undef: :replace) || '',
            school_name: attributes['A27_004']&.encode('UTF-8', invalid: :replace, undef: :replace) || '',
            school_code: attributes['A27_003']&.to_s || '',
            prefecture: '埼玉県',
            city: attributes['A27_002']&.encode('UTF-8', invalid: :replace, undef: :replace) || '',
            school_type: '小学校',
            geometry: geometry_hash
          )

          if school_district.save
            imported_count += 1
            print "\r進行状況: #{imported_count}/#{file.num_records}"
          else
            error_count += 1
            puts "\nエラー: #{school_district.errors.full_messages.join(', ')}"
          end
        rescue => e
          error_count += 1
          puts "\nレコード処理エラー: #{e.message}"
        end
      end

      puts "\n\nインポート完了!"
      puts "成功: #{imported_count}件"
      puts "エラー: #{error_count}件" if error_count > 0
    end
  end

  desc "Show shapefile field information"
  task show_fields: :environment do
    require 'rgeo/shapefile'

    shapefile_path = ENV['SHAPEFILE_PATH'] || '/mnt/c/Users/Administrator/Documents/ココスモ_ロゴ/国土数値情報_小学校区_埼玉県/shape/A27-16_11.shp'

    unless File.exist?(shapefile_path)
      puts "エラー: Shapefileが見つかりません: #{shapefile_path}"
      exit 1
    end

    RGeo::Shapefile::Reader.open(shapefile_path) do |file|
      puts "Shapefile情報:"
      puts "=" * 80
      puts "パス: #{shapefile_path}"
      puts "レコード数: #{file.num_records}"
      puts ""
      puts "サンプルレコード (最初の3件):"
      puts "-" * 80

      file.first(3).each_with_index do |record, index|
        puts "\n【レコード #{index + 1}】"
        puts "属性データ:"
        record.attributes.each do |key, value|
          encoded_value = value.is_a?(String) ? value.encode('UTF-8', invalid: :replace, undef: :replace) : value
          puts "  #{key}: #{encoded_value}"
        end
        puts ""
      end
    end
  end

  desc "Clear all school district data"
  task clear: :environment do
    count = SchoolDistrict.count
    if count > 0
      print "#{count}件の学区データを削除しますか? (y/N): "
      response = STDIN.gets.chomp
      if response.downcase == 'y'
        SchoolDistrict.delete_all
        puts "削除しました"
      else
        puts "キャンセルしました"
      end
    else
      puts "削除するデータがありません"
    end
  end
end
