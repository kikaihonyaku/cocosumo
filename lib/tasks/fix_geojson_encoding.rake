namespace :school_districts do
  desc "Fix GeoJSON encoding from Shift_JIS to UTF-8"
  task :fix_encoding, [:input_file, :output_file] => :environment do |t, args|
    require 'json'

    input_file = args[:input_file] || ENV['INPUT_FILE']
    output_file = args[:output_file] || ENV['OUTPUT_FILE']

    unless input_file && output_file
      puts "使い方: rails school_districts:fix_encoding[input.json,output.json]"
      puts "または: INPUT_FILE=input.json OUTPUT_FILE=output.json rails school_districts:fix_encoding"
      exit 1
    end

    unless File.exist?(input_file)
      puts "エラー: 入力ファイルが見つかりません: #{input_file}"
      exit 1
    end

    puts "ファイルを読み込んでいます: #{input_file}"

    # まずUTF-8として読み込んでみる
    content = File.read(input_file, encoding: 'UTF-8')
    data = JSON.parse(content)

    puts "フィーチャー数: #{data['features']&.length || 0}"

    # 各フィーチャーのプロパティを修正
    fixed_count = 0
    data['features']&.each do |feature|
      properties = feature['properties']
      next unless properties

      # 各プロパティの値を確認して修正
      properties.each do |key, value|
        next unless value.is_a?(String)

        # 文字化けしている可能性のある文字列を検出
        if value.encoding.name == 'UTF-8' && value.bytes.any? { |b| b > 127 }
          begin
            # バイト列をShift_JISとして解釈してUTF-8に変換
            # まず、現在の文字列のバイト列を取得
            bytes = value.bytes

            # Shift_JISとして解釈してUTF-8に変換を試みる
            begin
              fixed_value = bytes.pack('C*').force_encoding('Shift_JIS').encode('UTF-8', invalid: :replace, undef: :replace)

              # 変換が有効そうかチェック（ひらがな・カタカナ・漢字が含まれているか）
              if fixed_value =~ /[ぁ-んァ-ヶー一-龠]/
                properties[key] = fixed_value
                fixed_count += 1 if fixed_count < 5  # 最初の5件だけカウント（デバッグ用）

                if fixed_count <= 5
                  puts "修正: #{key} = #{fixed_value}"
                end
              end
            rescue Encoding::InvalidByteSequenceError, Encoding::UndefinedConversionError
              # 変換できない場合はスキップ
            end
          rescue => e
            # エラーは無視
          end
        end
      end
    end

    # 修正したJSONを保存
    puts "\n修正したデータを保存しています: #{output_file}"
    File.write(output_file, JSON.pretty_generate(data), encoding: 'UTF-8')

    puts "完了！"
    puts "出力ファイル: #{output_file}"
    puts "ファイルサイズ: #{File.size(output_file)} bytes"
  end
end
