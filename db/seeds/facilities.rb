# 設備マスタデータ
FACILITY_MASTER = {
  # キッチン (8項目)
  kitchen: [
    { code: 'system_kitchen', name: 'システムキッチン', popular: true },
    { code: 'gas_stove', name: 'ガスコンロ', popular: true },
    { code: 'ih_stove', name: 'IHクッキングヒーター', popular: false },
    { code: 'counter_kitchen', name: 'カウンターキッチン', popular: false },
    { code: 'dishwasher', name: '食器洗い乾燥機', popular: false },
    { code: 'refrigerator', name: '冷蔵庫付き', popular: false },
    { code: 'gas_range_2burner', name: '2口コンロ', popular: false },
    { code: 'gas_range_3burner', name: '3口以上コンロ', popular: false },
  ],

  # バス・トイレ (10項目)
  bath_toilet: [
    { code: 'bath_toilet_separate', name: 'バス・トイレ別', popular: true },
    { code: 'washlet', name: '温水洗浄便座', popular: true },
    { code: 'reheating_bath', name: '追い焚き機能', popular: true },
    { code: 'bathroom_dryer', name: '浴室乾燥機', popular: true },
    { code: 'independent_washroom', name: '独立洗面台', popular: true },
    { code: 'unit_bath', name: 'ユニットバス', popular: false },
    { code: 'shower_only', name: 'シャワールーム', popular: false },
    { code: 'mist_sauna', name: 'ミストサウナ', popular: false },
    { code: 'auto_bath', name: 'オートバス', popular: false },
    { code: 'toilet_with_washbasin', name: 'トイレ手洗い付き', popular: false },
  ],

  # 冷暖房・空調 (5項目)
  cooling_heating: [
    { code: 'air_conditioner', name: 'エアコン', popular: true },
    { code: 'floor_heating', name: '床暖房', popular: true },
    { code: 'hot_water_heater', name: '給湯器', popular: false },
    { code: 'gas_heater', name: 'ガス暖房', popular: false },
    { code: 'central_heating', name: 'セントラルヒーティング', popular: false },
  ],

  # セキュリティ (7項目)
  security: [
    { code: 'auto_lock', name: 'オートロック', popular: true },
    { code: 'intercom_monitor', name: 'TVモニター付きインターホン', popular: true },
    { code: 'security_camera', name: '防犯カメラ', popular: false },
    { code: 'delivery_box', name: '宅配ボックス', popular: true },
    { code: 'double_lock', name: 'ダブルロック', popular: false },
    { code: 'security_system', name: 'セキュリティシステム', popular: false },
    { code: 'concierge', name: 'コンシェルジュ', popular: false },
  ],

  # 収納 (5項目)
  storage: [
    { code: 'walk_in_closet', name: 'ウォークインクローゼット', popular: true },
    { code: 'closet', name: 'クローゼット', popular: false },
    { code: 'shoe_box', name: 'シューズボックス', popular: false },
    { code: 'loft', name: 'ロフト', popular: false },
    { code: 'storage_room', name: '納戸', popular: false },
  ],

  # 通信・放送 (5項目)
  communication: [
    { code: 'internet', name: 'インターネット対応', popular: true },
    { code: 'internet_free', name: 'インターネット無料', popular: true },
    { code: 'catv', name: 'CATV', popular: false },
    { code: 'bs_antenna', name: 'BS・CS対応', popular: false },
    { code: 'optical_fiber', name: '光ファイバー', popular: false },
  ],

  # 洗濯 (4項目)
  laundry: [
    { code: 'washer_indoor', name: '室内洗濯機置場', popular: true },
    { code: 'washer_outdoor', name: '室外洗濯機置場', popular: false },
    { code: 'washer_included', name: '洗濯機付き', popular: false },
    { code: 'dryer_included', name: '乾燥機付き', popular: false },
  ],

  # 内装・設備 (10項目)
  interior: [
    { code: 'flooring', name: 'フローリング', popular: true },
    { code: 'tatami', name: '畳', popular: false },
    { code: 'balcony', name: 'バルコニー', popular: true },
    { code: 'furniture_included', name: '家具付き', popular: false },
    { code: 'lighting', name: '照明器具付き', popular: false },
    { code: 'designer_interior', name: 'デザイナーズ', popular: false },
    { code: 'corner_room', name: '角部屋', popular: false },
    { code: 'double_glazing', name: '複層ガラス', popular: false },
    { code: 'south_facing', name: '南向き', popular: true },
    { code: 'top_floor', name: '最上階', popular: false },
  ],

  # 共用設備 (8項目)
  building: [
    { code: 'elevator', name: 'エレベーター', popular: true },
    { code: 'bicycle_parking', name: '駐輪場', popular: true },
    { code: 'car_parking', name: '駐車場', popular: true },
    { code: 'trash_24h', name: '24時間ゴミ出し可', popular: false },
    { code: 'common_area_clean', name: '共用部清掃', popular: false },
    { code: 'rooftop', name: '屋上使用可', popular: false },
    { code: 'fitness', name: 'フィットネス', popular: false },
    { code: 'guest_room', name: 'ゲストルーム', popular: false },
  ],

  # その他 (5項目)
  other: [
    { code: 'pet_ok', name: 'ペット可', popular: true },
    { code: 'musical_instruments', name: '楽器相談可', popular: false },
    { code: 'office_use', name: '事務所利用可', popular: false },
    { code: 'roomshare', name: 'ルームシェア可', popular: false },
    { code: 'furnished', name: '家電付き', popular: false },
  ],
}.freeze

