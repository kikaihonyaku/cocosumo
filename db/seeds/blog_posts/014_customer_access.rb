# 記事14: 顧客限定ページ機能（年末特別記事）
blog_post_14 = BlogPost.find_or_create_by!(public_id: 'customer-access-2025') do |post|
  post.title = "お客様専用ページで物件提案を次のステージへ — 2025年を締めくくる新機能"
  post.summary = "特定のお客様だけがアクセスできる物件紹介ページを実現。AIチャットや自分だけの経路登録機能で、パーソナライズされた物件体験を提供できます。"
  post.content = <<~'MARKDOWN'
## 2025年、最後の開発日記

2025年も残すところあとわずかとなりました。

今年一年、CoCoスモは多くの機能を追加してきました。VRルームツアー、バーチャルステージング、経路スライドショー、AIチャット——不動産業務をデジタルで支援する機能が次々と生まれました。

そして年末のこの日、私たちは**「顧客限定ページ」**という新機能をリリースしました。

これは単なる機能追加ではありません。「物件を紹介する」から「**お客様一人ひとりに寄り添った体験を提供する**」へ——CoCoスモの思想を体現する、2025年の集大成ともいえる機能です。

## 「あのお客様専用の物件ページ」が欲しい

不動産営業の現場で、こんな経験はありませんか？

> 「○○様には、この物件を特別にご紹介したい」
> 「他のお客様には見せず、この方だけにじっくり検討していただきたい」
> 「お客様の通勤先からの経路も一緒に見せたい」

従来の物件公開ページでは、URLを知っている人なら誰でもアクセスできました。パスワード保護はありましたが、**「この人専用」という特別感**を演出するには限界がありました。

顧客限定ページは、まさにこの課題を解決します。

## 顧客限定ページとは

**お客様一人ひとりに専用のアクセス権を発行**し、そのお客様だけがアクセスできる物件ページを提供する機能です。

### 従来の物件公開ページとの違い

| | 物件公開ページ | 顧客限定ページ |
|---|---|---|
| アクセス制御 | URL共有 or パスワード | お客様ごとに専用リンク発行 |
| 有効期限 | ページ単位で設定 | お客様ごとに個別設定 |
| 閲覧履歴 | ページ全体の統計 | **お客様ごとに追跡** |
| 経路表示 | 事前登録の経路のみ | **お客様が自分で追加可能** |
| パーソナライズ | 不可 | **申し送り事項で個別メッセージ** |

## 主要機能

### 1. 顧客アクセスの発行

物件公開ページの編集画面から、「顧客アクセスを発行」ボタンをクリック。

```ruby
# 顧客アクセスの発行
customer_access = CustomerAccess.create!(
  property_publication: publication,
  customer_name: "山田太郎様",
  customer_email: "yamada@example.com",
  expires_at: 7.days.from_now,
  customer_message: "ご希望の条件にぴったりの物件です！"
)

# ユニークなアクセストークンが自動生成
customer_access.access_token # => "abc123xyz..."
```

発行すると、お客様専用のURLが生成されます。このURLは**そのお客様だけのもの**です。

### 2. 申し送り事項

発行時に「お客様への申し送り事項」を設定できます。

> 「山田様、ご希望の条件にぴったりの物件が見つかりました。特に南向きのバルコニーは日当たり抜群です。ぜひVRツアーもご覧ください！」

お客様がページを開くと、ヘッダー直下にこのメッセージが表示されます。

**営業担当からの温かいメッセージ**が、物件との出会いを特別なものにします。

### 3. パスワード保護

必要に応じて、アクセスにパスワードを設定できます。

- 発行時にパスワードを設定（お客様にメールで通知）
- 発行後にパスワードを変更・解除も可能
- bcryptによる安全なハッシュ化

```ruby
# パスワード認証の実装
class CustomerAccess < ApplicationRecord
  has_secure_password validations: false

  def authenticate_password(input_password)
    return true if password_digest.blank?
    authenticate(input_password)
  end
end
```

### 4. 有効期限管理

お客様ごとに有効期限を設定できます。

- 「1週間限定でご検討ください」
- 「内見予約までの間、ぜひご覧ください」
- 期限切れ後は自動的にアクセス不可に

