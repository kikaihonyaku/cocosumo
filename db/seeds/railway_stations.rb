# 沿線・駅マスタデータ
# 首都圏・関西の主要路線

puts "沿線・駅マスタデータを作成中..."

railway_data = [
  # === JR東日本 ===
  {
    company: "JR東日本", company_code: "jr_east",
    lines: [
      {
        code: "jr_yamanote", name: "JR山手線", color: "#9acd32", display_order: 1,
        stations: [
          { code: "tokyo_jr_yamanote", name: "東京", name_kana: "とうきょう", display_order: 1 },
          { code: "yurakucho_jr_yamanote", name: "有楽町", name_kana: "ゆうらくちょう", display_order: 2 },
          { code: "shimbashi_jr_yamanote", name: "新橋", name_kana: "しんばし", display_order: 3 },
          { code: "hamamatsucho_jr_yamanote", name: "浜松町", name_kana: "はままつちょう", display_order: 4 },
          { code: "tamachi_jr_yamanote", name: "田町", name_kana: "たまち", display_order: 5 },
          { code: "takanawa_gateway_jr_yamanote", name: "高輪ゲートウェイ", name_kana: "たかなわげーとうぇい", display_order: 6 },
          { code: "shinagawa_jr_yamanote", name: "品川", name_kana: "しながわ", display_order: 7 },
          { code: "osaki_jr_yamanote", name: "大崎", name_kana: "おおさき", display_order: 8 },
          { code: "gotanda_jr_yamanote", name: "五反田", name_kana: "ごたんだ", display_order: 9 },
          { code: "meguro_jr_yamanote", name: "目黒", name_kana: "めぐろ", display_order: 10 },
          { code: "ebisu_jr_yamanote", name: "恵比寿", name_kana: "えびす", display_order: 11 },
          { code: "shibuya_jr_yamanote", name: "渋谷", name_kana: "しぶや", display_order: 12 },
          { code: "harajuku_jr_yamanote", name: "原宿", name_kana: "はらじゅく", display_order: 13 },
          { code: "yoyogi_jr_yamanote", name: "代々木", name_kana: "よよぎ", display_order: 14 },
          { code: "shinjuku_jr_yamanote", name: "新宿", name_kana: "しんじゅく", display_order: 15 },
          { code: "shin_okubo_jr_yamanote", name: "新大久保", name_kana: "しんおおくぼ", display_order: 16 },
          { code: "takadanobaba_jr_yamanote", name: "高田馬場", name_kana: "たかだのばば", display_order: 17 },
          { code: "mejiro_jr_yamanote", name: "目白", name_kana: "めじろ", display_order: 18 },
          { code: "ikebukuro_jr_yamanote", name: "池袋", name_kana: "いけぶくろ", display_order: 19 },
          { code: "otsuka_jr_yamanote", name: "大塚", name_kana: "おおつか", display_order: 20 },
          { code: "sugamo_jr_yamanote", name: "巣鴨", name_kana: "すがも", display_order: 21 },
          { code: "komagome_jr_yamanote", name: "駒込", name_kana: "こまごめ", display_order: 22 },
          { code: "tabata_jr_yamanote", name: "田端", name_kana: "たばた", display_order: 23 },
          { code: "nishi_nippori_jr_yamanote", name: "西日暮里", name_kana: "にしにっぽり", display_order: 24 },
          { code: "nippori_jr_yamanote", name: "日暮里", name_kana: "にっぽり", display_order: 25 },
          { code: "uguisudani_jr_yamanote", name: "鶯谷", name_kana: "うぐいすだに", display_order: 26 },
          { code: "ueno_jr_yamanote", name: "上野", name_kana: "うえの", display_order: 27 },
          { code: "okachimachi_jr_yamanote", name: "御徒町", name_kana: "おかちまち", display_order: 28 },
          { code: "akihabara_jr_yamanote", name: "秋葉原", name_kana: "あきはばら", display_order: 29 },
          { code: "kanda_jr_yamanote", name: "神田", name_kana: "かんだ", display_order: 30 },
        ]
      },
      {
        code: "jr_chuo", name: "JR中央線", color: "#ff4500", display_order: 2,
        stations: [
          { code: "tokyo_jr_chuo", name: "東京", name_kana: "とうきょう", display_order: 1 },
          { code: "kanda_jr_chuo", name: "神田", name_kana: "かんだ", display_order: 2 },
          { code: "ochanomizu_jr_chuo", name: "御茶ノ水", name_kana: "おちゃのみず", display_order: 3 },
          { code: "yotsuya_jr_chuo", name: "四ツ谷", name_kana: "よつや", display_order: 4 },
          { code: "shinjuku_jr_chuo", name: "新宿", name_kana: "しんじゅく", display_order: 5 },
          { code: "nakano_jr_chuo", name: "中野", name_kana: "なかの", display_order: 6 },
          { code: "koenji_jr_chuo", name: "高円寺", name_kana: "こうえんじ", display_order: 7 },
          { code: "asagaya_jr_chuo", name: "阿佐ヶ谷", name_kana: "あさがや", display_order: 8 },
          { code: "ogikubo_jr_chuo", name: "荻窪", name_kana: "おぎくぼ", display_order: 9 },
          { code: "nishi_ogikubo_jr_chuo", name: "西荻窪", name_kana: "にしおぎくぼ", display_order: 10 },
          { code: "kichijoji_jr_chuo", name: "吉祥寺", name_kana: "きちじょうじ", display_order: 11 },
          { code: "mitaka_jr_chuo", name: "三鷹", name_kana: "みたか", display_order: 12 },
          { code: "musashisakai_jr_chuo", name: "武蔵境", name_kana: "むさしさかい", display_order: 13 },
          { code: "higashi_koganei_jr_chuo", name: "東小金井", name_kana: "ひがしこがねい", display_order: 14 },
          { code: "koganei_jr_chuo", name: "武蔵小金井", name_kana: "むさしこがねい", display_order: 15 },
          { code: "kokubunji_jr_chuo", name: "国分寺", name_kana: "こくぶんじ", display_order: 16 },
          { code: "nishi_kokubunji_jr_chuo", name: "西国分寺", name_kana: "にしこくぶんじ", display_order: 17 },
          { code: "kunitachi_jr_chuo", name: "国立", name_kana: "くにたち", display_order: 18 },
          { code: "tachikawa_jr_chuo", name: "立川", name_kana: "たちかわ", display_order: 19 },
        ]
      },
      {
        code: "jr_sobu", name: "JR総武線", color: "#ffd700", display_order: 3,
        stations: [
          { code: "akihabara_jr_sobu", name: "秋葉原", name_kana: "あきはばら", display_order: 1 },
          { code: "asakusabashi_jr_sobu", name: "浅草橋", name_kana: "あさくさばし", display_order: 2 },
          { code: "ryogoku_jr_sobu", name: "両国", name_kana: "りょうごく", display_order: 3 },
          { code: "kinshicho_jr_sobu", name: "錦糸町", name_kana: "きんしちょう", display_order: 4 },
          { code: "kameido_jr_sobu", name: "亀戸", name_kana: "かめいど", display_order: 5 },
          { code: "hirai_jr_sobu", name: "平井", name_kana: "ひらい", display_order: 6 },
          { code: "shin_koiwa_jr_sobu", name: "新小岩", name_kana: "しんこいわ", display_order: 7 },
          { code: "koiwa_jr_sobu", name: "小岩", name_kana: "こいわ", display_order: 8 },
          { code: "ichikawa_jr_sobu", name: "市川", name_kana: "いちかわ", display_order: 9 },
          { code: "motoyawata_jr_sobu", name: "本八幡", name_kana: "もとやわた", display_order: 10 },
          { code: "shimousa_nakayama_jr_sobu", name: "下総中山", name_kana: "しもうさなかやま", display_order: 11 },
          { code: "nishi_funabashi_jr_sobu", name: "西船橋", name_kana: "にしふなばし", display_order: 12 },
          { code: "funabashi_jr_sobu", name: "船橋", name_kana: "ふなばし", display_order: 13 },
          { code: "tsudanuma_jr_sobu", name: "津田沼", name_kana: "つだぬま", display_order: 14 },
          { code: "chiba_jr_sobu", name: "千葉", name_kana: "ちば", display_order: 15 },
        ]
      },
      {
        code: "jr_keihin_tohoku", name: "JR京浜東北線", color: "#00bfff", display_order: 4,
        stations: [
          { code: "omiya_jr_keihin_tohoku", name: "大宮", name_kana: "おおみや", display_order: 1 },
          { code: "urawa_jr_keihin_tohoku", name: "浦和", name_kana: "うらわ", display_order: 2 },
          { code: "kawaguchi_jr_keihin_tohoku", name: "川口", name_kana: "かわぐち", display_order: 3 },
          { code: "akabane_jr_keihin_tohoku", name: "赤羽", name_kana: "あかばね", display_order: 4 },
          { code: "oji_jr_keihin_tohoku", name: "王子", name_kana: "おうじ", display_order: 5 },
          { code: "ueno_jr_keihin_tohoku", name: "上野", name_kana: "うえの", display_order: 6 },
          { code: "tokyo_jr_keihin_tohoku", name: "東京", name_kana: "とうきょう", display_order: 7 },
          { code: "shinagawa_jr_keihin_tohoku", name: "品川", name_kana: "しながわ", display_order: 8 },
          { code: "kawasaki_jr_keihin_tohoku", name: "川崎", name_kana: "かわさき", display_order: 9 },
          { code: "yokohama_jr_keihin_tohoku", name: "横浜", name_kana: "よこはま", display_order: 10 },
        ]
      },
      {
        code: "jr_saikyo", name: "JR埼京線", color: "#006400", display_order: 5,
        stations: [
          { code: "osaki_jr_saikyo", name: "大崎", name_kana: "おおさき", display_order: 1 },
          { code: "ebisu_jr_saikyo", name: "恵比寿", name_kana: "えびす", display_order: 2 },
          { code: "shibuya_jr_saikyo", name: "渋谷", name_kana: "しぶや", display_order: 3 },
          { code: "shinjuku_jr_saikyo", name: "新宿", name_kana: "しんじゅく", display_order: 4 },
          { code: "ikebukuro_jr_saikyo", name: "池袋", name_kana: "いけぶくろ", display_order: 5 },
          { code: "itabashi_jr_saikyo", name: "板橋", name_kana: "いたばし", display_order: 6 },
          { code: "jujo_jr_saikyo", name: "十条", name_kana: "じゅうじょう", display_order: 7 },
          { code: "akabane_jr_saikyo", name: "赤羽", name_kana: "あかばね", display_order: 8 },
          { code: "musashi_urawa_jr_saikyo", name: "武蔵浦和", name_kana: "むさしうらわ", display_order: 9 },
          { code: "omiya_jr_saikyo", name: "大宮", name_kana: "おおみや", display_order: 10 },
        ]
      },
    ]
  },
  # === 東京メトロ ===
  {
    company: "東京メトロ", company_code: "tokyo_metro",
    lines: [
      {
        code: "metro_ginza", name: "東京メトロ銀座線", color: "#ff9500", display_order: 1,
        stations: [
          { code: "shibuya_metro_ginza", name: "渋谷", name_kana: "しぶや", display_order: 1 },
          { code: "omotesando_metro_ginza", name: "表参道", name_kana: "おもてさんどう", display_order: 2 },
          { code: "gaiemmae_metro_ginza", name: "外苑前", name_kana: "がいえんまえ", display_order: 3 },
          { code: "aoyama_itchome_metro_ginza", name: "青山一丁目", name_kana: "あおやまいっちょうめ", display_order: 4 },
          { code: "akasaka_mitsuke_metro_ginza", name: "赤坂見附", name_kana: "あかさかみつけ", display_order: 5 },
          { code: "tameike_sanno_metro_ginza", name: "溜池山王", name_kana: "ためいけさんのう", display_order: 6 },
          { code: "toranomon_metro_ginza", name: "虎ノ門", name_kana: "とらのもん", display_order: 7 },
          { code: "shimbashi_metro_ginza", name: "新橋", name_kana: "しんばし", display_order: 8 },
          { code: "ginza_metro_ginza", name: "銀座", name_kana: "ぎんざ", display_order: 9 },
          { code: "nihombashi_metro_ginza", name: "日本橋", name_kana: "にほんばし", display_order: 10 },
          { code: "kanda_metro_ginza", name: "神田", name_kana: "かんだ", display_order: 11 },
          { code: "ueno_metro_ginza", name: "上野", name_kana: "うえの", display_order: 12 },
          { code: "asakusa_metro_ginza", name: "浅草", name_kana: "あさくさ", display_order: 13 },
        ]
      },
      {
        code: "metro_marunouchi", name: "東京メトロ丸ノ内線", color: "#f62e36", display_order: 2,
        stations: [
          { code: "ogikubo_metro_marunouchi", name: "荻窪", name_kana: "おぎくぼ", display_order: 1 },
          { code: "shin_koenji_metro_marunouchi", name: "新高円寺", name_kana: "しんこうえんじ", display_order: 2 },
          { code: "shin_nakano_metro_marunouchi", name: "新中野", name_kana: "しんなかの", display_order: 3 },
          { code: "nakano_sakaue_metro_marunouchi", name: "中野坂上", name_kana: "なかのさかうえ", display_order: 4 },
          { code: "nishi_shinjuku_metro_marunouchi", name: "西新宿", name_kana: "にししんじゅく", display_order: 5 },
          { code: "shinjuku_metro_marunouchi", name: "新宿", name_kana: "しんじゅく", display_order: 6 },
          { code: "shinjuku_sanchome_metro_marunouchi", name: "新宿三丁目", name_kana: "しんじゅくさんちょうめ", display_order: 7 },
          { code: "shinjuku_gyoenmae_metro_marunouchi", name: "新宿御苑前", name_kana: "しんじゅくぎょえんまえ", display_order: 8 },
          { code: "yotsuya_sanchome_metro_marunouchi", name: "四谷三丁目", name_kana: "よつやさんちょうめ", display_order: 9 },
          { code: "yotsuya_metro_marunouchi", name: "四ツ谷", name_kana: "よつや", display_order: 10 },
          { code: "akasaka_mitsuke_metro_marunouchi", name: "赤坂見附", name_kana: "あかさかみつけ", display_order: 11 },
          { code: "kasumigaseki_metro_marunouchi", name: "霞ヶ関", name_kana: "かすみがせき", display_order: 12 },
          { code: "ginza_metro_marunouchi", name: "銀座", name_kana: "ぎんざ", display_order: 13 },
          { code: "tokyo_metro_marunouchi", name: "東京", name_kana: "とうきょう", display_order: 14 },
          { code: "otemachi_metro_marunouchi", name: "大手町", name_kana: "おおてまち", display_order: 15 },
          { code: "awajicho_metro_marunouchi", name: "淡路町", name_kana: "あわじちょう", display_order: 16 },
          { code: "ochanomizu_metro_marunouchi", name: "御茶ノ水", name_kana: "おちゃのみず", display_order: 17 },
          { code: "hongo_sanchome_metro_marunouchi", name: "本郷三丁目", name_kana: "ほんごうさんちょうめ", display_order: 18 },
          { code: "korakuen_metro_marunouchi", name: "後楽園", name_kana: "こうらくえん", display_order: 19 },
          { code: "myogadani_metro_marunouchi", name: "茗荷谷", name_kana: "みょうがだに", display_order: 20 },
          { code: "shin_otsuka_metro_marunouchi", name: "新大塚", name_kana: "しんおおつか", display_order: 21 },
          { code: "ikebukuro_metro_marunouchi", name: "池袋", name_kana: "いけぶくろ", display_order: 22 },
        ]
      },
      {
        code: "metro_hibiya", name: "東京メトロ日比谷線", color: "#b5b5ac", display_order: 3,
        stations: [
          { code: "naka_meguro_metro_hibiya", name: "中目黒", name_kana: "なかめぐろ", display_order: 1 },
          { code: "ebisu_metro_hibiya", name: "恵比寿", name_kana: "えびす", display_order: 2 },
          { code: "hiroo_metro_hibiya", name: "広尾", name_kana: "ひろお", display_order: 3 },
          { code: "roppongi_metro_hibiya", name: "六本木", name_kana: "ろっぽんぎ", display_order: 4 },
          { code: "kasumigaseki_metro_hibiya", name: "霞ヶ関", name_kana: "かすみがせき", display_order: 5 },
          { code: "ginza_metro_hibiya", name: "銀座", name_kana: "ぎんざ", display_order: 6 },
          { code: "tsukiji_metro_hibiya", name: "築地", name_kana: "つきじ", display_order: 7 },
          { code: "akihabara_metro_hibiya", name: "秋葉原", name_kana: "あきはばら", display_order: 8 },
          { code: "ueno_metro_hibiya", name: "上野", name_kana: "うえの", display_order: 9 },
          { code: "minowa_metro_hibiya", name: "三ノ輪", name_kana: "みのわ", display_order: 10 },
          { code: "kita_senju_metro_hibiya", name: "北千住", name_kana: "きたせんじゅ", display_order: 11 },
        ]
      },
      {
        code: "metro_tozai", name: "東京メトロ東西線", color: "#009bbf", display_order: 4,
        stations: [
          { code: "nakano_metro_tozai", name: "中野", name_kana: "なかの", display_order: 1 },
          { code: "ochiai_metro_tozai", name: "落合", name_kana: "おちあい", display_order: 2 },
          { code: "takadanobaba_metro_tozai", name: "高田馬場", name_kana: "たかだのばば", display_order: 3 },
          { code: "waseda_metro_tozai", name: "早稲田", name_kana: "わせだ", display_order: 4 },
          { code: "kagurazaka_metro_tozai", name: "神楽坂", name_kana: "かぐらざか", display_order: 5 },
          { code: "iidabashi_metro_tozai", name: "飯田橋", name_kana: "いいだばし", display_order: 6 },
          { code: "kudanshita_metro_tozai", name: "九段下", name_kana: "くだんした", display_order: 7 },
          { code: "otemachi_metro_tozai", name: "大手町", name_kana: "おおてまち", display_order: 8 },
          { code: "nihombashi_metro_tozai", name: "日本橋", name_kana: "にほんばし", display_order: 9 },
          { code: "kayabacho_metro_tozai", name: "茅場町", name_kana: "かやばちょう", display_order: 10 },
          { code: "monzen_nakacho_metro_tozai", name: "門前仲町", name_kana: "もんぜんなかちょう", display_order: 11 },
          { code: "toyocho_metro_tozai", name: "東陽町", name_kana: "とうようちょう", display_order: 12 },
          { code: "minami_sunamachi_metro_tozai", name: "南砂町", name_kana: "みなみすなまち", display_order: 13 },
          { code: "nishi_kasai_metro_tozai", name: "西葛西", name_kana: "にしかさい", display_order: 14 },
          { code: "kasai_metro_tozai", name: "葛西", name_kana: "かさい", display_order: 15 },
          { code: "urayasu_metro_tozai", name: "浦安", name_kana: "うらやす", display_order: 16 },
          { code: "nishi_funabashi_metro_tozai", name: "西船橋", name_kana: "にしふなばし", display_order: 17 },
        ]
      },
      {
        code: "metro_chiyoda", name: "東京メトロ千代田線", color: "#00bb85", display_order: 5,
        stations: [
          { code: "yoyogi_uehara_metro_chiyoda", name: "代々木上原", name_kana: "よよぎうえはら", display_order: 1 },
          { code: "yoyogi_koen_metro_chiyoda", name: "代々木公園", name_kana: "よよぎこうえん", display_order: 2 },
          { code: "meiji_jingumae_metro_chiyoda", name: "明治神宮前", name_kana: "めいじじんぐうまえ", display_order: 3 },
          { code: "omotesando_metro_chiyoda", name: "表参道", name_kana: "おもてさんどう", display_order: 4 },
          { code: "nogizaka_metro_chiyoda", name: "乃木坂", name_kana: "のぎざか", display_order: 5 },
          { code: "akasaka_metro_chiyoda", name: "赤坂", name_kana: "あかさか", display_order: 6 },
          { code: "kokkai_gijidomae_metro_chiyoda", name: "国会議事堂前", name_kana: "こっかいぎじどうまえ", display_order: 7 },
          { code: "kasumigaseki_metro_chiyoda", name: "霞ヶ関", name_kana: "かすみがせき", display_order: 8 },
          { code: "hibiya_metro_chiyoda", name: "日比谷", name_kana: "ひびや", display_order: 9 },
          { code: "otemachi_metro_chiyoda", name: "大手町", name_kana: "おおてまち", display_order: 10 },
          { code: "shin_ochanomizu_metro_chiyoda", name: "新御茶ノ水", name_kana: "しんおちゃのみず", display_order: 11 },
          { code: "sendagi_metro_chiyoda", name: "千駄木", name_kana: "せんだぎ", display_order: 12 },
          { code: "nishi_nippori_metro_chiyoda", name: "西日暮里", name_kana: "にしにっぽり", display_order: 13 },
          { code: "machiya_metro_chiyoda", name: "町屋", name_kana: "まちや", display_order: 14 },
          { code: "kita_senju_metro_chiyoda", name: "北千住", name_kana: "きたせんじゅ", display_order: 15 },
          { code: "ayase_metro_chiyoda", name: "綾瀬", name_kana: "あやせ", display_order: 16 },
        ]
      },
      {
        code: "metro_yurakucho", name: "東京メトロ有楽町線", color: "#c1a470", display_order: 6,
        stations: [
          { code: "wakoshi_metro_yurakucho", name: "和光市", name_kana: "わこうし", display_order: 1 },
          { code: "chikatetsu_narimasu_metro_yurakucho", name: "地下鉄成増", name_kana: "ちかてつなります", display_order: 2 },
          { code: "chikatetsu_akatsuka_metro_yurakucho", name: "地下鉄赤塚", name_kana: "ちかてつあかつか", display_order: 3 },
          { code: "heiwadai_metro_yurakucho", name: "平和台", name_kana: "へいわだい", display_order: 4 },
          { code: "kanamecho_metro_yurakucho", name: "氷川台", name_kana: "ひかわだい", display_order: 5 },
          { code: "kotake_mukaihara_metro_yurakucho", name: "小竹向原", name_kana: "こたけむかいはら", display_order: 6 },
          { code: "ikebukuro_metro_yurakucho", name: "池袋", name_kana: "いけぶくろ", display_order: 7 },
          { code: "iidabashi_metro_yurakucho", name: "飯田橋", name_kana: "いいだばし", display_order: 8 },
          { code: "ichigaya_metro_yurakucho", name: "市ヶ谷", name_kana: "いちがや", display_order: 9 },
          { code: "kojimachi_metro_yurakucho", name: "麹町", name_kana: "こうじまち", display_order: 10 },
          { code: "nagatacho_metro_yurakucho", name: "永田町", name_kana: "ながたちょう", display_order: 11 },
          { code: "sakuradamon_metro_yurakucho", name: "桜田門", name_kana: "さくらだもん", display_order: 12 },
          { code: "yurakucho_metro_yurakucho", name: "有楽町", name_kana: "ゆうらくちょう", display_order: 13 },
          { code: "ginza_itchome_metro_yurakucho", name: "銀座一丁目", name_kana: "ぎんざいっちょうめ", display_order: 14 },
          { code: "shinkiba_metro_yurakucho", name: "新木場", name_kana: "しんきば", display_order: 15 },
        ]
      },
      {
        code: "metro_hanzomon", name: "東京メトロ半蔵門線", color: "#8f76d6", display_order: 7,
        stations: [
          { code: "shibuya_metro_hanzomon", name: "渋谷", name_kana: "しぶや", display_order: 1 },
          { code: "omotesando_metro_hanzomon", name: "表参道", name_kana: "おもてさんどう", display_order: 2 },
          { code: "aoyama_itchome_metro_hanzomon", name: "青山一丁目", name_kana: "あおやまいっちょうめ", display_order: 3 },
          { code: "nagatacho_metro_hanzomon", name: "永田町", name_kana: "ながたちょう", display_order: 4 },
          { code: "hanzomon_metro_hanzomon", name: "半蔵門", name_kana: "はんぞうもん", display_order: 5 },
          { code: "kudanshita_metro_hanzomon", name: "九段下", name_kana: "くだんした", display_order: 6 },
          { code: "otemachi_metro_hanzomon", name: "大手町", name_kana: "おおてまち", display_order: 7 },
          { code: "mitsukoshimae_metro_hanzomon", name: "三越前", name_kana: "みつこしまえ", display_order: 8 },
          { code: "suitengumae_metro_hanzomon", name: "水天宮前", name_kana: "すいてんぐうまえ", display_order: 9 },
          { code: "kiyosumi_shirakawa_metro_hanzomon", name: "清澄白河", name_kana: "きよすみしらかわ", display_order: 10 },
          { code: "kinshicho_metro_hanzomon", name: "錦糸町", name_kana: "きんしちょう", display_order: 11 },
          { code: "oshiage_metro_hanzomon", name: "押上", name_kana: "おしあげ", display_order: 12 },
        ]
      },
      {
        code: "metro_namboku", name: "東京メトロ南北線", color: "#00ac9b", display_order: 8,
        stations: [
          { code: "meguro_metro_namboku", name: "目黒", name_kana: "めぐろ", display_order: 1 },
          { code: "shirokanedai_metro_namboku", name: "白金台", name_kana: "しろかねだい", display_order: 2 },
          { code: "shirokane_takanawa_metro_namboku", name: "白金高輪", name_kana: "しろかねたかなわ", display_order: 3 },
          { code: "azabu_juban_metro_namboku", name: "麻布十番", name_kana: "あざぶじゅうばん", display_order: 4 },
          { code: "roppongi_itchome_metro_namboku", name: "六本木一丁目", name_kana: "ろっぽんぎいっちょうめ", display_order: 5 },
          { code: "tameike_sanno_metro_namboku", name: "溜池山王", name_kana: "ためいけさんのう", display_order: 6 },
          { code: "yotsuya_metro_namboku", name: "四ツ谷", name_kana: "よつや", display_order: 7 },
          { code: "ichigaya_metro_namboku", name: "市ヶ谷", name_kana: "いちがや", display_order: 8 },
          { code: "iidabashi_metro_namboku", name: "飯田橋", name_kana: "いいだばし", display_order: 9 },
          { code: "korakuen_metro_namboku", name: "後楽園", name_kana: "こうらくえん", display_order: 10 },
          { code: "todaimae_metro_namboku", name: "東大前", name_kana: "とうだいまえ", display_order: 11 },
          { code: "hon_komagome_metro_namboku", name: "本駒込", name_kana: "ほんこまごめ", display_order: 12 },
          { code: "komagome_metro_namboku", name: "駒込", name_kana: "こまごめ", display_order: 13 },
          { code: "nishi_sugamo_metro_namboku", name: "西ヶ原", name_kana: "にしがはら", display_order: 14 },
          { code: "oji_metro_namboku", name: "王子", name_kana: "おうじ", display_order: 15 },
          { code: "oji_kamiya_metro_namboku", name: "王子神谷", name_kana: "おうじかみや", display_order: 16 },
          { code: "akabane_iwabuchi_metro_namboku", name: "赤羽岩淵", name_kana: "あかばねいわぶち", display_order: 17 },
        ]
      },
      {
        code: "metro_fukutoshin", name: "東京メトロ副都心線", color: "#9c5e31", display_order: 9,
        stations: [
          { code: "wakoshi_metro_fukutoshin", name: "和光市", name_kana: "わこうし", display_order: 1 },
          { code: "kotake_mukaihara_metro_fukutoshin", name: "小竹向原", name_kana: "こたけむかいはら", display_order: 2 },
          { code: "ikebukuro_metro_fukutoshin", name: "池袋", name_kana: "いけぶくろ", display_order: 3 },
          { code: "zoshigaya_metro_fukutoshin", name: "雑司が谷", name_kana: "ぞうしがや", display_order: 4 },
          { code: "nishi_waseda_metro_fukutoshin", name: "西早稲田", name_kana: "にしわせだ", display_order: 5 },
          { code: "higashi_shinjuku_metro_fukutoshin", name: "東新宿", name_kana: "ひがししんじゅく", display_order: 6 },
          { code: "shinjuku_sanchome_metro_fukutoshin", name: "新宿三丁目", name_kana: "しんじゅくさんちょうめ", display_order: 7 },
          { code: "kita_sando_metro_fukutoshin", name: "北参道", name_kana: "きたさんどう", display_order: 8 },
          { code: "meiji_jingumae_metro_fukutoshin", name: "明治神宮前", name_kana: "めいじじんぐうまえ", display_order: 9 },
          { code: "shibuya_metro_fukutoshin", name: "渋谷", name_kana: "しぶや", display_order: 10 },
        ]
      },
    ]
  },
  # === 都営地下鉄 ===
  {
    company: "都営地下鉄", company_code: "toei",
    lines: [
      {
        code: "toei_asakusa", name: "都営浅草線", color: "#e85298", display_order: 1,
        stations: [
          { code: "nishi_magome_toei_asakusa", name: "西馬込", name_kana: "にしまごめ", display_order: 1 },
          { code: "gotanda_toei_asakusa", name: "五反田", name_kana: "ごたんだ", display_order: 2 },
          { code: "takanawadai_toei_asakusa", name: "高輪台", name_kana: "たかなわだい", display_order: 3 },
          { code: "sengakuji_toei_asakusa", name: "泉岳寺", name_kana: "せんがくじ", display_order: 4 },
          { code: "daimon_toei_asakusa", name: "大門", name_kana: "だいもん", display_order: 5 },
          { code: "shimbashi_toei_asakusa", name: "新橋", name_kana: "しんばし", display_order: 6 },
          { code: "higashi_ginza_toei_asakusa", name: "東銀座", name_kana: "ひがしぎんざ", display_order: 7 },
          { code: "nihombashi_toei_asakusa", name: "日本橋", name_kana: "にほんばし", display_order: 8 },
          { code: "asakusabashi_toei_asakusa", name: "浅草橋", name_kana: "あさくさばし", display_order: 9 },
          { code: "asakusa_toei_asakusa", name: "浅草", name_kana: "あさくさ", display_order: 10 },
          { code: "oshiage_toei_asakusa", name: "押上", name_kana: "おしあげ", display_order: 11 },
        ]
      },
      {
        code: "toei_mita", name: "都営三田線", color: "#0079c2", display_order: 2,
        stations: [
          { code: "meguro_toei_mita", name: "目黒", name_kana: "めぐろ", display_order: 1 },
          { code: "shirokanedai_toei_mita", name: "白金台", name_kana: "しろかねだい", display_order: 2 },
          { code: "shirokane_takanawa_toei_mita", name: "白金高輪", name_kana: "しろかねたかなわ", display_order: 3 },
          { code: "mita_toei_mita", name: "三田", name_kana: "みた", display_order: 4 },
          { code: "shibakoen_toei_mita", name: "芝公園", name_kana: "しばこうえん", display_order: 5 },
          { code: "onarimon_toei_mita", name: "御成門", name_kana: "おなりもん", display_order: 6 },
          { code: "uchisaiwaicho_toei_mita", name: "内幸町", name_kana: "うちさいわいちょう", display_order: 7 },
          { code: "hibiya_toei_mita", name: "日比谷", name_kana: "ひびや", display_order: 8 },
          { code: "otemachi_toei_mita", name: "大手町", name_kana: "おおてまち", display_order: 9 },
          { code: "jimbocho_toei_mita", name: "神保町", name_kana: "じんぼうちょう", display_order: 10 },
          { code: "suidobashi_toei_mita", name: "水道橋", name_kana: "すいどうばし", display_order: 11 },
          { code: "kasuga_toei_mita", name: "春日", name_kana: "かすが", display_order: 12 },
          { code: "sugamo_toei_mita", name: "巣鴨", name_kana: "すがも", display_order: 13 },
          { code: "nishi_sugamo_toei_mita", name: "西巣鴨", name_kana: "にしすがも", display_order: 14 },
          { code: "shin_itabashi_toei_mita", name: "新板橋", name_kana: "しんいたばし", display_order: 15 },
          { code: "itabashikuyakushomae_toei_mita", name: "板橋区役所前", name_kana: "いたばしくやくしょまえ", display_order: 16 },
          { code: "nishi_takashimadaira_toei_mita", name: "西高島平", name_kana: "にしたかしまだいら", display_order: 17 },
        ]
      },
      {
        code: "toei_shinjuku", name: "都営新宿線", color: "#6cbb5a", display_order: 3,
        stations: [
          { code: "shinjuku_toei_shinjuku", name: "新宿", name_kana: "しんじゅく", display_order: 1 },
          { code: "shinjuku_sanchome_toei_shinjuku", name: "新宿三丁目", name_kana: "しんじゅくさんちょうめ", display_order: 2 },
          { code: "akebonobashi_toei_shinjuku", name: "曙橋", name_kana: "あけぼのばし", display_order: 3 },
          { code: "ichigaya_toei_shinjuku", name: "市ヶ谷", name_kana: "いちがや", display_order: 4 },
          { code: "kudanshita_toei_shinjuku", name: "九段下", name_kana: "くだんした", display_order: 5 },
          { code: "jimbocho_toei_shinjuku", name: "神保町", name_kana: "じんぼうちょう", display_order: 6 },
          { code: "ogawamachi_toei_shinjuku", name: "小川町", name_kana: "おがわまち", display_order: 7 },
          { code: "iwamotocho_toei_shinjuku", name: "岩本町", name_kana: "いわもとちょう", display_order: 8 },
          { code: "bakuro_yokoyama_toei_shinjuku", name: "馬喰横山", name_kana: "ばくろよこやま", display_order: 9 },
          { code: "morishita_toei_shinjuku", name: "森下", name_kana: "もりした", display_order: 10 },
          { code: "sumiyoshi_toei_shinjuku", name: "住吉", name_kana: "すみよし", display_order: 11 },
          { code: "nishi_ojima_toei_shinjuku", name: "西大島", name_kana: "にしおおじま", display_order: 12 },
          { code: "ojima_toei_shinjuku", name: "大島", name_kana: "おおじま", display_order: 13 },
          { code: "funabori_toei_shinjuku", name: "船堀", name_kana: "ふなぼり", display_order: 14 },
          { code: "motoyawata_toei_shinjuku", name: "本八幡", name_kana: "もとやわた", display_order: 15 },
        ]
      },
      {
        code: "toei_oedo", name: "都営大江戸線", color: "#b6007a", display_order: 4,
        stations: [
          { code: "shinjuku_nishiguchi_toei_oedo", name: "新宿西口", name_kana: "しんじゅくにしぐち", display_order: 1 },
          { code: "tochomae_toei_oedo", name: "都庁前", name_kana: "とちょうまえ", display_order: 2 },
          { code: "roppongi_toei_oedo", name: "六本木", name_kana: "ろっぽんぎ", display_order: 3 },
          { code: "azabu_juban_toei_oedo", name: "麻布十番", name_kana: "あざぶじゅうばん", display_order: 4 },
          { code: "daimon_toei_oedo", name: "大門", name_kana: "だいもん", display_order: 5 },
          { code: "tsukishima_toei_oedo", name: "月島", name_kana: "つきしま", display_order: 6 },
          { code: "ryogoku_toei_oedo", name: "両国", name_kana: "りょうごく", display_order: 7 },
          { code: "ueno_okachimachi_toei_oedo", name: "上野御徒町", name_kana: "うえのおかちまち", display_order: 8 },
          { code: "iidabashi_toei_oedo", name: "飯田橋", name_kana: "いいだばし", display_order: 9 },
          { code: "tochomae2_toei_oedo", name: "都庁前", name_kana: "とちょうまえ", display_order: 10 },
          { code: "nerima_toei_oedo", name: "練馬", name_kana: "ねりま", display_order: 11 },
          { code: "hikarigaoka_toei_oedo", name: "光が丘", name_kana: "ひかりがおか", display_order: 12 },
        ]
      },
    ]
  },
  # === 東急 ===
  {
    company: "東急電鉄", company_code: "tokyu",
    lines: [
      {
        code: "tokyu_toyoko", name: "東急東横線", color: "#da0442", display_order: 1,
        stations: [
          { code: "shibuya_tokyu_toyoko", name: "渋谷", name_kana: "しぶや", display_order: 1 },
          { code: "daikanyama_tokyu_toyoko", name: "代官山", name_kana: "だいかんやま", display_order: 2 },
          { code: "naka_meguro_tokyu_toyoko", name: "中目黒", name_kana: "なかめぐろ", display_order: 3 },
          { code: "yutenji_tokyu_toyoko", name: "祐天寺", name_kana: "ゆうてんじ", display_order: 4 },
          { code: "gakugei_daigaku_tokyu_toyoko", name: "学芸大学", name_kana: "がくげいだいがく", display_order: 5 },
          { code: "toritsudaigaku_tokyu_toyoko", name: "都立大学", name_kana: "とりつだいがく", display_order: 6 },
          { code: "jiyugaoka_tokyu_toyoko", name: "自由が丘", name_kana: "じゆうがおか", display_order: 7 },
          { code: "den_en_chofu_tokyu_toyoko", name: "田園調布", name_kana: "でんえんちょうふ", display_order: 8 },
          { code: "tama_plaza_tokyu_toyoko", name: "多摩川", name_kana: "たまがわ", display_order: 9 },
          { code: "musashi_kosugi_tokyu_toyoko", name: "武蔵小杉", name_kana: "むさしこすぎ", display_order: 10 },
          { code: "hiyoshi_tokyu_toyoko", name: "日吉", name_kana: "ひよし", display_order: 11 },
          { code: "tsunashima_tokyu_toyoko", name: "綱島", name_kana: "つなしま", display_order: 12 },
          { code: "kikuna_tokyu_toyoko", name: "菊名", name_kana: "きくな", display_order: 13 },
          { code: "yokohama_tokyu_toyoko", name: "横浜", name_kana: "よこはま", display_order: 14 },
        ]
      },
      {
        code: "tokyu_denentoshi", name: "東急田園都市線", color: "#0d9c4b", display_order: 2,
        stations: [
          { code: "shibuya_tokyu_denentoshi", name: "渋谷", name_kana: "しぶや", display_order: 1 },
          { code: "ikejiri_ohashi_tokyu_denentoshi", name: "池尻大橋", name_kana: "いけじりおおはし", display_order: 2 },
          { code: "sangen_jaya_tokyu_denentoshi", name: "三軒茶屋", name_kana: "さんげんぢゃや", display_order: 3 },
          { code: "komazawa_daigaku_tokyu_denentoshi", name: "駒沢大学", name_kana: "こまざわだいがく", display_order: 4 },
          { code: "sakura_shinmachi_tokyu_denentoshi", name: "桜新町", name_kana: "さくらしんまち", display_order: 5 },
          { code: "yoga_tokyu_denentoshi", name: "用賀", name_kana: "ようが", display_order: 6 },
          { code: "futako_tamagawa_tokyu_denentoshi", name: "二子玉川", name_kana: "ふたこたまがわ", display_order: 7 },
          { code: "mizonokuchi_tokyu_denentoshi", name: "溝の口", name_kana: "みぞのくち", display_order: 8 },
          { code: "saginuma_tokyu_denentoshi", name: "鷺沼", name_kana: "さぎぬま", display_order: 9 },
          { code: "tama_plaza_tokyu_denentoshi", name: "たまプラーザ", name_kana: "たまぷらーざ", display_order: 10 },
          { code: "aobadai_tokyu_denentoshi", name: "青葉台", name_kana: "あおばだい", display_order: 11 },
          { code: "nagatsuta_tokyu_denentoshi", name: "長津田", name_kana: "ながつた", display_order: 12 },
          { code: "chuo_rinkan_tokyu_denentoshi", name: "中央林間", name_kana: "ちゅうおうりんかん", display_order: 13 },
        ]
      },
    ]
  },
  # === 小田急 ===
  {
    company: "小田急電鉄", company_code: "odakyu",
    lines: [
      {
        code: "odakyu_odawara", name: "小田急小田原線", color: "#1e90ff", display_order: 1,
        stations: [
          { code: "shinjuku_odakyu", name: "新宿", name_kana: "しんじゅく", display_order: 1 },
          { code: "minami_shinjuku_odakyu", name: "南新宿", name_kana: "みなみしんじゅく", display_order: 2 },
          { code: "sangubashi_odakyu", name: "参宮橋", name_kana: "さんぐうばし", display_order: 3 },
          { code: "yoyogi_hachiman_odakyu", name: "代々木八幡", name_kana: "よよぎはちまん", display_order: 4 },
          { code: "yoyogi_uehara_odakyu", name: "代々木上原", name_kana: "よよぎうえはら", display_order: 5 },
          { code: "higashi_kitazawa_odakyu", name: "東北沢", name_kana: "ひがしきたざわ", display_order: 6 },
          { code: "shimokitazawa_odakyu", name: "下北沢", name_kana: "しもきたざわ", display_order: 7 },
          { code: "setagaya_daita_odakyu", name: "世田谷代田", name_kana: "せたがやだいた", display_order: 8 },
          { code: "umegaoka_odakyu", name: "梅ヶ丘", name_kana: "うめがおか", display_order: 9 },
          { code: "kyodo_odakyu", name: "経堂", name_kana: "きょうどう", display_order: 10 },
          { code: "chitose_funabashi_odakyu", name: "千歳船橋", name_kana: "ちとせふなばし", display_order: 11 },
          { code: "soshigaya_okura_odakyu", name: "祖師ヶ谷大蔵", name_kana: "そしがやおおくら", display_order: 12 },
          { code: "seijogakuenmae_odakyu", name: "成城学園前", name_kana: "せいじょうがくえんまえ", display_order: 13 },
          { code: "noborito_odakyu", name: "登戸", name_kana: "のぼりと", display_order: 14 },
          { code: "machida_odakyu", name: "町田", name_kana: "まちだ", display_order: 15 },
        ]
      },
    ]
  },
  # === 京王 ===
  {
    company: "京王電鉄", company_code: "keio",
    lines: [
      {
        code: "keio_line", name: "京王線", color: "#dd0077", display_order: 1,
        stations: [
          { code: "shinjuku_keio", name: "新宿", name_kana: "しんじゅく", display_order: 1 },
          { code: "sasazuka_keio", name: "笹塚", name_kana: "ささづか", display_order: 2 },
          { code: "daitabashi_keio", name: "代田橋", name_kana: "だいたばし", display_order: 3 },
          { code: "meidaimae_keio", name: "明大前", name_kana: "めいだいまえ", display_order: 4 },
          { code: "shimotakaido_keio", name: "下高井戸", name_kana: "しもたかいど", display_order: 5 },
          { code: "sakurajosui_keio", name: "桜上水", name_kana: "さくらじょうすい", display_order: 6 },
          { code: "chitose_karasuyama_keio", name: "千歳烏山", name_kana: "ちとせからすやま", display_order: 7 },
          { code: "tsutsujigaoka_keio", name: "つつじヶ丘", name_kana: "つつじがおか", display_order: 8 },
          { code: "chofu_keio", name: "調布", name_kana: "ちょうふ", display_order: 9 },
          { code: "fuchu_keio", name: "府中", name_kana: "ふちゅう", display_order: 10 },
        ]
      },
      {
        code: "keio_inokashira", name: "京王井の頭線", color: "#1e9cd4", display_order: 2,
        stations: [
          { code: "shibuya_keio_inokashira", name: "渋谷", name_kana: "しぶや", display_order: 1 },
          { code: "shinsen_keio_inokashira", name: "神泉", name_kana: "しんせん", display_order: 2 },
          { code: "komaba_todaimae_keio_inokashira", name: "駒場東大前", name_kana: "こまばとうだいまえ", display_order: 3 },
          { code: "shimokitazawa_keio_inokashira", name: "下北沢", name_kana: "しもきたざわ", display_order: 4 },
          { code: "shin_daita_keio_inokashira", name: "新代田", name_kana: "しんだいた", display_order: 5 },
          { code: "meidaimae_keio_inokashira", name: "明大前", name_kana: "めいだいまえ", display_order: 6 },
          { code: "eifukucho_keio_inokashira", name: "永福町", name_kana: "えいふくちょう", display_order: 7 },
          { code: "hamadayama_keio_inokashira", name: "浜田山", name_kana: "はまだやま", display_order: 8 },
          { code: "kugayama_keio_inokashira", name: "久我山", name_kana: "くがやま", display_order: 9 },
          { code: "mitaka_keio_inokashira", name: "三鷹台", name_kana: "みたかだい", display_order: 10 },
          { code: "inokashira_koen_keio_inokashira", name: "井の頭公園", name_kana: "いのかしらこうえん", display_order: 11 },
          { code: "kichijoji_keio_inokashira", name: "吉祥寺", name_kana: "きちじょうじ", display_order: 12 },
        ]
      },
    ]
  },
  # === 西武 ===
  {
    company: "西武鉄道", company_code: "seibu",
    lines: [
      {
        code: "seibu_ikebukuro", name: "西武池袋線", color: "#003399", display_order: 1,
        stations: [
          { code: "ikebukuro_seibu", name: "池袋", name_kana: "いけぶくろ", display_order: 1 },
          { code: "shiinamachi_seibu", name: "椎名町", name_kana: "しいなまち", display_order: 2 },
          { code: "higashi_nagasaki_seibu", name: "東長崎", name_kana: "ひがしながさき", display_order: 3 },
          { code: "ekoda_seibu", name: "江古田", name_kana: "えこだ", display_order: 4 },
          { code: "sakuradai_seibu", name: "桜台", name_kana: "さくらだい", display_order: 5 },
          { code: "nerima_seibu", name: "練馬", name_kana: "ねりま", display_order: 6 },
          { code: "nakamurabashi_seibu", name: "中村橋", name_kana: "なかむらばし", display_order: 7 },
          { code: "fujimidai_seibu", name: "富士見台", name_kana: "ふじみだい", display_order: 8 },
          { code: "shakujii_koen_seibu", name: "石神井公園", name_kana: "しゃくじいこうえん", display_order: 9 },
          { code: "oizumi_gakuen_seibu", name: "大泉学園", name_kana: "おおいずみがくえん", display_order: 10 },
          { code: "hibarigaoka_seibu", name: "ひばりヶ丘", name_kana: "ひばりがおか", display_order: 11 },
          { code: "tokorozawa_seibu", name: "所沢", name_kana: "ところざわ", display_order: 12 },
        ]
      },
      {
        code: "seibu_shinjuku", name: "西武新宿線", color: "#003399", display_order: 2,
        stations: [
          { code: "seibu_shinjuku_station", name: "西武新宿", name_kana: "せいぶしんじゅく", display_order: 1 },
          { code: "takadanobaba_seibu", name: "高田馬場", name_kana: "たかだのばば", display_order: 2 },
          { code: "shimo_ochiai_seibu", name: "下落合", name_kana: "しもおちあい", display_order: 3 },
          { code: "nakai_seibu", name: "中井", name_kana: "なかい", display_order: 4 },
          { code: "araiyakushi_mae_seibu", name: "新井薬師前", name_kana: "あらいやくしまえ", display_order: 5 },
          { code: "numabukuro_seibu", name: "沼袋", name_kana: "ぬまぶくろ", display_order: 6 },
          { code: "nogata_seibu", name: "野方", name_kana: "のがた", display_order: 7 },
          { code: "tsurukawa_seibu", name: "鷺ノ宮", name_kana: "さぎのみや", display_order: 8 },
          { code: "kami_shakujii_seibu", name: "上石神井", name_kana: "かみしゃくじい", display_order: 9 },
          { code: "tanashi_seibu", name: "田無", name_kana: "たなし", display_order: 10 },
        ]
      },
    ]
  },
  # === 東武 ===
  {
    company: "東武鉄道", company_code: "tobu",
    lines: [
      {
        code: "tobu_tojo", name: "東武東上線", color: "#003399", display_order: 1,
        stations: [
          { code: "ikebukuro_tobu_tojo", name: "池袋", name_kana: "いけぶくろ", display_order: 1 },
          { code: "kita_ikebukuro_tobu_tojo", name: "北池袋", name_kana: "きたいけぶくろ", display_order: 2 },
          { code: "shimo_itabashi_tobu_tojo", name: "下板橋", name_kana: "しもいたばし", display_order: 3 },
          { code: "oyama_tobu_tojo", name: "大山", name_kana: "おおやま", display_order: 4 },
          { code: "nakaboard_tobu_tojo", name: "中板橋", name_kana: "なかいたばし", display_order: 5 },
          { code: "tokiwadai_tobu_tojo", name: "ときわ台", name_kana: "ときわだい", display_order: 6 },
          { code: "kamiitabashi_tobu_tojo", name: "上板橋", name_kana: "かみいたばし", display_order: 7 },
          { code: "tobu_nerima_tobu_tojo", name: "東武練馬", name_kana: "とうぶねりま", display_order: 8 },
          { code: "narimasu_tobu_tojo", name: "成増", name_kana: "なります", display_order: 9 },
          { code: "wakoshi_tobu_tojo", name: "和光市", name_kana: "わこうし", display_order: 10 },
          { code: "shiki_tobu_tojo", name: "志木", name_kana: "しき", display_order: 11 },
          { code: "kawagoe_tobu_tojo", name: "川越", name_kana: "かわごえ", display_order: 12 },
        ]
      },
      {
        code: "tobu_skytree", name: "東武スカイツリーライン", color: "#ee7800", display_order: 2,
        stations: [
          { code: "asakusa_tobu_skytree", name: "浅草", name_kana: "あさくさ", display_order: 1 },
          { code: "oshiage_tobu_skytree", name: "とうきょうスカイツリー", name_kana: "とうきょうすかいつりー", display_order: 2 },
          { code: "hikifune_tobu_skytree", name: "曳舟", name_kana: "ひきふね", display_order: 3 },
          { code: "kitasenju_tobu_skytree", name: "北千住", name_kana: "きたせんじゅ", display_order: 4 },
          { code: "takenotsuka_tobu_skytree", name: "竹ノ塚", name_kana: "たけのつか", display_order: 5 },
          { code: "soka_tobu_skytree", name: "草加", name_kana: "そうか", display_order: 6 },
          { code: "shin_koshigaya_tobu_skytree", name: "新越谷", name_kana: "しんこしがや", display_order: 7 },
          { code: "kasukabe_tobu_skytree", name: "春日部", name_kana: "かすかべ", display_order: 8 },
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

puts "✓ 沿線マスタ作成完了: #{line_count}路線"
puts "✓ 駅マスタ作成完了: #{station_count}駅"