# 同義語定義
FACILITY_SYNONYMS = {
  # キッチン
  'system_kitchen' => ['システムキッチン', 'システムK', 'システムキッチン付', 'システムキッチン付き'],
  'gas_stove' => ['ガスコンロ', 'ガスレンジ', 'ガスキッチン', 'ガス調理器', 'コンロ付き', 'コンロ付'],
  'ih_stove' => ['IHクッキングヒーター', 'IH', 'IHコンロ', 'IH調理器', 'オール電化', 'IHヒーター', '電気コンロ'],
  'counter_kitchen' => ['カウンターキッチン', '対面キッチン', '対面式キッチン', 'カウンターK'],
  'dishwasher' => ['食器洗い乾燥機', '食洗機', '食器洗い機', '食洗器', '食器洗浄機', 'ビルトイン食洗機'],
  'refrigerator' => ['冷蔵庫付き', '冷蔵庫', '冷蔵庫付', '冷蔵庫あり'],
  'gas_range_2burner' => ['2口コンロ', '2口ガスコンロ', 'ガスコンロ2口', '二口コンロ'],
  'gas_range_3burner' => ['3口以上コンロ', '3口コンロ', '3口ガスコンロ', 'ガスコンロ3口', '三口コンロ'],

  # バス・トイレ
  'bath_toilet_separate' => ['バス・トイレ別', 'バストイレ別', 'BT別', 'セパレート', '風呂トイレ別', 'バス・トイレ独立', 'バストイレ独立', '風呂・トイレ別'],
  'washlet' => ['温水洗浄便座', 'ウォシュレット', 'シャワートイレ', '洗浄便座', 'TOTO', 'ビデ付き', '温水便座'],
  'reheating_bath' => ['追い焚き機能', '追焚き', '追い炊き', 'おいだき', '追い焚き風呂', '追焚き機能', '追い焚き', '追焚', '追い焚'],
  'bathroom_dryer' => ['浴室乾燥機', '浴乾', '浴室暖房乾燥機', 'バス乾燥', '浴室乾燥', '浴室暖房', '浴室乾燥暖房機'],
  'independent_washroom' => ['独立洗面台', '洗面台', '洗面所独立', '独立洗面', '洗面化粧台', 'シャンプードレッサー', '洗面台独立'],
  'unit_bath' => ['ユニットバス', 'UB', '3点ユニット', '3点ユニットバス', 'ユニット'],
  'shower_only' => ['シャワールーム', 'シャワー', 'シャワーのみ', 'シャワー室'],
  'mist_sauna' => ['ミストサウナ', 'サウナ', 'ミスト'],
  'auto_bath' => ['オートバス', '自動湯張り', 'フルオートバス', '全自動バス'],
  'toilet_with_washbasin' => ['トイレ手洗い付き', 'トイレ手洗い', '手洗い付きトイレ'],

  # 冷暖房・空調
  'air_conditioner' => ['エアコン', 'クーラー', '冷暖房', 'A/C', 'AC', 'エアーコンディショナー', '冷房', '暖房', 'エアコン付き', 'エアコン付', 'エアコン完備'],
  'floor_heating' => ['床暖房', 'フロアヒーティング', '床暖', 'ゆかだん', '床暖付き'],
  'hot_water_heater' => ['給湯器', '給湯', 'ガス給湯', '給湯設備', '給湯機'],
  'gas_heater' => ['ガス暖房', 'ガスファンヒーター', 'ガスヒーター', 'ガス暖房設備'],
  'central_heating' => ['セントラルヒーティング', 'セントラル暖房', '全館暖房', '集中暖房'],

  # セキュリティ
  'auto_lock' => ['オートロック', 'オートロック式', '自動施錠', 'オートロックシステム', 'オートロック付き', 'オートロック付'],
  'intercom_monitor' => ['TVモニター付きインターホン', 'モニター付きインターホン', 'カメラ付きインターホン', 'TVインターホン', 'モニターインターホン', 'インターホン', 'モニター付インターホン', 'カメラ付インターホン', 'TVドアホン', 'ドアホン'],
  'security_camera' => ['防犯カメラ', '監視カメラ', 'セキュリティカメラ', '防犯カメラ設置', '防カメ'],
  'delivery_box' => ['宅配ボックス', '宅配BOX', 'デリバリーボックス', '宅配ロッカー', '宅配Box'],
  'double_lock' => ['ダブルロック', 'Wロック', '2重ロック', '二重ロック', 'ツーロック'],
  'security_system' => ['セキュリティシステム', 'セキュリティ', 'ホームセキュリティ', 'ALSOKセキュリティ', 'SECOMセキュリティ', 'セコム', 'アルソック'],
  'concierge' => ['コンシェルジュ', '管理人常駐', '管理人', 'フロントサービス', '24時間管理'],

  # 収納
  'walk_in_closet' => ['ウォークインクローゼット', 'WIC', 'ウォークインCL', 'ウォーキングクローゼット', 'WCL', 'ウォークイン'],
  'closet' => ['クローゼット', 'CL', 'クロゼット', 'クローゼット付き', '収納'],
  'shoe_box' => ['シューズボックス', '下駄箱', 'シューズクローゼット', 'シューズBOX', 'シューズ収納', 'シューズクローク', '玄関収納'],
  'loft' => ['ロフト', 'ロフト付き', 'ロフト付'],
  'storage_room' => ['納戸', 'サービスルーム', 'S', 'ストレージ', 'ウォークインストレージ'],

  # 通信・放送
  'internet' => ['インターネット対応', 'ネット対応', 'インターネット可', 'ネット可', 'インターネット接続可', 'LAN'],
  'internet_free' => ['インターネット無料', 'ネット無料', 'Wi-Fi無料', 'インターネット使い放題', 'ネット利用料込み', 'WiFi無料', 'ネット込み', 'インターネット込み', 'Wi-Fi付き', 'WiFi付き'],
  'catv' => ['CATV', 'ケーブルテレビ', 'ケーブルTV', 'CTV'],
  'bs_antenna' => ['BS・CS対応', 'BS対応', 'CS対応', 'BSアンテナ', 'CSアンテナ', 'BS/CS', 'BSCS', 'BS・CSアンテナ'],
  'optical_fiber' => ['光ファイバー', '光回線', '光インターネット', 'フレッツ光', '光通信'],

  # 洗濯
  'washer_indoor' => ['室内洗濯機置場', '洗濯機置場（室内）', '室内洗濯置場', '洗濯機置き場室内', '洗濯機室内', '洗濯機置場', '室内洗濯機', '洗濯パン'],
  'washer_outdoor' => ['室外洗濯機置場', '洗濯機置場（室外）', 'ベランダ洗濯機', 'バルコニー洗濯機', '屋外洗濯機置場'],
  'washer_included' => ['洗濯機付き', '洗濯機', '洗濯機付', '洗濯機あり'],
  'dryer_included' => ['乾燥機付き', '乾燥機', 'ガス乾燥機', '衣類乾燥機', '乾燥機付'],

  # 内装・設備
  'flooring' => ['フローリング', 'フロア', 'フローリング床', '洋室床', 'フローリング張り', 'フロアー'],
  'tatami' => ['畳', '和室', 'タタミ', '畳部屋'],
  'balcony' => ['バルコニー', 'ベランダ', 'テラス', 'ルーフバルコニー', 'バルコニー付き'],
  'furniture_included' => ['家具付き', '家具', '家具付', '家具あり', '家具備え付け'],
  'lighting' => ['照明器具付き', '照明付き', '照明', 'ライト付き', '照明器具付', '照明付'],
  'designer_interior' => ['デザイナーズ', 'デザイナーズマンション', 'デザイナーズ物件', 'デザイナー'],
  'corner_room' => ['角部屋', '角住戸', 'コーナールーム'],
  'double_glazing' => ['複層ガラス', 'ペアガラス', '二重サッシ', '二重窓', 'インナーサッシ', '断熱ガラス'],
  'south_facing' => ['南向き', '南', '南面', '南側', '日当たり良好'],
  'top_floor' => ['最上階', 'トップフロア', '最上階住戸'],

  # 共用設備
  'elevator' => ['エレベーター', 'EV', 'エレベータ', 'エレベーター付き', 'エレベーター有り', 'エレベーター有'],
  'bicycle_parking' => ['駐輪場', '自転車置場', '駐輪スペース', 'サイクルポート', '自転車置き場', '駐輪場あり'],
  'car_parking' => ['駐車場', 'P', 'パーキング', '駐車スペース', '駐車場あり', '駐車場有', '駐車場付き'],
  'trash_24h' => ['24時間ゴミ出し可', 'ゴミ24時間', '24時間ゴミ出しOK', 'ゴミ出し24H', '24Hゴミ出し可', 'いつでもゴミ出し'],
  'common_area_clean' => ['共用部清掃', '定期清掃', '管理人清掃', '共用部管理'],
  'rooftop' => ['屋上使用可', '屋上', 'ルーフトップ', '屋上利用可'],
  'fitness' => ['フィットネス', 'ジム', 'トレーニングルーム', 'フィットネスルーム', 'スポーツジム'],
  'guest_room' => ['ゲストルーム', 'ゲスト用宿泊施設', 'ゲスト宿泊可'],

  # その他
  'pet_ok' => ['ペット可', 'ペット相談', 'ペット飼育可', 'ペットOK', '犬猫可', '小型犬可', 'ペット相談可', 'ペット飼育相談'],
  'musical_instruments' => ['楽器相談可', '楽器可', '楽器演奏可', '楽器OK', 'ピアノ可', '楽器相談'],
  'office_use' => ['事務所利用可', 'SOHO可', '事務所使用可', 'オフィス利用可', 'SOHO', '事務所可'],
  'roomshare' => ['ルームシェア可', 'ルームシェアOK', 'シェア可', '同居可'],
  'furnished' => ['家電付き', '家電', '家電付', '家電あり', '家電備え付け', '冷蔵庫・洗濯機付き'],
}.freeze

puts "\n=== 設備マスタデータ投入開始 ==="

facility_count = 0
synonym_count = 0

FACILITY_MASTER.each do |category, facilities|
  facilities.each_with_index do |f, index|
    facility = Facility.find_or_create_by!(code: f[:code]) do |rec|
      rec.name = f[:name]
      rec.category = category.to_s
      rec.display_order = index
      rec.is_popular = f[:popular] || false
    end
    facility_count += 1 if facility.persisted?

    # 同義語登録
    synonyms = FACILITY_SYNONYMS[f[:code]] || []
    synonyms.each do |syn|
      FacilitySynonym.find_or_create_by!(facility: facility, synonym: syn)
      synonym_count += 1
    rescue ActiveRecord::RecordInvalid => e
      # 重複エラーは無視（他の設備で既に登録されている場合）
      puts "  警告: 同義語 '#{syn}' は既に登録されています"
    end
  end
end

puts "✓ 設備マスタ: #{Facility.count}件"
puts "✓ 同義語: #{FacilitySynonym.count}件"
puts "=== 設備マスタデータ投入完了 ===\n"