## AIチャットで周辺情報を探索

顧客限定ページには、**AIチャット機能**が統合されています。

### お客様自身で周辺情報を調べられる

```
お客様: 「近くに24時間営業のスーパーはありますか？」

AI: この物件の周辺には以下の24時間営業スーパーがあります：

1. **まいばすけっと 恵比寿駅前店** - 徒歩3分（約200m）
2. **西友 恵比寿店** - 徒歩8分（約550m）

まいばすけっとは駅から物件への通り道にあるので、
帰宅時のお買い物に便利です。
```

### Vertex AI Grounding with Google Maps

AIチャットは、Google CloudのVertex AIと**Grounding with Google Maps**を組み合わせて実現しています。

```ruby
class VertexAiGroundingService
  def query(prompt, building_address:)
    # 物件住所をコンテキストとして設定
    system_prompt = <<~PROMPT
      あなたは不動産の周辺情報アシスタントです。
      対象物件の住所: #{building_address}

      お客様の質問に対して、Google Mapsのデータを参照して
      周辺施設の情報を正確に回答してください。
    PROMPT

    # Grounding with Google Mapsで最新の施設情報を取得
    client.predict(
      endpoint: vertex_endpoint,
      instances: [{
        prompt: prompt,
        systemInstruction: system_prompt,
        groundingConfig: { googleMapsGrounding: {} }
      }]
    )
  end
end
```

お客様が気になる情報を、その場で調べられる。**物件検討の不安を解消**する強力なツールです。

## お客様自身で経路を追加

顧客限定ページの最大の特徴が、**お客様が自分で経路を追加できる**機能です。

### 「通勤先からの距離も知りたい」

不動産を検討するとき、「最寄り駅から物件まで」だけでなく、**「自分の通勤先・実家・よく行く場所」との位置関係**も気になるものです。

従来は、お客様から「○○駅からの経路も見たい」とリクエストを受け、営業担当が経路を追加登録していました。

顧客限定ページでは、**お客様自身が目的地を指定**して経路を追加できます。

### 経路追加の流れ

1. 「経路を追加」ボタンをクリック
2. 目的地を指定（住所入力 or 地図クリック）
3. 複数の経路候補から選択（徒歩・自転車・電車など）
4. ストリートビュースライドショーで経路を確認

```jsx
// 経路追加ダイアログ
const CustomerRouteDialog = ({ onAddRoute }) => {
  const [destination, setDestination] = useState(null);
  const [routes, setRoutes] = useState([]);

  // 住所から座標を取得（ジオコーディング）
  const handleAddressSearch = async (address) => {
    const result = await geocodeAddress(address);
    setDestination(result);
    calculateRoutes(result);
  };

  // 地図クリックで目的地を設定
  const handleMapClick = (latLng) => {
    setDestination(latLng);
    calculateRoutes(latLng);
  };

  // Google Directions APIで経路を計算
  const calculateRoutes = async (dest) => {
    const routeOptions = await directionsService.route({
      origin: propertyLocation,
      destination: dest,
      travelMode: ['WALKING', 'BICYCLING', 'TRANSIT'],
      provideRouteAlternatives: true
    });
    setRoutes(routeOptions);
  };

  return (
    <Dialog>
      {/* 住所入力 or 地図クリックで目的地を指定 */}
      {/* 複数の経路候補を表示 */}
      {/* 選択した経路を保存 */}
    </Dialog>
  );
};
```

### ストリートビューで経路を体感

追加した経路は、**ストリートビュースライドショー**で確認できます。

物件から目的地まで、実際にどんな道を通るのか——お客様自身が「住んだ後の生活」をイメージできます。

### 経路は最大4件まで

お客様が追加できる経路は最大4件。

- 通勤先（職場最寄り駅）
- 実家
- よく行くジム
- 子供の学校

など、お客様の生活スタイルに合わせた経路を登録できます。

## 顧客マイページ管理

### 一元管理画面

発行した顧客アクセスは、**顧客マイページ管理ページ**で一覧表示されます。

