namespace :school_districts do
  desc "Import school district data from GeoJSON file"
  task :import_geojson, [:file_path] => :environment do |t, args|
    require 'json'

    # GeoJSONファイルのパス
    file_path = args[:file_path] || ENV['GEOJSON_PATH']

    unless file_path && File.exist?(file_path)
      puts "エラー: GeoJSONファイルが見つかりません"
      puts "使い方: rails school_districts:import_geojson[/path/to/file.geojson]"
      puts "または: GEOJSON_PATH=/path/to/file.geojson rails school_districts:import_geojson"
      exit 1
    end

    puts "GeoJSONファイルを読み込んでいます: #{file_path}"

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

    # GeoJSONを読み込み（文字エンコーディングをUTF-8に変換）
    file_content = File.read(file_path, encoding: 'UTF-8')

    # もしUTF-8で読めない場合はShift_JISとして読み込んで変換
    begin
      geojson = JSON.parse(file_content)
    rescue JSON::ParserError, Encoding::UndefinedConversionError
      puts "UTF-8での読み込みに失敗しました。Shift_JISとして読み込みます..."
      file_content = File.read(file_path, encoding: 'Shift_JIS:UTF-8')
      geojson = JSON.parse(file_content)
    end

    unless geojson['type'] == 'FeatureCollection'
      puts "エラー: FeatureCollection形式のGeoJSONが必要です"
      exit 1
    end

    puts "フィーチャー数: #{geojson['features'].length}"
    puts ""

    # 最初のフィーチャーのプロパティを表示
    if geojson['features'].length > 0
      puts "プロパティのサンプル (最初のフィーチャー):"
      geojson['features'].first['properties'].each do |key, value|
        puts "  #{key}: #{value}"
      end
      puts ""

      print "インポートを続けますか? (y/N): "
      response = STDIN.gets.chomp
      unless response.downcase == 'y'
        puts "キャンセルしました"
        exit 0
      end
    end

    imported_count = 0
    error_count = 0

    geojson['features'].each_with_index do |feature, index|
      begin
        properties = feature['properties']
        geometry = feature['geometry']

        # 国土数値情報の小学校区データのプロパティマッピング
        # A27_005: 学校コード
        # A27_006: 自治体名
        # A27_007: 学校名
        # A27_008: 住所
        school_district = SchoolDistrict.new(
          name: properties['A27_007'] || properties['name'] || '',  # 学校名を学区名として使用
          school_name: properties['A27_007'] || properties['school_name'] || '',
          school_code: properties['A27_005']&.to_s || properties['code']&.to_s || '',
          prefecture: '埼玉県',
          city: properties['A27_006'] || properties['city'] || '',
          school_type: '小学校',
          geometry: geometry
        )

        if school_district.save
          imported_count += 1
          print "\r進行状況: #{imported_count}/#{geojson['features'].length}"
        else
          error_count += 1
          puts "\nエラー (#{index + 1}): #{school_district.errors.full_messages.join(', ')}"
        end
      rescue => e
        error_count += 1
        puts "\nレコード処理エラー (#{index + 1}): #{e.message}"
      end
    end

    puts "\n\nインポート完了!"
    puts "成功: #{imported_count}件"
    puts "エラー: #{error_count}件" if error_count > 0
  end

  desc "Show GeoJSON properties for the first feature"
  task :show_geojson_properties, [:file_path] => :environment do |t, args|
    require 'json'

    file_path = args[:file_path] || ENV['GEOJSON_PATH']

    unless file_path && File.exist?(file_path)
      puts "エラー: GeoJSONファイルが見つかりません"
      puts "使い方: rails school_districts:show_geojson_properties[/path/to/file.geojson]"
      exit 1
    end

    geojson = JSON.parse(File.read(file_path))

    puts "GeoJSON情報:"
    puts "=" * 80
    puts "ファイル: #{file_path}"
    puts "タイプ: #{geojson['type']}"
    puts "フィーチャー数: #{geojson['features']&.length || 0}"
    puts ""

    if geojson['features'] && geojson['features'].length > 0
      puts "最初の3フィーチャーのプロパティ:"
      puts "-" * 80

      geojson['features'].first(3).each_with_index do |feature, index|
        puts "\n【フィーチャー #{index + 1}】"
        puts "ジオメトリタイプ: #{feature['geometry']['type']}"
        puts "プロパティ:"
        feature['properties'].each do |key, value|
          puts "  #{key}: #{value}"
        end
      end
    else
      puts "フィーチャーが見つかりません"
    end
  end
end
