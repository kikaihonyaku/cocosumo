import Icons from "../../components/landing/LandingIcons";

const featureData = {
  "auto-inquiry-import": {
    slug: "auto-inquiry-import",
    title: "反響自動取込",
    tagline: "対応漏れゼロへ。反響メールを自動で顧客登録",
    description: "SUUMOなどポータルサイトからの反響メールを自動でパースし、顧客の名前・連絡先・問い合わせ内容を自動登録。手入力の手間を省き、対応漏れを防ぎます。",
    icon: Icons.Mail,
    gradient: "from-[#1e3a5f] to-[#2d5a8a]",
    screenshot: "/screenshots/carousel-01-inquiry.png",
    problems: [
      "反響メールを見落として対応が遅れてしまう",
      "手動で顧客情報を入力するのが面倒で時間がかかる",
      "どのポータルから来た反響か管理できていない",
    ],
    solutions: [
      "メール受信と同時に自動で顧客情報を登録",
      "名前・電話番号・メールアドレスをAIが自動抽出",
      "反響元ポータルを自動判別し、流入経路を可視化",
    ],
    benefits: [
      { icon: Icons.Mail, title: "自動メールパース", description: "SUUMOなど主要ポータルサイトのメールフォーマットに対応し、自動で情報を抽出します" },
      { icon: Icons.Users, title: "即時顧客登録", description: "パースした情報から顧客レコードを自動作成。対応開始までのタイムラグをゼロに" },
      { icon: Icons.Chart, title: "流入経路分析", description: "どのポータルからの反響が多いか一目で把握。広告投資の最適化に活用できます" },
      { icon: Icons.Settings, title: "カスタマイズ対応", description: "メールフォーマットの追加やパースルールのカスタマイズも柔軟に対応" },
    ],
    highlights: [
      {
        label: "自動パース",
        title: "メールを受信するだけで顧客登録完了",
        description: "反響メールを転送設定するだけで、AIが自動的にメール本文を解析。顧客名、電話番号、メールアドレス、問い合わせ物件情報を抽出し、顧客レコードとして登録します。",
        screenshot: "/screenshots/carousel-01-inquiry.png",
      },
      {
        label: "一覧管理",
        title: "反響状況をリアルタイムで把握",
        description: "新着反響はダッシュボードに即座に反映。未対応・対応中・完了のステータス管理で、チーム全体の対応状況を可視化します。",
        screenshot: "/screenshots/carousel-02-customer.png",
      },
    ],
    workflow: [
      { step: 1, title: "メール転送設定", description: "ポータルサイトの反響通知メールをCoCoスモに転送設定" },
      { step: 2, title: "自動パース・登録", description: "AIが自動でメールを解析し、顧客情報を登録" },
      { step: 3, title: "対応開始", description: "ダッシュボードで新着反響を確認し、すぐに対応を開始" },
    ],
    relatedSlugs: ["customer-management", "analytics", "suumo-integration"],
  },

  "customer-management": {
    slug: "customer-management",
    title: "顧客・案件管理",
    tagline: "反響から成約まで、すべてを一元管理",
    description: "顧客ごとの対応履歴を一元管理し、商談ステータスの追跡、メール送信、チャット風の対応履歴表示で、チーム全体の営業状況を可視化します。",
    icon: Icons.Users,
    gradient: "from-[#2d5a8a] to-[#3b7abf]",
    screenshot: "/screenshots/carousel-02-customer.png",
    problems: [
      "顧客の対応履歴がバラバラで確認に時間がかかる",
      "商談の進捗状況がチーム内で共有できていない",
      "担当者の引き継ぎ時に情報が抜け落ちる",
    ],
    solutions: [
      "全ての対応履歴をチャット形式で時系列表示",
      "商談パイプラインで進捗をカンバン管理",
      "顧客情報・対応メモを一画面に集約",
    ],
    benefits: [
      { icon: Icons.Users, title: "顧客情報一元管理", description: "連絡先、対応履歴、商談メモをひとつの画面に集約。情報を探す時間がゼロに" },
      { icon: Icons.Mail, title: "メール送信連携", description: "顧客画面から直接メールを送信。送信履歴も自動で記録されます" },
      { icon: Icons.Chart, title: "商談ステータス管理", description: "反響→内見→申込→成約のパイプラインで、全案件の進捗を一目で把握" },
      { icon: Icons.Settings, title: "チーム情報共有", description: "担当者間での引き継ぎもスムーズ。対応漏れや二重対応を防止します" },
    ],
    highlights: [
      {
        label: "対応履歴",
        title: "チャット形式で対応経緯を把握",
        description: "メール送受信、電話メモ、対応記録をチャット形式のタイムラインで表示。担当者が変わっても、過去の経緯が一目でわかります。",
        screenshot: "/screenshots/carousel-02-customer.png",
      },
      {
        label: "パイプライン",
        title: "商談の進捗をビジュアルに管理",
        description: "反響から成約まで、各フェーズの案件数を可視化。ボトルネックの特定や、対応の優先順位付けに活用できます。",
        screenshot: "/screenshots/01-home.png",
      },
    ],
    workflow: [
      { step: 1, title: "反響受付", description: "自動取込または手動で顧客情報を登録" },
      { step: 2, title: "対応記録", description: "メール・電話・面談の記録をタイムラインに追加" },
      { step: 3, title: "商談管理", description: "パイプラインでステータスを更新し、チームで共有" },
      { step: 4, title: "成約", description: "成約データを蓄積し、分析に活用" },
    ],
    relatedSlugs: ["auto-inquiry-import", "customer-mypage", "analytics"],
  },

  "customer-mypage": {
    slug: "customer-mypage",
    title: "顧客マイページ",
    tagline: "お客様専用の物件紹介ページを発行",
    description: "VRツアーやバーチャルステージングを組み込んだ顧客専用ページを発行。閲覧状況のトラッキングで、お客様の関心度を把握できます。",
    icon: Icons.Link,
    gradient: "from-[#1e3a5f] to-[#0f2640]",
    screenshot: "/screenshots/carousel-03-customer-page.png",
    problems: [
      "物件資料をメールで送っても見てもらえない",
      "お客様がどの物件に興味を持っているか分からない",
      "複数物件の比較提案が手間がかかる",
    ],
    solutions: [
      "専用URLでいつでもアクセスできるマイページを発行",
      "閲覧状況をリアルタイムでトラッキング",
      "VR・ステージング・物件情報をまとめて掲載",
    ],
    benefits: [
      { icon: Icons.Link, title: "専用ページ発行", description: "お客様ごとにカスタマイズした専用ページを発行。URLを送るだけで物件提案が完了" },
      { icon: Icons.Chart, title: "閲覧トラッキング", description: "どの物件をいつ・何回見たかをリアルタイムに追跡。お客様の関心度を数値で把握" },
      { icon: Icons.VR, title: "VR・ステージング連携", description: "VRツアーやバーチャルステージングをマイページに組み込み、リッチな物件体験を提供" },
      { icon: Icons.AI, title: "パスワード保護", description: "マイページにパスワードを設定し、お客様だけがアクセスできるセキュアな環境を提供" },
    ],
    highlights: [
      {
        label: "マイページ",
        title: "物件情報をまとめて見やすく提供",
        description: "物件写真、間取り図、周辺情報、VRツアーをひとつのページに集約。お客様はスマホからいつでも確認できます。",
        screenshot: "/screenshots/carousel-03-customer-page.png",
      },
      {
        label: "アクセス分析",
        title: "お客様の関心度を数値で把握",
        description: "ページ閲覧回数、滞在時間、VRツアーの視聴率など、詳細なアクセスデータを提供。追客のタイミングを逃しません。",
        screenshot: "/screenshots/01-home.png",
      },
    ],
    workflow: [
      { step: 1, title: "物件選定", description: "お客様に提案する物件を選択" },
      { step: 2, title: "マイページ発行", description: "専用ページを生成し、URLをお客様に送付" },
      { step: 3, title: "閲覧分析", description: "アクセス状況を確認し、最適なタイミングでフォローアップ" },
    ],
    relatedSlugs: ["vr-tours", "customer-management", "sales-presentation"],
  },

  "vr-tours": {
    slug: "vr-tours",
    title: "VRツアー＆バーチャルステージング",
    tagline: "空室でも、家具付きの暮らしをイメージ",
    description: "360度パノラマのVRルームツアーと、AIによるバーチャルステージングで、遠隔地のお客様にもリアルな物件体験を提供します。",
    icon: Icons.VR,
    gradient: "from-[#8b6914] to-[#c9a227]",
    screenshot: "/screenshots/carousel-04-vr-staging.png",
    problems: [
      "遠方のお客様に物件の雰囲気を伝えきれない",
      "空室の写真だけでは入居後のイメージが湧かない",
      "内見の日程調整に時間がかかる",
    ],
    solutions: [
      "360度VRツアーでオンライン内見を実現",
      "AIが自動で家具を配置したステージング画像を生成",
      "24時間いつでもアクセス可能なVR体験",
    ],
    benefits: [
      { icon: Icons.VR, title: "360° VRツアー", description: "複数のシーンを繋いだインタラクティブなVRツアー。実際に部屋を歩き回る感覚を提供" },
      { icon: Icons.AI, title: "AIバーチャルステージング", description: "空室写真にAIが家具・インテリアを自動配置。生活イメージを効果的に訴求" },
      { icon: Icons.Link, title: "公開URL発行", description: "VRツアー・ステージングそれぞれに公開URLを発行。SNSやメールで簡単にシェア" },
      { icon: Icons.Building, title: "埋め込み対応", description: "iframe埋め込みでポータルサイトやブログにも掲載可能" },
    ],
    highlights: [
      {
        label: "VRツアー",
        title: "複数シーンを繋いだ没入型体験",
        description: "リビング、キッチン、ベッドルームなど各部屋のパノラマ写真をホットスポットで接続。まるで実際に歩き回るような体験を提供します。",
        screenshot: "/screenshots/carousel-04-vr-staging.png",
      },
      {
        label: "ステージング",
        title: "AIが空室を理想の住空間に変換",
        description: "Google Gemini AIを活用し、空室写真に家具やインテリアを自然に配置。複数のスタイル提案で、様々な暮らし方をイメージさせます。",
        screenshot: "/screenshots/carousel-05-ai-content.png",
      },
    ],
    workflow: [
      { step: 1, title: "写真撮影", description: "360度カメラまたはスマートフォンで物件を撮影" },
      { step: 2, title: "VRツアー作成", description: "パノラマ写真をアップロードし、シーンを接続" },
      { step: 3, title: "ステージング生成", description: "AIで家具を配置し、生活イメージを演出" },
      { step: 4, title: "公開・共有", description: "URLを発行し、お客様やポータルに共有" },
    ],
    relatedSlugs: ["ai-content", "customer-mypage", "sales-presentation"],
  },

  "ai-content": {
    slug: "ai-content",
    title: "AI画像編集＆コンテンツ作成",
    tagline: "魅力的な物件コンテンツをワンストップで",
    description: "物件写真のAI編集、複数テンプレートの公開ページ作成、QRコード生成まで。魅力的な物件コンテンツをワンストップで制作できます。",
    icon: Icons.AI,
    gradient: "from-[#2d5a8a] to-[#1e3a5f]",
    screenshot: "/screenshots/carousel-05-ai-content.png",
    problems: [
      "物件写真の加工に時間がかかる",
      "テンプレートごとに別々のツールを使っている",
      "印刷用とWeb用で素材を作り分けるのが手間",
    ],
    solutions: [
      "AIによるワンクリック画像編集・補正",
      "複数テンプレートで公開ページを簡単作成",
      "QRコード生成でオフラインからの誘導も",
    ],
    benefits: [
      { icon: Icons.AI, title: "AI画像編集", description: "明るさ補正、不要物除去、空の差し替えなど、AIが物件写真を自動で最適化" },
      { icon: Icons.Building, title: "テンプレート公開ページ", description: "複数のデザインテンプレートから選んで、魅力的な物件紹介ページを作成" },
      { icon: Icons.Link, title: "QRコード生成", description: "公開ページへのQRコードを自動生成。チラシや店頭POPからの誘導に活用" },
      { icon: Icons.Settings, title: "一括操作", description: "複数写真の一括編集やテンプレートの一括適用で、作業時間を大幅削減" },
    ],
    highlights: [
      {
        label: "AI編集",
        title: "ワンクリックで物件写真をプロ品質に",
        description: "暗い室内写真の明るさ補正、電線の除去、曇り空の青空差し替えなど、AIが自動で写真を最適化。撮り直しの手間を大幅に削減します。",
        screenshot: "/screenshots/carousel-05-ai-content.png",
      },
      {
        label: "テンプレート",
        title: "デザイン知識不要の公開ページ作成",
        description: "物件情報を入力するだけで、プロがデザインしたような公開ページが完成。テンプレートを選んで、写真と情報を配置するだけです。",
        screenshot: "/screenshots/05-room-detail.png",
      },
    ],
    workflow: [
      { step: 1, title: "写真アップロード", description: "物件写真をシステムにアップロード" },
      { step: 2, title: "AI編集", description: "ワンクリックで明るさ・色合い・不要物を自動補正" },
      { step: 3, title: "ページ作成", description: "テンプレートを選んで公開ページを作成" },
      { step: 4, title: "公開・配布", description: "URLやQRコードで公開・チラシに印刷" },
    ],
    relatedSlugs: ["vr-tours", "customer-mypage", "bulk-import"],
  },

  "gis-map": {
    slug: "gis-map",
    title: "GISマップ物件管理",
    tagline: "地図の上で、物件のすべてを管理",
    description: "Googleマップ連携のGISシステムで物件を地図上に一元管理。学区・駅・公園などのレイヤー表示や、エリア検索で物件探しを効率化します。",
    icon: Icons.Map,
    gradient: "from-[#0f2640] to-[#1e3a5f]",
    screenshot: "/screenshots/carousel-06-gis-map.png",
    problems: [
      "物件の位置関係が表や一覧だけでは把握しづらい",
      "学区や最寄り駅の情報を別途調べる手間がある",
      "お客様に周辺環境を伝えるのが難しい",
    ],
    solutions: [
      "全物件を地図上にプロットし、直感的に管理",
      "学区・駅・公園などの情報をレイヤーで重ねて表示",
      "ルート検索やストリートビューで周辺環境を可視化",
    ],
    benefits: [
      { icon: Icons.Map, title: "地図上の物件管理", description: "物件をGoogleマップ上にプロット。地図を見ながら物件の位置関係を直感的に把握" },
      { icon: Icons.Building, title: "レイヤー表示", description: "学区、鉄道路線、公園、商業施設などの情報をレイヤーで重ねて表示" },
      { icon: Icons.Settings, title: "エリア検索", description: "地図上でエリアを指定して物件を絞り込み。お客様の希望エリアに合った物件を即座に提案" },
      { icon: Icons.Chart, title: "ルート・距離計算", description: "物件から駅や学校までのルートと所要時間を自動計算。通勤・通学の利便性を数値で伝達" },
    ],
    highlights: [
      {
        label: "マップビュー",
        title: "全物件を一目で把握できるGISマップ",
        description: "空室・満室の状態を色分け表示し、エリアごとの物件分布を直感的に把握。クリックで詳細情報にアクセスできます。",
        screenshot: "/screenshots/carousel-06-gis-map.png",
      },
      {
        label: "レイヤー",
        title: "周辺情報をレイヤーで可視化",
        description: "学区境界線、鉄道路線、バス路線、公園、商業施設など、様々な情報をレイヤーとして地図に重ねて表示。物件の立地価値を客観的に伝えます。",
        screenshot: "/screenshots/02-map.png",
      },
    ],
    workflow: [
      { step: 1, title: "物件登録", description: "住所を入力すると自動でジオコーディング" },
      { step: 2, title: "レイヤー設定", description: "学区・駅・公園など表示したい情報レイヤーを選択" },
      { step: 3, title: "エリア検索", description: "地図上で範囲を指定して物件を検索" },
    ],
    relatedSlugs: ["ai-location-qa", "customer-mypage", "analytics"],
  },

  "sales-presentation": {
    slug: "sales-presentation",
    title: "営業プレゼンテーション",
    tagline: "ステップ形式の営業提案で成約率アップ",
    description: "顧客ごとにカスタマイズしたステップ形式の営業プレゼンテーションを作成。物件の魅力を段階的に伝え、効果的な営業活動をサポートします。",
    icon: Icons.Presentation,
    gradient: "from-[#1e3a5f] to-[#8b6914]",
    screenshot: null,
    problems: [
      "紙の資料では物件の魅力が伝わりきらない",
      "提案内容が営業担当者によってバラバラ",
      "お客様に合わせた提案資料の作成に時間がかかる",
    ],
    solutions: [
      "ステップ形式で物件の魅力を段階的に訴求",
      "テンプレートで提案品質を統一",
      "VRやステージング素材を組み込んだリッチな提案",
    ],
    benefits: [
      { icon: Icons.Presentation, title: "ステップ形式プレゼン", description: "物件概要→周辺環境→室内→設備の順で段階的に紹介。営業トークの流れに合わせた構成" },
      { icon: Icons.VR, title: "リッチコンテンツ", description: "VRツアー、バーチャルステージング、ストリートビューを組み込んだ没入型プレゼン" },
      { icon: Icons.Link, title: "URL共有", description: "作成したプレゼンテーションはURLで共有可能。お客様が後から何度でも確認できる" },
      { icon: Icons.Chart, title: "閲覧分析", description: "プレゼンテーションの閲覧状況を追跡。どのステップで関心を持ったかを把握" },
    ],
    highlights: [
      {
        label: "プレゼン",
        title: "ストーリー仕立ての物件提案",
        description: "物件の外観から始まり、周辺環境、室内の様子、設備詳細とステップを踏んで紹介。お客様の理解と期待を段階的に高めていきます。",
        screenshot: null,
      },
      {
        label: "カスタマイズ",
        title: "お客様ごとに最適化した提案",
        description: "ファミリー向け、単身者向け、投資家向けなど、ターゲットに合わせてコンテンツの順序や強調ポイントをカスタマイズできます。",
        screenshot: null,
      },
    ],
    workflow: [
      { step: 1, title: "物件選択", description: "提案する物件を選択し、使用する素材を確認" },
      { step: 2, title: "プレゼン作成", description: "テンプレートを選んでステップ構成をカスタマイズ" },
      { step: 3, title: "共有", description: "URLを発行してお客様に送付、または対面で表示" },
    ],
    relatedSlugs: ["customer-mypage", "vr-tours", "ai-content"],
  },

  "bulk-import": {
    slug: "bulk-import",
    title: "間取り図AI解析・一括取込",
    tagline: "PDF間取り図をAIが自動で物件データに変換",
    description: "PDF間取り図をAIが解析し、間取り情報を自動抽出。物件情報の一括登録で、データ入力の手間を大幅に削減します。",
    icon: Icons.Upload,
    gradient: "from-[#2d5a8a] to-[#0f2640]",
    screenshot: null,
    problems: [
      "物件データの手入力に膨大な時間がかかる",
      "間取り図から情報を読み取って入力するのが面倒",
      "大量の物件を一度に登録する手段がない",
    ],
    solutions: [
      "PDF間取り図をAIが自動で解析・情報抽出",
      "CSVやExcelからの一括インポートに対応",
      "画像ファイルも一括でアップロード・紐付け",
    ],
    benefits: [
      { icon: Icons.Upload, title: "AI間取り解析", description: "PDFの間取り図をAIが読み取り、部屋数・面積・設備情報を自動抽出" },
      { icon: Icons.Building, title: "一括登録", description: "CSVファイルやExcelから物件データを一括インポート。数百件の登録も数分で完了" },
      { icon: Icons.AI, title: "画像一括アップロード", description: "物件写真をドラッグ＆ドロップで一括アップロード。自動で物件に紐付け" },
      { icon: Icons.Settings, title: "データ検証", description: "インポート時に自動でデータの整合性をチェック。エラーがある行を事前に通知" },
    ],
    highlights: [
      {
        label: "AI解析",
        title: "間取り図PDFをアップロードするだけ",
        description: "管理会社から受け取った間取り図PDFをアップロードすると、AIが自動で解析。部屋のタイプ、面積、設備情報を抽出し、物件データとして登録します。",
        screenshot: null,
      },
      {
        label: "一括インポート",
        title: "大量の物件データを一度に登録",
        description: "CSVテンプレートに沿って物件データを入力し、一括アップロード。データの検証・エラーチェックも自動で行い、登録ミスを防ぎます。",
        screenshot: null,
      },
    ],
    workflow: [
      { step: 1, title: "ファイル準備", description: "間取り図PDFまたはCSVファイルを用意" },
      { step: 2, title: "アップロード", description: "ファイルをドラッグ＆ドロップでアップロード" },
      { step: 3, title: "確認・修正", description: "AIが抽出した情報を確認し、必要に応じて修正" },
      { step: 4, title: "一括登録", description: "確認後、ワンクリックで一括登録を実行" },
    ],
    relatedSlugs: ["suumo-integration", "auto-inquiry-import", "gis-map"],
  },

  "suumo-integration": {
    slug: "suumo-integration",
    title: "SUUMO連携インポート",
    tagline: "SUUMOの物件データをそのまま取り込み",
    description: "SUUMOに掲載中の物件データを自動で取り込み、CoCoスモに反映。二重入力の手間を解消し、データの一元管理を実現します。",
    icon: Icons.Integration,
    gradient: "from-[#0f2640] to-[#2d5a8a]",
    screenshot: null,
    problems: [
      "SUUMOとシステムで同じ物件情報を二重入力している",
      "ポータルサイトの情報と自社データが不一致になる",
      "物件情報の更新を複数箇所で行うのが手間",
    ],
    solutions: [
      "SUUMOの掲載データを自動でインポート",
      "物件情報の同期で二重入力を完全解消",
      "差分の自動検知で情報の不一致を防止",
    ],
    benefits: [
      { icon: Icons.Integration, title: "自動データ取込", description: "SUUMOの物件掲載データをAPI連携で自動取り込み。手入力ゼロで物件登録が完了" },
      { icon: Icons.Building, title: "物件情報同期", description: "SUUMOでの情報更新を自動検知し、CoCoスモ側のデータも同期" },
      { icon: Icons.Chart, title: "掲載状況管理", description: "どの物件がSUUMOに掲載中か、掲載状況を一覧で管理" },
      { icon: Icons.Settings, title: "マッピング設定", description: "SUUMOの項目とCoCoスモの項目の対応関係を柔軟にカスタマイズ" },
    ],
    highlights: [
      {
        label: "データ連携",
        title: "SUUMOの掲載データを自動で同期",
        description: "SUUMOに掲載中の物件情報（物件名、住所、間取り、賃料、写真など）を自動で取り込み。掲載情報の変更も差分検知で自動反映します。",
        screenshot: null,
      },
      {
        label: "一元管理",
        title: "ポータルと自社データの一元化",
        description: "SUUMOの掲載データとCoCoスモの管理データを統合。どちらからでも最新情報にアクセスでき、情報の食い違いを防ぎます。",
        screenshot: null,
      },
    ],
    workflow: [
      { step: 1, title: "連携設定", description: "SUUMO連携のアカウント設定を行う" },
      { step: 2, title: "初回インポート", description: "既存の掲載物件を一括でインポート" },
      { step: 3, title: "自動同期", description: "以降は差分を自動検知し、データを同期" },
    ],
    relatedSlugs: ["auto-inquiry-import", "bulk-import", "analytics"],
  },

  "analytics": {
    slug: "analytics",
    title: "アナリティクス・レポート",
    tagline: "データに基づく営業判断を支援",
    description: "反響数、閲覧分析、商談パイプライン、トレンド分析など、営業活動のあらゆるデータを可視化。データドリブンな意思決定をサポートします。",
    icon: Icons.Chart,
    gradient: "from-[#1e3a5f] to-[#2d5a8a]",
    screenshot: null,
    problems: [
      "営業成績の分析がExcel頼みで手間がかかる",
      "反響のトレンドを把握できていない",
      "広告の費用対効果が見えない",
    ],
    solutions: [
      "リアルタイムダッシュボードで営業状況を可視化",
      "反響トレンド・閲覧データを自動グラフ化",
      "流入経路別のコンバージョン分析",
    ],
    benefits: [
      { icon: Icons.Chart, title: "リアルタイムダッシュボード", description: "反響数、対応率、成約率をリアルタイムに表示。直感的なグラフで営業状況を瞬時に把握" },
      { icon: Icons.Users, title: "パイプライン分析", description: "商談フェーズごとの案件数と転換率を分析。ボトルネックの特定と改善に活用" },
      { icon: Icons.Mail, title: "反響トレンド", description: "曜日別・時間帯別・ポータル別の反響数推移を可視化。最適な広告配分を判断" },
      { icon: Icons.Map, title: "エリア分析", description: "エリアごとの反響・成約データを地図上に可視化。注力エリアの判断に活用" },
    ],
    highlights: [
      {
        label: "ダッシュボード",
        title: "営業KPIをリアルタイムに追跡",
        description: "反響数、対応率、内見数、成約率などのKPIをダッシュボードに集約。日次・週次・月次のトレンドもグラフで表示し、営業目標の達成状況を一目で把握できます。",
        screenshot: null,
      },
      {
        label: "レポート",
        title: "定期レポートを自動生成",
        description: "週次・月次の営業レポートを自動生成。反響数の推移、物件ごとの閲覧数ランキング、担当者別の成績比較など、会議に必要なデータが揃います。",
        screenshot: null,
      },
    ],
    workflow: [
      { step: 1, title: "データ蓄積", description: "日々の営業活動データが自動的に蓄積" },
      { step: 2, title: "ダッシュボード確認", description: "リアルタイムダッシュボードでKPIをチェック" },
      { step: 3, title: "レポート分析", description: "詳細レポートでトレンドやボトルネックを分析" },
    ],
    relatedSlugs: ["auto-inquiry-import", "customer-management", "gis-map"],
  },

  "ai-location-qa": {
    slug: "ai-location-qa",
    title: "AIロケーションQ&A",
    tagline: "AI×Googleマップで周辺情報を即座に回答",
    description: "お客様からの「近くにスーパーはありますか？」「学校まで何分ですか？」といった質問に、AIがGoogleマップの情報を活用して即座に回答します。",
    icon: Icons.ChatAI,
    gradient: "from-[#2d5a8a] to-[#8b6914]",
    screenshot: null,
    problems: [
      "お客様からの周辺情報の質問に即座に答えられない",
      "物件ごとの周辺施設を調べるのに時間がかかる",
      "正確な距離や所要時間を把握できていない",
    ],
    solutions: [
      "AIが自然言語の質問を理解し、周辺情報を即座に回答",
      "Googleマップのデータを活用した正確な施設情報",
      "距離・所要時間を自動計算し、地図上に表示",
    ],
    benefits: [
      { icon: Icons.ChatAI, title: "自然言語Q&A", description: "「近くの小学校は？」「スーパーまで何分？」などの質問にAIが即座に回答" },
      { icon: Icons.Map, title: "地図連携", description: "回答内容をGoogleマップ上に表示。距離感や位置関係を直感的に把握" },
      { icon: Icons.Chart, title: "施設一覧生成", description: "物件周辺の学校、病院、スーパーなどの施設一覧を自動生成" },
      { icon: Icons.Users, title: "顧客対応支援", description: "お客様との対話中にリアルタイムで周辺情報を検索。対応品質の向上に" },
    ],
    highlights: [
      {
        label: "AI Q&A",
        title: "チャットで周辺情報を瞬時に取得",
        description: "物件を選択した状態でチャットに質問を入力するだけ。AIがGoogleマップのPOI（Point of Interest）データを検索し、最寄りの施設情報と距離・所要時間を回答します。",
        screenshot: null,
      },
      {
        label: "マップ表示",
        title: "検索結果を地図上にビジュアル化",
        description: "AIの回答に含まれる施設を地図上にピン表示。物件からのルートも表示され、お客様に周辺環境を視覚的に説明できます。",
        screenshot: null,
      },
    ],
    workflow: [
      { step: 1, title: "物件選択", description: "周辺情報を調べたい物件を選択" },
      { step: 2, title: "質問入力", description: "知りたい周辺情報をチャットに入力" },
      { step: 3, title: "AI回答確認", description: "AIの回答と地図表示を確認し、お客様に共有" },
    ],
    relatedSlugs: ["gis-map", "customer-mypage", "sales-presentation"],
  },
};

// Get all feature slugs in display order
export const featureSlugs = [
  "auto-inquiry-import",
  "customer-management",
  "customer-mypage",
  "vr-tours",
  "ai-content",
  "gis-map",
  "sales-presentation",
  "bulk-import",
  "suumo-integration",
  "analytics",
  "ai-location-qa",
];

export default featureData;