- ステータス（有効/期限切れ/手動無効化）
- 最終アクセス日時
- 閲覧回数
- 追加された経路数

```ruby
# 顧客アクセスの統計情報
class CustomerAccess < ApplicationRecord
  def status
    return 'disabled' if disabled_at.present?
    return 'expired' if expires_at.present? && expires_at < Time.current
    'active'
  end

  def access_count
    page_views.count
  end

  def last_accessed_at
    page_views.maximum(:created_at)
  end
end
```

### 顧客アクセス分析

物件横断で、顧客アクセスの分析データを確認できます。

- **総アクセス数・閲覧数の推移**
- **物件別閲覧数ランキング**
- **まもなく期限切れのアクセス一覧**
- **デバイス別アクセス分布**

どの物件が注目されているか、どのお客様が積極的に検討しているかが一目でわかります。

## 問い合わせ管理との連携

顧客限定ページからの問い合わせは、**問い合わせ管理機能**と連携しています。

### 問い合わせ元の識別

問い合わせ一覧で、「公開ページから」「顧客限定ページから」を区別して表示。

```ruby
class PropertyInquiry < ApplicationRecord
  enum source_type: {
    public_page: 'public_page',
    customer_access: 'customer_access'
  }
end
```

### ステータス管理と返信

- **未返信 / 返信済み / 返信不要**のステータス管理
- アプリ内からメールで返信
- 返信内容の履歴管理

お客様からの問い合わせに、迅速に対応できる体制を整えられます。

## 活用シーン

### VIPお客様への先行案内

人気物件を一般公開前にVIPお客様だけに案内。専用リンクで特別感を演出します。

### 内見後のフォローアップ

内見後、お客様専用ページを発行。「申し送り事項」で内見時のポイントを補足し、じっくり検討していただけます。

### 遠方のお客様への提案

対面で会えないお客様にも、パーソナライズされた物件体験を提供。AIチャットで質問に即座に回答できます。

### 通勤経路重視のお客様

「職場からの距離が重要」というお客様に、ご自身で経路を追加いただき、ストリートビューで確認してもらえます。

## 技術的なハイライト

### bcryptによるパスワードハッシュ化

```ruby
class CustomerAccess < ApplicationRecord
  has_secure_password validations: false
  # パスワードはbcryptでハッシュ化して保存
end
```

### アクセストークンの自動生成

```ruby
class CustomerAccess < ApplicationRecord
  before_create :generate_access_token

  private

  def generate_access_token
    self.access_token = SecureRandom.urlsafe_base64(32)
  end
end
```

### 認証エラー時の自動リダイレクト

顧客限定ページでも、401エラー（認証エラー）時は自動的にログインページにリダイレクトする仕組みを実装しています（管理画面側）。

## 2025年を振り返って

この一年、CoCoスモは「不動産業務のデジタル化」をテーマに、多くの機能を開発してきました。

- **VRルームツアー**: 360度パノラマで没入感のある内見体験
- **バーチャルステージング**: AIで空室を魅力的に演出
- **経路スライドショー**: 駅から物件までをストリートビューで紹介
- **AIチャット**: 周辺施設をAIが調べて回答
- **テスト基盤構築**: 品質と開発スピードの両立

そして今回の**顧客限定ページ**。

これらの機能は、それぞれが独立した価値を持っていますが、**組み合わせることで真価を発揮**します。

顧客限定ページには、VRツアーもバーチャルステージングも経路スライドショーもAIチャットも——今年開発したすべての機能が統合されています。

**「お客様一人ひとりに、最高の物件体験を」**

この思いを形にした機能を、2025年の締めくくりとしてお届けできることを嬉しく思います。

## 年末のご挨拶

2025年も、CoCoスモをご利用いただきありがとうございました。

来年も引き続き、不動産業務をより便利に、より効率的に、そしてより楽しくする機能を開発してまいります。

皆様にとって2026年が素晴らしい一年となりますよう、心よりお祈り申し上げます。

**良いお年をお迎えください。**

---

CoCoスモ開発チーム一同
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2025-12-31 18:00:00')
  post.commit_hash = '8c4280e'
end

puts "✓ 記事作成: #{blog_post_14.title}"
