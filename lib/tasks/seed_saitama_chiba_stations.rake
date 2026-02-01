namespace :master do
  desc "Seed railway lines and stations for Saitama, Chiba, and Ibaraki areas"
  task seed_saitama_chiba_stations: :environment do
    railway_data = [
      # === JR東日本（埼玉・千葉・茨城エリア追加分） ===
      {
        company: "JR東日本", company_code: "jr_east",
        lines: [
          {
            code: "jr_utsunomiya", name: "JR宇都宮線", color: "#f68b1e", display_order: 6,
            stations: [
              { code: "urawa_jr_utsunomiya", name: "浦和", name_kana: "うらわ", display_order: 1 },
              { code: "saitama_shintoshin_jr_utsunomiya", name: "さいたま新都心", name_kana: "さいたましんとしん", display_order: 2 },
              { code: "omiya_jr_utsunomiya", name: "大宮", name_kana: "おおみや", display_order: 3 },
              { code: "toro_jr_utsunomiya", name: "土呂", name_kana: "とろ", display_order: 4 },
              { code: "higashi_omiya_jr_utsunomiya", name: "東大宮", name_kana: "ひがしおおみや", display_order: 5 },
              { code: "hasuda_jr_utsunomiya", name: "蓮田", name_kana: "はすだ", display_order: 6 },
              { code: "shiraoka_jr_utsunomiya", name: "白岡", name_kana: "しらおか", display_order: 7 },
              { code: "shin_shiraoka_jr_utsunomiya", name: "新白岡", name_kana: "しんしらおか", display_order: 8 },
              { code: "kuki_jr_utsunomiya", name: "久喜", name_kana: "くき", display_order: 9 },
              { code: "higashi_washinomiya_jr_utsunomiya", name: "東鷲宮", name_kana: "ひがしわしのみや", display_order: 10 },
              { code: "kurihashi_jr_utsunomiya", name: "栗橋", name_kana: "くりはし", display_order: 11 },
            ]
          },
          {
            code: "jr_takasaki", name: "JR高崎線", color: "#f68b1e", display_order: 7,
            stations: [
              { code: "urawa_jr_takasaki", name: "浦和", name_kana: "うらわ", display_order: 1 },
              { code: "saitama_shintoshin_jr_takasaki", name: "さいたま新都心", name_kana: "さいたましんとしん", display_order: 2 },
              { code: "omiya_jr_takasaki", name: "大宮", name_kana: "おおみや", display_order: 3 },
              { code: "miyahara_jr_takasaki", name: "宮原", name_kana: "みやはら", display_order: 4 },
              { code: "ageo_jr_takasaki", name: "上尾", name_kana: "あげお", display_order: 5 },
              { code: "kita_ageo_jr_takasaki", name: "北上尾", name_kana: "きたあげお", display_order: 6 },
              { code: "okegawa_jr_takasaki", name: "桶川", name_kana: "おけがわ", display_order: 7 },
              { code: "kitamoto_jr_takasaki", name: "北本", name_kana: "きたもと", display_order: 8 },
              { code: "konosu_jr_takasaki", name: "鴻巣", name_kana: "こうのす", display_order: 9 },
              { code: "kita_konosu_jr_takasaki", name: "北鴻巣", name_kana: "きたこうのす", display_order: 10 },
              { code: "fukiage_jr_takasaki", name: "吹上", name_kana: "ふきあげ", display_order: 11 },
              { code: "gyoda_jr_takasaki", name: "行田", name_kana: "ぎょうだ", display_order: 12 },
              { code: "kumagaya_jr_takasaki", name: "熊谷", name_kana: "くまがや", display_order: 13 },
              { code: "kagohara_jr_takasaki", name: "籠原", name_kana: "かごはら", display_order: 14 },
              { code: "fukaya_jr_takasaki", name: "深谷", name_kana: "ふかや", display_order: 15 },
              { code: "okabe_jr_takasaki", name: "岡部", name_kana: "おかべ", display_order: 16 },
              { code: "honjo_jr_takasaki", name: "本庄", name_kana: "ほんじょう", display_order: 17 },
              { code: "jimbohara_jr_takasaki", name: "神保原", name_kana: "じんぼはら", display_order: 18 },
            ]
          },
          {
            code: "jr_musashino", name: "JR武蔵野線", color: "#ff4500", display_order: 8,
            stations: [
              { code: "higashi_tokorozawa_jr_musashino", name: "東所沢", name_kana: "ひがしところざわ", display_order: 1 },
              { code: "niiza_jr_musashino", name: "新座", name_kana: "にいざ", display_order: 2 },
              { code: "kita_asaka_jr_musashino", name: "北朝霞", name_kana: "きたあさか", display_order: 3 },
              { code: "nishi_urawa_jr_musashino", name: "西浦和", name_kana: "にしうらわ", display_order: 4 },
              { code: "musashi_urawa_jr_musashino", name: "武蔵浦和", name_kana: "むさしうらわ", display_order: 5 },
              { code: "minami_urawa_jr_musashino", name: "南浦和", name_kana: "みなみうらわ", display_order: 6 },
              { code: "higashi_urawa_jr_musashino", name: "東浦和", name_kana: "ひがしうらわ", display_order: 7 },
              { code: "higashi_kawaguchi_jr_musashino", name: "東川口", name_kana: "ひがしかわぐち", display_order: 8 },
              { code: "minami_koshigaya_jr_musashino", name: "南越谷", name_kana: "みなみこしがや", display_order: 9 },
              { code: "koshigaya_laketown_jr_musashino", name: "越谷レイクタウン", name_kana: "こしがやれいくたうん", display_order: 10 },
              { code: "yoshikawa_jr_musashino", name: "吉川", name_kana: "よしかわ", display_order: 11 },
              { code: "yoshikawa_minami_jr_musashino", name: "吉川美南", name_kana: "よしかわみなみ", display_order: 12 },
              { code: "shin_misato_jr_musashino", name: "新三郷", name_kana: "しんみさと", display_order: 13 },
              { code: "misato_jr_musashino", name: "三郷", name_kana: "みさと", display_order: 14 },
              { code: "minami_nagareyama_jr_musashino", name: "南流山", name_kana: "みなみながれやま", display_order: 15 },
              { code: "shin_matsudo_jr_musashino", name: "新松戸", name_kana: "しんまつど", display_order: 16 },
              { code: "shin_yahashira_jr_musashino", name: "新八柱", name_kana: "しんやはしら", display_order: 17 },
              { code: "higashi_matsudo_jr_musashino", name: "東松戸", name_kana: "ひがしまつど", display_order: 18 },
              { code: "ichikawa_ono_jr_musashino", name: "市川大野", name_kana: "いちかわおおの", display_order: 19 },
              { code: "funabashi_hoten_jr_musashino", name: "船橋法典", name_kana: "ふなばしほうてん", display_order: 20 },
              { code: "nishi_funabashi_jr_musashino", name: "西船橋", name_kana: "にしふなばし", display_order: 21 },
            ]
          },
          {
            code: "jr_kawagoe", name: "JR川越線", color: "#006400", display_order: 9,
            stations: [
              { code: "omiya_jr_kawagoe", name: "大宮", name_kana: "おおみや", display_order: 1 },
              { code: "nisshin_jr_kawagoe", name: "日進", name_kana: "にっしん", display_order: 2 },
              { code: "nishi_omiya_jr_kawagoe", name: "西大宮", name_kana: "にしおおみや", display_order: 3 },
              { code: "sashiogi_jr_kawagoe", name: "指扇", name_kana: "さしおうぎ", display_order: 4 },
              { code: "minami_furuya_jr_kawagoe", name: "南古谷", name_kana: "みなみふるや", display_order: 5 },
              { code: "kawagoe_jr_kawagoe", name: "川越", name_kana: "かわごえ", display_order: 6 },
              { code: "nishi_kawagoe_jr_kawagoe", name: "西川越", name_kana: "にしかわごえ", display_order: 7 },
              { code: "matoba_jr_kawagoe", name: "的場", name_kana: "まとば", display_order: 8 },
              { code: "kasahata_jr_kawagoe", name: "笠幡", name_kana: "かさはた", display_order: 9 },
              { code: "musashi_takahagi_jr_kawagoe", name: "武蔵高萩", name_kana: "むさしたかはぎ", display_order: 10 },
              { code: "komagawa_jr_kawagoe", name: "高麗川", name_kana: "こまがわ", display_order: 11 },
            ]
          },
          {
            code: "jr_joban", name: "JR常磐線", color: "#00b261", display_order: 10,
            stations: [
              { code: "matsudo_jr_joban", name: "松戸", name_kana: "まつど", display_order: 1 },
              { code: "kita_matsudo_jr_joban", name: "北松戸", name_kana: "きたまつど", display_order: 2 },
              { code: "mabashi_jr_joban", name: "馬橋", name_kana: "まばし", display_order: 3 },
              { code: "shin_matsudo_jr_joban", name: "新松戸", name_kana: "しんまつど", display_order: 4 },
              { code: "kita_kogane_jr_joban", name: "北小金", name_kana: "きたこがね", display_order: 5 },
              { code: "minami_kashiwa_jr_joban", name: "南柏", name_kana: "みなみかしわ", display_order: 6 },
              { code: "kashiwa_jr_joban", name: "柏", name_kana: "かしわ", display_order: 7 },
              { code: "kita_kashiwa_jr_joban", name: "北柏", name_kana: "きたかしわ", display_order: 8 },
              { code: "abiko_jr_joban", name: "我孫子", name_kana: "あびこ", display_order: 9 },
              { code: "tennodai_jr_joban", name: "天王台", name_kana: "てんのうだい", display_order: 10 },
              { code: "toride_jr_joban", name: "取手", name_kana: "とりで", display_order: 11 },
              { code: "fujishiro_jr_joban", name: "藤代", name_kana: "ふじしろ", display_order: 12 },
              { code: "ryugasaki_jr_joban", name: "龍ケ崎市", name_kana: "りゅうがさきし", display_order: 13 },
              { code: "ushiku_jr_joban", name: "牛久", name_kana: "うしく", display_order: 14 },
              { code: "hitachino_ushiku_jr_joban", name: "ひたち野うしく", name_kana: "ひたちのうしく", display_order: 15 },
              { code: "arakawa_oki_jr_joban", name: "荒川沖", name_kana: "あらかわおき", display_order: 16 },
              { code: "tsuchiura_jr_joban", name: "土浦", name_kana: "つちうら", display_order: 17 },
              { code: "kandatsu_jr_joban", name: "神立", name_kana: "かんだつ", display_order: 18 },
              { code: "takahama_jr_joban", name: "高浜", name_kana: "たかはま", display_order: 19 },
              { code: "ishioka_jr_joban", name: "石岡", name_kana: "いしおか", display_order: 20 },
              { code: "hatori_jr_joban", name: "羽鳥", name_kana: "はとり", display_order: 21 },
              { code: "iwama_jr_joban", name: "岩間", name_kana: "いわま", display_order: 22 },
              { code: "tomobe_jr_joban", name: "友部", name_kana: "ともべ", display_order: 23 },
              { code: "uchihara_jr_joban", name: "内原", name_kana: "うちはら", display_order: 24 },
              { code: "akatsuka_jr_joban", name: "赤塚", name_kana: "あかつか", display_order: 25 },
              { code: "kairakuen_jr_joban", name: "偕楽園", name_kana: "かいらくえん", display_order: 26 },
              { code: "mito_jr_joban", name: "水戸", name_kana: "みと", display_order: 27 },
              { code: "katsuta_jr_joban", name: "勝田", name_kana: "かつた", display_order: 28 },
              { code: "sawa_jr_joban", name: "佐和", name_kana: "さわ", display_order: 29 },
              { code: "tokai_jr_joban", name: "東海", name_kana: "とうかい", display_order: 30 },
              { code: "omika_jr_joban", name: "大甕", name_kana: "おおみか", display_order: 31 },
              { code: "hitachi_taga_jr_joban", name: "常陸多賀", name_kana: "ひたちたが", display_order: 32 },
              { code: "hitachi_jr_joban", name: "日立", name_kana: "ひたち", display_order: 33 },
              { code: "ogitsu_jr_joban", name: "小木津", name_kana: "おぎつ", display_order: 34 },
              { code: "juo_jr_joban", name: "十王", name_kana: "じゅうおう", display_order: 35 },
              { code: "takahagi_jr_joban", name: "高萩", name_kana: "たかはぎ", display_order: 36 },
              { code: "minami_nakago_jr_joban", name: "南中郷", name_kana: "みなみなかごう", display_order: 37 },
              { code: "isohara_jr_joban", name: "磯原", name_kana: "いそはら", display_order: 38 },
              { code: "otsu_ko_jr_joban", name: "大津港", name_kana: "おおつこう", display_order: 39 },
            ]
          },
        ]
      },
      # === 東武鉄道（埼玉・千葉エリア拡充） ===
      {
        company: "東武鉄道", company_code: "tobu",
        lines: [
          {
            code: "tobu_skytree", name: "東武スカイツリーライン", color: "#ee7800", display_order: 2,
            stations: [
              { code: "asakusa_tobu_skytree", name: "浅草", name_kana: "あさくさ", display_order: 1 },
              { code: "skytree_tobu_skytree", name: "とうきょうスカイツリー", name_kana: "とうきょうすかいつりー", display_order: 2 },
              { code: "hikifune_tobu_skytree", name: "曳舟", name_kana: "ひきふね", display_order: 3 },
              { code: "kitasenju_tobu_skytree", name: "北千住", name_kana: "きたせんじゅ", display_order: 4 },
              { code: "takenotsuka_tobu_skytree", name: "竹ノ塚", name_kana: "たけのつか", display_order: 5 },
              { code: "yatsuka_tobu_skytree", name: "谷塚", name_kana: "やつか", display_order: 6 },
              { code: "soka_tobu_skytree", name: "草加", name_kana: "そうか", display_order: 7 },
              { code: "dokkyo_daigakumae_tobu_skytree", name: "獨協大学前", name_kana: "どっきょうだいがくまえ", display_order: 8 },
              { code: "shinten_tobu_skytree", name: "新田", name_kana: "しんでん", display_order: 9 },
              { code: "gamo_tobu_skytree", name: "蒲生", name_kana: "がもう", display_order: 10 },
              { code: "shin_koshigaya_tobu_skytree", name: "新越谷", name_kana: "しんこしがや", display_order: 11 },
              { code: "koshigaya_tobu_skytree", name: "越谷", name_kana: "こしがや", display_order: 12 },
              { code: "kita_koshigaya_tobu_skytree", name: "北越谷", name_kana: "きたこしがや", display_order: 13 },
              { code: "obukuro_tobu_skytree", name: "大袋", name_kana: "おおぶくろ", display_order: 14 },
              { code: "sengendai_tobu_skytree", name: "せんげん台", name_kana: "せんげんだい", display_order: 15 },
              { code: "takesato_tobu_skytree", name: "武里", name_kana: "たけさと", display_order: 16 },
              { code: "ichinowari_tobu_skytree", name: "一ノ割", name_kana: "いちのわり", display_order: 17 },
              { code: "kasukabe_tobu_skytree", name: "春日部", name_kana: "かすかべ", display_order: 18 },
              { code: "kita_kasukabe_tobu_skytree", name: "北春日部", name_kana: "きたかすかべ", display_order: 19 },
              { code: "himemiya_tobu_skytree", name: "姫宮", name_kana: "ひめみや", display_order: 20 },
              { code: "tobu_dobutsukoen_tobu_skytree", name: "東武動物公園", name_kana: "とうぶどうぶつこうえん", display_order: 21 },
              { code: "wado_tobu_skytree", name: "和戸", name_kana: "わど", display_order: 22 },
              { code: "kuki_tobu_skytree", name: "久喜", name_kana: "くき", display_order: 23 },
              { code: "washinomiya_tobu_skytree", name: "鷲宮", name_kana: "わしのみや", display_order: 24 },
              { code: "hanasaki_tobu_skytree", name: "花崎", name_kana: "はなさき", display_order: 25 },
              { code: "kazo_tobu_skytree", name: "加須", name_kana: "かぞ", display_order: 26 },
              { code: "minami_hanyu_tobu_skytree", name: "南羽生", name_kana: "みなみはにゅう", display_order: 27 },
              { code: "hanyu_tobu_skytree", name: "羽生", name_kana: "はにゅう", display_order: 28 },
            ]
          },
          {
            code: "tobu_noda", name: "東武野田線", color: "#00a6bf", display_order: 3,
            stations: [
              { code: "omiya_tobu_noda", name: "大宮", name_kana: "おおみや", display_order: 1 },
              { code: "kita_omiya_tobu_noda", name: "北大宮", name_kana: "きたおおみや", display_order: 2 },
              { code: "omiya_koen_tobu_noda", name: "大宮公園", name_kana: "おおみやこうえん", display_order: 3 },
              { code: "owada_tobu_noda", name: "大和田", name_kana: "おおわだ", display_order: 4 },
              { code: "nanasato_tobu_noda", name: "七里", name_kana: "ななさと", display_order: 5 },
              { code: "iwatsuki_tobu_noda", name: "岩槻", name_kana: "いわつき", display_order: 6 },
              { code: "higashi_iwatsuki_tobu_noda", name: "東岩槻", name_kana: "ひがしいわつき", display_order: 7 },
              { code: "toyoharu_tobu_noda", name: "豊春", name_kana: "とよはる", display_order: 8 },
              { code: "yagisaki_tobu_noda", name: "八木崎", name_kana: "やぎさき", display_order: 9 },
              { code: "kasukabe_tobu_noda", name: "春日部", name_kana: "かすかべ", display_order: 10 },
              { code: "fujino_ushijima_tobu_noda", name: "藤の牛島", name_kana: "ふじのうしじま", display_order: 11 },
              { code: "minami_sakurai_tobu_noda", name: "南桜井", name_kana: "みなみさくらい", display_order: 12 },
              { code: "kawama_tobu_noda", name: "川間", name_kana: "かわま", display_order: 13 },
              { code: "nanakodai_tobu_noda", name: "七光台", name_kana: "ななこうだい", display_order: 14 },
              { code: "shimizu_koen_tobu_noda", name: "清水公園", name_kana: "しみずこうえん", display_order: 15 },
              { code: "atago_tobu_noda", name: "愛宕", name_kana: "あたご", display_order: 16 },
              { code: "nodashi_tobu_noda", name: "野田市", name_kana: "のだし", display_order: 17 },
              { code: "umesato_tobu_noda", name: "梅郷", name_kana: "うめさと", display_order: 18 },
              { code: "unga_tobu_noda", name: "運河", name_kana: "うんが", display_order: 19 },
              { code: "edogawadai_tobu_noda", name: "江戸川台", name_kana: "えどがわだい", display_order: 20 },
              { code: "hatsuishi_tobu_noda", name: "初石", name_kana: "はついし", display_order: 21 },
              { code: "nagareyama_otakanomori_tobu_noda", name: "流山おおたかの森", name_kana: "ながれやまおおたかのもり", display_order: 22 },
              { code: "toyoshiki_tobu_noda", name: "豊四季", name_kana: "とよしき", display_order: 23 },
              { code: "kashiwa_tobu_noda", name: "柏", name_kana: "かしわ", display_order: 24 },
              { code: "shin_kashiwa_tobu_noda", name: "新柏", name_kana: "しんかしわ", display_order: 25 },
              { code: "masuo_tobu_noda", name: "増尾", name_kana: "ますお", display_order: 26 },
              { code: "sakai_tobu_noda", name: "逆井", name_kana: "さかさい", display_order: 27 },
              { code: "takayanagi_tobu_noda", name: "高柳", name_kana: "たかやなぎ", display_order: 28 },
              { code: "mutsumi_tobu_noda", name: "六実", name_kana: "むつみ", display_order: 29 },
              { code: "shin_kamagaya_tobu_noda", name: "新鎌ケ谷", name_kana: "しんかまがや", display_order: 30 },
              { code: "kamagaya_tobu_noda", name: "鎌ケ谷", name_kana: "かまがや", display_order: 31 },
              { code: "magomezawa_tobu_noda", name: "馬込沢", name_kana: "まごめざわ", display_order: 32 },
              { code: "tsukada_tobu_noda", name: "塚田", name_kana: "つかだ", display_order: 33 },
              { code: "shin_funabashi_tobu_noda", name: "新船橋", name_kana: "しんふなばし", display_order: 34 },
              { code: "funabashi_tobu_noda", name: "船橋", name_kana: "ふなばし", display_order: 35 },
            ]
          },
          {
            code: "tobu_nikko", name: "東武日光線", color: "#ee7800", display_order: 4,
            stations: [
              { code: "tobu_dobutsukoen_tobu_nikko", name: "東武動物公園", name_kana: "とうぶどうぶつこうえん", display_order: 1 },
              { code: "sugito_takanodai_tobu_nikko", name: "杉戸高野台", name_kana: "すぎとたかのだい", display_order: 2 },
              { code: "satte_tobu_nikko", name: "幸手", name_kana: "さって", display_order: 3 },
              { code: "minami_kurihashi_tobu_nikko", name: "南栗橋", name_kana: "みなみくりはし", display_order: 4 },
              { code: "kurihashi_tobu_nikko", name: "栗橋", name_kana: "くりはし", display_order: 5 },
              { code: "shin_koga_tobu_nikko", name: "新古河", name_kana: "しんこが", display_order: 6 },
              { code: "yanagyu_tobu_nikko", name: "柳生", name_kana: "やぎゅう", display_order: 7 },
            ]
          },
          {
            code: "tobu_ogose", name: "東武越生線", color: "#ee7800", display_order: 5,
            stations: [
              { code: "sakado_tobu_ogose", name: "坂戸", name_kana: "さかど", display_order: 1 },
              { code: "ipponmatsu_tobu_ogose", name: "一本松", name_kana: "いっぽんまつ", display_order: 2 },
              { code: "nishi_oya_tobu_ogose", name: "西大家", name_kana: "にしおおや", display_order: 3 },
              { code: "kawakado_tobu_ogose", name: "川角", name_kana: "かわかど", display_order: 4 },
              { code: "bushu_nagase_tobu_ogose", name: "武州長瀬", name_kana: "ぶしゅうながせ", display_order: 5 },
              { code: "higashi_moro_tobu_ogose", name: "東毛呂", name_kana: "ひがしもろ", display_order: 6 },
              { code: "bushu_karasawa_tobu_ogose", name: "武州唐沢", name_kana: "ぶしゅうからさわ", display_order: 7 },
              { code: "ogose_tobu_ogose", name: "越生", name_kana: "おごせ", display_order: 8 },
            ]
          },
        ]
      },
      # === つくばエクスプレス ===
      {
        company: "首都圏新都市鉄道", company_code: "tsukuba_express",
        lines: [
          {
            code: "tsukuba_express", name: "つくばエクスプレス", color: "#0066cc", display_order: 1,
            stations: [
              { code: "yashio_tx", name: "八潮", name_kana: "やしお", display_order: 1 },
              { code: "misato_chuo_tx", name: "三郷中央", name_kana: "みさとちゅうおう", display_order: 2 },
              { code: "minami_nagareyama_tx", name: "南流山", name_kana: "みなみながれやま", display_order: 3 },
              { code: "nagareyama_central_park_tx", name: "流山セントラルパーク", name_kana: "ながれやませんとらるぱーく", display_order: 4 },
              { code: "nagareyama_otakanomori_tx", name: "流山おおたかの森", name_kana: "ながれやまおおたかのもり", display_order: 5 },
              { code: "kashiwanoha_campus_tx", name: "柏の葉キャンパス", name_kana: "かしわのはきゃんぱす", display_order: 6 },
              { code: "kashiwa_tanaka_tx", name: "柏たなか", name_kana: "かしわたなか", display_order: 7 },
            ]
          },
        ]
      },
      # === 埼玉高速鉄道 ===
      {
        company: "埼玉高速鉄道", company_code: "saitama_railway",
        lines: [
          {
            code: "saitama_railway", name: "埼玉高速鉄道", color: "#339933", display_order: 1,
            stations: [
              { code: "kawaguchi_motogo_sr", name: "川口元郷", name_kana: "かわぐちもとごう", display_order: 1 },
              { code: "minami_hatogaya_sr", name: "南鳩ヶ谷", name_kana: "みなみはとがや", display_order: 2 },
              { code: "hatogaya_sr", name: "鳩ヶ谷", name_kana: "はとがや", display_order: 3 },
              { code: "araijuku_sr", name: "新井宿", name_kana: "あらいじゅく", display_order: 4 },
              { code: "totsuka_angyo_sr", name: "戸塚安行", name_kana: "とつかあんぎょう", display_order: 5 },
              { code: "higashi_kawaguchi_sr", name: "東川口", name_kana: "ひがしかわぐち", display_order: 6 },
              { code: "urawa_misono_sr", name: "浦和美園", name_kana: "うらわみその", display_order: 7 },
            ]
          },
        ]
      },
      # === 埼玉新都市交通（ニューシャトル） ===
      {
        company: "埼玉新都市交通", company_code: "new_shuttle",
        lines: [
          {
            code: "new_shuttle_ina", name: "埼玉新都市交通伊奈線", color: "#ff6600", display_order: 1,
            stations: [
              { code: "omiya_new_shuttle", name: "大宮", name_kana: "おおみや", display_order: 1 },
              { code: "tetsudo_hakubutsukan_new_shuttle", name: "鉄道博物館", name_kana: "てつどうはくぶつかん", display_order: 2 },
              { code: "kamomiya_new_shuttle", name: "加茂宮", name_kana: "かももみや", display_order: 3 },
              { code: "higashi_miyahara_new_shuttle", name: "東宮原", name_kana: "ひがしみやはら", display_order: 4 },
              { code: "konba_new_shuttle", name: "今羽", name_kana: "こんば", display_order: 5 },
              { code: "yoshinohara_new_shuttle", name: "吉野原", name_kana: "よしのはら", display_order: 6 },
              { code: "haraichi_new_shuttle", name: "原市", name_kana: "はらいち", display_order: 7 },
              { code: "shonan_new_shuttle", name: "沼南", name_kana: "しょうなん", display_order: 8 },
              { code: "maruyama_new_shuttle", name: "丸山", name_kana: "まるやま", display_order: 9 },
              { code: "shiku_new_shuttle", name: "志久", name_kana: "しく", display_order: 10 },
              { code: "ina_chuo_new_shuttle", name: "伊奈中央", name_kana: "いなちゅうおう", display_order: 11 },
              { code: "hanuki_new_shuttle", name: "羽貫", name_kana: "はぬき", display_order: 12 },
              { code: "uchijuku_new_shuttle", name: "内宿", name_kana: "うちじゅく", display_order: 13 },
            ]
          },
        ]
      },
      # === 秩父鉄道 ===
      {
        company: "秩父鉄道", company_code: "chichibu",
        lines: [
          {
            code: "chichibu_line", name: "秩父鉄道", color: "#0099cc", display_order: 1,
            stations: [
              { code: "hanyu_chichibu", name: "羽生", name_kana: "はにゅう", display_order: 1 },
              { code: "nishi_hanyu_chichibu", name: "西羽生", name_kana: "にしはにゅう", display_order: 2 },
              { code: "shingo_chichibu", name: "新郷", name_kana: "しんごう", display_order: 3 },
              { code: "bushu_araki_chichibu", name: "武州荒木", name_kana: "ぶしゅうあらき", display_order: 4 },
              { code: "higashi_gyoda_chichibu", name: "東行田", name_kana: "ひがしぎょうだ", display_order: 5 },
              { code: "gyodashi_chichibu", name: "行田市", name_kana: "ぎょうだし", display_order: 6 },
              { code: "mochida_chichibu", name: "持田", name_kana: "もちだ", display_order: 7 },
              { code: "socio_chichibu", name: "ソシオ流通センター", name_kana: "そしおりゅうつうせんたー", display_order: 8 },
              { code: "kumagaya_chichibu", name: "熊谷", name_kana: "くまがや", display_order: 9 },
              { code: "kami_kumagaya_chichibu", name: "上熊谷", name_kana: "かみくまがや", display_order: 10 },
              { code: "ishihara_chichibu", name: "石原", name_kana: "いしはら", display_order: 11 },
              { code: "hirose_yacho_chichibu", name: "ひろせ野鳥の森", name_kana: "ひろせやちょうのもり", display_order: 12 },
              { code: "hirosegawara_chichibu", name: "広瀬川原", name_kana: "ひろせがわら", display_order: 13 },
              { code: "oaso_chichibu", name: "大麻生", name_kana: "おおあそう", display_order: 14 },
              { code: "aketo_chichibu", name: "明戸", name_kana: "あけと", display_order: 15 },
              { code: "takekawa_chichibu", name: "武川", name_kana: "たけかわ", display_order: 16 },
              { code: "nagata_chichibu", name: "永田", name_kana: "ながた", display_order: 17 },
              { code: "fukaya_hanazono_chichibu", name: "ふかや花園", name_kana: "ふかやはなぞの", display_order: 18 },
              { code: "komada_chichibu", name: "小前田", name_kana: "こまえだ", display_order: 19 },
              { code: "sakurazawa_chichibu", name: "桜沢", name_kana: "さくらざわ", display_order: 20 },
              { code: "yorii_chichibu", name: "寄居", name_kana: "よりい", display_order: 21 },
              { code: "hakure_chichibu", name: "波久礼", name_kana: "はくれ", display_order: 22 },
              { code: "higuchi_chichibu", name: "樋口", name_kana: "ひぐち", display_order: 23 },
              { code: "nogami_chichibu", name: "野上", name_kana: "のがみ", display_order: 24 },
              { code: "nagatoro_chichibu", name: "長瀞", name_kana: "ながとろ", display_order: 25 },
              { code: "kami_nagatoro_chichibu", name: "上長瀞", name_kana: "かみながとろ", display_order: 26 },
              { code: "oyahana_chichibu", name: "親鼻", name_kana: "おやはな", display_order: 27 },
              { code: "minano_chichibu", name: "皆野", name_kana: "みなの", display_order: 28 },
              { code: "wado_kuroya_chichibu", name: "和銅黒谷", name_kana: "わどうくろや", display_order: 29 },
              { code: "onohara_chichibu", name: "大野原", name_kana: "おおのはら", display_order: 30 },
              { code: "chichibu_chichibu", name: "秩父", name_kana: "ちちぶ", display_order: 31 },
              { code: "ohanabatake_chichibu", name: "御花畑", name_kana: "おはなばたけ", display_order: 32 },
              { code: "kagemori_chichibu", name: "影森", name_kana: "かげもり", display_order: 33 },
              { code: "urayamaguchi_chichibu", name: "浦山口", name_kana: "うらやまぐち", display_order: 34 },
              { code: "bushu_nakagawa_chichibu", name: "武州中川", name_kana: "ぶしゅうなかがわ", display_order: 35 },
              { code: "bushu_hino_chichibu", name: "武州日野", name_kana: "ぶしゅうひの", display_order: 36 },
              { code: "shiroku_chichibu", name: "白久", name_kana: "しろく", display_order: 37 },
              { code: "mitsumineguchi_chichibu", name: "三峰口", name_kana: "みつみねぐち", display_order: 38 },
            ]
          },
        ]
      },
    ]

    line_count = 0
    station_count = 0

    railway_data.each do |company_data|
      company_data[:lines].each do |line_data|
        railway_line = RailwayLine.find_or_initialize_by(code: line_data[:code])
        railway_line.assign_attributes(
          name: line_data[:name],
          company: company_data[:company],
          company_code: company_data[:company_code],
          color: line_data[:color],
          display_order: line_data[:display_order],
          is_active: true
        )
        railway_line.save!
        line_count += 1

        line_data[:stations].each do |station_data|
          station = Station.find_or_initialize_by(code: station_data[:code])
          station.assign_attributes(
            railway_line: railway_line,
            name: station_data[:name],
            name_kana: station_data[:name_kana],
            display_order: station_data[:display_order],
            is_active: true
          )
          station.save!
          station_count += 1
        end
      end
    end

    puts "完了: #{line_count}路線, #{station_count}駅を登録/更新しました"
  end
end
