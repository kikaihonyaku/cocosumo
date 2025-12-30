# ブログ記事のシードデータ

puts "ブログ記事を作成中..."

# 記事1: 経路スライドショー機能
blog_post_1 = BlogPost.find_or_create_by!(public_id: 'route-slideshow-2025') do |post|
  post.title = "「駅から物件まで」を疑似体験できる経路スライドショー機能を開発しました"
  post.summary = "最寄り駅から物件までの経路をストリートビューで紹介する機能を実装。お客様に物件周辺の雰囲気を伝えやすくなりました。"
  post.content = <<~'MARKDOWN'
## なぜこの機能を作ったのか

不動産の内見で、お客様からよく聞かれる質問があります。

> 「駅から物件まで、どんな道を歩くんですか？」

物件の間取りや設備はWebで確認できても、**実際に住んだときの通勤・通学路の雰囲気**はなかなか伝わりません。夜道は暗くないか、坂道はきつくないか、コンビニはあるか——こうした「生活動線」の情報は、物件選びの重要な判断材料です。

従来は営業担当が口頭で説明したり、Googleマップを見せたりしていましたが、もっと直感的に伝えられないかと考え、**経路スライドショー機能**を開発しました。

## どんな機能？

### 自動経路計算

Google Directions APIを使用して、指定した2点間の徒歩経路を自動計算します。

```javascript
// 経路計算の例
const response = await directionsService.getDirections({
  origin: { lat: 35.6762, lng: 139.6503 }, // 駅
  destination: { lat: 35.6789, lng: 139.6521 }, // 物件
  travelMode: 'WALKING'
});
```

### ストリートビューポイントの自動生成

経路に沿って**10m間隔**でストリートビューのポイントを自動取得します。さらに、**30度以上の方向変化**がある曲がり角では追加のポイントを生成し、道順がわかりやすくなっています。

```ruby
# 曲がり角検出のロジック
def significant_turn?(prev_heading, current_heading)
  angle_diff = (current_heading - prev_heading).abs
  angle_diff = 360 - angle_diff if angle_diff > 180
  angle_diff >= 30
end
```

### スライドショー再生

生成されたポイントをスライドショー形式で再生できます。

- **インラインモード**: 地図パネル内でコンパクトに再生
- **フルスクリーンモード**: 大画面でサムネイル一覧付き
- **再生速度調整**: 0.5x〜3xで調整可能
- **キーボード操作**: 矢印キーで前後移動

## 技術的なこだわり

### Haversine公式による距離計算

2点間の距離計算には、地球の曲率を考慮したHaversine公式を使用しています。

```javascript
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // 地球の半径（メートル）
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```

### 方位角の計算

各ポイントでストリートビューのカメラをどの方向に向けるか、進行方向の方位角を計算しています。

```javascript
function calculateHeading(from, to) {
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(to.lat));
  const x = Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) -
            Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(dLng);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}
```

## 実際の使われ方

### 遠方のお客様への事前案内

首都圏の物件を地方から検討されているお客様に、内見前に周辺環境をお伝えできます。

### 物件詳細ページへの埋め込み

作成したスライドショーは物件公開ページに埋め込み可能。お客様自身で経路を確認できます。

### 複数経路の比較

駅から物件まで複数のルートがある場合、それぞれを登録して比較検討の材料にできます。

## 今後の展望

- 自転車・バス経路への対応
- 経路上のPOI（コンビニ、スーパー等）の自動検出
- 夜間のストリートビュー対応（Googleの対応待ち）

「百聞は一見にしかず」——経路スライドショーで、物件周辺の雰囲気をもっと伝えやすくしていきます。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2025-12-21 21:00:00')
  post.commit_hash = '8174653'
end

puts "✓ 記事作成: #{blog_post_1.title}"

# 記事2: VRツアー機能
blog_post_2 = BlogPost.find_or_create_by!(public_id: 'vr-tour-features-2025') do |post|
  post.title = "VRツアー機能を大幅強化！8つの新機能をリリース"
  post.summary = "360度パノラマVRツアーに、オートプレイ、ジャイロスコープ対応、SNSシェアなど8つの新機能を追加しました。"
  post.content = <<~'MARKDOWN'
## VRツアーがさらに進化しました

不動産の内見をオンラインで完結させたい——そんなニーズに応えるため、CoCoスモではVRツアー機能を提供しています。今回、お客様からのフィードバックをもとに、**8つの新機能**を追加しました。

## 新機能一覧

### 1. オートプレイ機能

パノラマビューが自動で回転し、シーンも自動で切り替わります。展示会でのデモや、お客様への自動案内に最適です。

```jsx
// オートプレイの設定
const autoplayConfig = {
  rotationSpeed: 0.5,      // 回転速度
  sceneInterval: 10000,    // シーン切り替え間隔（ミリ秒）
  pauseOnInteraction: true // 操作時に一時停止
};
```

### 2. ジャイロスコープ対応

スマートフォンを傾けると、その方向にパノラマビューが動きます。まるでその場にいるような体験を提供します。

```javascript
// ジャイロスコープの処理
window.addEventListener('deviceorientation', (event) => {
  const alpha = event.alpha; // Z軸の回転（コンパス方向）
  const beta = event.beta;   // X軸の回転（前後の傾き）
  const gamma = event.gamma; // Y軸の回転（左右の傾き）

  viewer.setOrientation(alpha, beta, gamma);
});
```

### 3. 情報ホットスポット

従来のシーン移動ホットスポットに加え、**情報表示用のホットスポット**を追加。クリックすると詳細情報がパネルで表示されます。

- 設備の説明（エアコン、床暖房など）
- 画像の表示
- 外部リンク

### 4. SNSシェア・QRコード

公開したVRツアーをLINE、X（旧Twitter）、Facebookで簡単にシェアできます。QRコードも生成でき、チラシやパンフレットに印刷可能です。

### 5. シーン切り替えトランジション

シーン間の移動時にフェードアニメーションを追加。より自然な遷移を実現しました。

```jsx
const SceneTransition = ({ isTransitioning }) => (
  <div className={`
    absolute inset-0 bg-black pointer-events-none
    transition-opacity duration-500
    ${isTransitioning ? 'opacity-100' : 'opacity-0'}
  `} />
);
```

### 6. キーボード操作

- **矢印キー**: 上下左右にパノラマ移動
- **数字キー**: 対応するシーンに直接移動
- **スペースキー**: オートプレイの再生/停止

### 7. 埋め込みコード生成

作成したVRツアーを外部サイトに埋め込むためのiframeコードを生成できます。

```html
<iframe
  src="https://cocosumo.space/embed/vr/abc123xyz"
  width="100%"
  height="500"
  frameborder="0"
  allowfullscreen
></iframe>
```

### 8. ミニマップ改善

各シーンのサムネイルをビジュアルで選択できるようになりました。現在地もわかりやすく表示されます。

## 技術的な工夫

### パフォーマンス最適化

360度パノラマは画像サイズが大きくなりがちです。以下の工夫でパフォーマンスを確保しています。

- **プログレッシブローディング**: 低解像度→高解像度の段階読み込み
- **シーンのプリロード**: 次に遷移する可能性のあるシーンを事前読み込み
- **WebGL最適化**: Three.jsのジオメトリ再利用

### アクセシビリティ対応

- キーボードのみでの操作
- スクリーンリーダー対応のラベル
- 高コントラストモード

## 実際の活用シーン

### オンライン内見

遠方のお客様にVRツアーを送付し、事前に物件を確認していただけます。

### 物件サイトへの埋め込み

自社サイトにVRツアーを埋め込み、物件の魅力をアピールできます。

### 展示会でのデモ

オートプレイ機能で、スタッフが付きっきりでなくても物件紹介ができます。

## まとめ

VRツアーは単なる「360度写真の表示」から、**インタラクティブな物件体験ツール**へと進化しました。ぜひ新機能をお試しください。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2025-12-29 12:00:00')
  post.commit_hash = '1571562'
end

puts "✓ 記事作成: #{blog_post_2.title}"

# 記事3: バーチャルステージング
blog_post_3 = BlogPost.find_or_create_by!(public_id: 'virtual-staging-ai-2025') do |post|
  post.title = "AIで空室を魅力的に！バーチャルステージング機能を強化"
  post.summary = "Google Imagen AIを活用し、空室写真に家具を配置するバーチャルステージング機能を大幅強化しました。"
  post.content = <<~'MARKDOWN'
## 空室写真の課題

不動産の内見で、空室の写真を見せるとよく言われます。

> 「何もないと、広さのイメージが湧かない」

家具がないと空間の使い方がイメージしにくく、物件の魅力が伝わりにくいのです。かといって、実際の家具を入れるのはコストも時間もかかります。

そこで活躍するのが**バーチャルステージング**です。AIで写真に家具を配置し、「家具あり」のイメージを作成できます。

## 新機能: AI画像生成

### 5つのスタイルプリセット

お部屋の雰囲気に合わせて、5つのスタイルから選べます。

| スタイル | 特徴 |
|----------|------|
| モダン | シンプルでスタイリッシュな現代的デザイン |
| トラディショナル | 落ち着いた伝統的なインテリア |
| ナチュラル | 木目や自然素材を活かした温かみのあるデザイン |
| 空室クリーン | 生活感を消してクリーンな印象に |
| カスタム | 自由なプロンプトで指示 |

### 使い方

1. Before画像（空室写真）をアップロード
2. スタイルを選択
3. 「AI生成」ボタンをクリック
4. 数秒でAfter画像が生成される

```ruby
# AI生成のバックエンド処理
def generate_staging(before_image, style)
  prompt = build_prompt(style)

  client = Google::Cloud::AIPlatform::V1::PredictionService::Client.new
  response = client.predict(
    endpoint: imagen_endpoint,
    instances: [{ prompt: prompt, image: before_image }]
  )

  response.predictions.first
end
```

### カスタムプロンプト

「カスタム」スタイルを選ぶと、自由にプロンプトを指定できます。

例:
- 「北欧風のシンプルなリビングセット」
- 「書斎として使える机と本棚」
- 「ファミリー向けの明るいダイニングセット」

## Before/After比較機能

生成したAfter画像は、Before画像と**スライダーで比較**できます。

```jsx
<CompareSlider
  beforeImage={beforeUrl}
  afterImage={afterUrl}
  sliderPosition={50}
/>
```

スライダーを左右にドラッグすると、Before/Afterの境界が移動。直感的に変化を確認できます。

## 複数バリエーション対応

1つの部屋に対して、複数のスタイリングバリエーションを作成できます。

- モダンスタイル版
- ナチュラルスタイル版
- ファミリー向け版

お客様の好みに合わせて、最適なバリエーションを提案できます。

## アノテーション機能

画像上にマーカーと説明を追加できます。

- 「このソファはイメージです」
- 「この位置にエアコンがあります」
- 「収納スペース」

```javascript
const annotations = [
  {
    x: 0.3,  // 画像幅に対する割合
    y: 0.5,  // 画像高さに対する割合
    label: "リビングセット",
    description: "イメージです。実際の家具は含まれません。"
  }
];
```

## 埋め込み・シェア

作成したバーチャルステージングは:

- **物件公開ページに埋め込み**
- **iframeコードで外部サイトに埋め込み**
- **SNSでシェア**
- **QRコード生成**

が可能です。

## 注意点

バーチャルステージングを使用する際は、以下の点にご注意ください。

1. **イメージであることを明記**: 実際の家具とは異なることを明示
2. **過度な加工は避ける**: 部屋の広さや形状を変えるような加工はNG
3. **物件の瑕疵を隠さない**: 壁のシミなど、重要な情報は隠さない

## まとめ

バーチャルステージングは、**空室物件の魅力を最大限に引き出すツール**です。AIの力で、コストをかけずに「家具あり」のイメージを提供できます。

ぜひ物件紹介にご活用ください。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2025-12-29 11:00:00')
  post.commit_hash = '7b9e9cb'
end

puts "✓ 記事作成: #{blog_post_3.title}"

# 記事4: テスト基盤構築
blog_post_4 = BlogPost.find_or_create_by!(public_id: 'test-infrastructure-2025') do |post|
  post.title = "品質向上への取り組み：テスト基盤を構築しました"
  post.summary = "RSpec、Vitest、GitHub Actionsを使った自動テスト環境を構築。コードの品質と開発スピードを両立させます。"
  post.content = <<~'MARKDOWN'
## なぜテストが重要か

CoCoスモは日々新機能が追加されています。しかし、新機能を追加するたびに「既存機能が壊れていないか」を手動で確認するのは現実的ではありません。

そこで、**自動テスト**の出番です。

## 構築したテスト環境

### Backend: RSpec

Ruby on Railsの標準的なテストフレームワーク「RSpec」を導入しました。

```ruby
# モデルテストの例
RSpec.describe PropertyPublication, type: :model do
  describe '#publish!' do
    let(:publication) { create(:property_publication, status: :draft) }

    it 'changes status to published' do
      expect { publication.publish! }
        .to change(publication, :status)
        .from('draft').to('published')
    end

    it 'sets published_at timestamp' do
      publication.publish!
      expect(publication.published_at).to be_within(1.second).of(Time.current)
    end
  end
end
```

#### テスト対象

| カテゴリ | テスト数 | 対象 |
|----------|----------|------|
| モデル | 60+ | PropertyPublication, Building, Owner, BuildingRoute |
| サービス | 30+ | DirectionsService, VertexAiGroundingService |
| コントローラ | 50+ | Auth API, PropertyPublications API |
| Job | 20+ | ProcessScheduledPublicationsJob |

### Frontend: Vitest

フロントエンドのテストには「Vitest」を採用しました。Viteとの相性が良く、高速に実行できます。

```javascript
// ユーティリティ関数のテスト
describe('propertyFilterUtils', () => {
  describe('filterByRent', () => {
    it('filters properties within rent range', () => {
      const properties = [
        { rent: 50000 },
        { rent: 80000 },
        { rent: 120000 }
      ];

      const result = filterByRent(properties, { min: 60000, max: 100000 });

      expect(result).toHaveLength(1);
      expect(result[0].rent).toBe(80000);
    });
  });
});
```

### CI/CD: GitHub Actions

コードをプッシュするたびに、自動でテストが実行されます。

```yaml
# .github/workflows/ci.yml
jobs:
  test_backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:16-3.4
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
      - run: bundle exec rspec

  test_frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm test
```

## テストデータの準備: FactoryBot

テストデータは「FactoryBot」で定義しています。

```ruby
# spec/factories/buildings.rb
FactoryBot.define do
  factory :building do
    tenant
    sequence(:name) { |n| "テスト物件#{n}" }
    address { "東京都渋谷区1-1-1" }
    building_type { :mansion }
    lat { 35.6762 }
    lng { 139.6503 }

    trait :with_rooms do
      after(:create) do |building|
        create_list(:room, 3, building: building)
      end
    end
  end
end
```

## カバレッジレポート

テストがどの程度コードをカバーしているか、「SimpleCov」で計測しています。

現在のカバレッジ:
- **モデル**: 80%+
- **コントローラ**: 75%+
- **サービス**: 70%+

## テストの効果

### 1. リグレッションの早期発見

新機能追加時に、既存機能への影響を自動で検出できます。

### 2. ドキュメントとしてのテスト

テストコードを読めば、機能の仕様がわかります。

```ruby
# このテストを読めば、publish!メソッドの仕様がわかる
it 'sets published_at timestamp' do
  publication.publish!
  expect(publication.published_at).to be_present
end
```

### 3. リファクタリングの安心感

テストがあれば、大胆なリファクタリングも安心して行えます。

## 今後の展望

- E2Eテスト（Playwright）の導入
- カバレッジ目標の設定（80%以上）
- 性能テストの追加

品質と開発スピードの両立を目指し、テスト環境を継続的に改善していきます。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2025-12-30 18:00:00')
  post.commit_hash = '994ba8e'
end

puts "✓ 記事作成: #{blog_post_4.title}"

# 記事5: 物件公開ページのパスワード保護・有効期限機能
blog_post_5 = BlogPost.find_or_create_by!(public_id: 'publication-security-2025') do |post|
  post.title = "物件公開ページにパスワード保護と有効期限機能を追加"
  post.summary = "特定のお客様だけに物件情報を公開したい、期間限定で公開したい——そんなニーズに応える機能を実装しました。"
  post.content = <<~'MARKDOWN'
## 公開範囲をコントロールしたい

物件公開ページは便利ですが、時には**公開範囲を制限**したいケースがあります。

- 「このお客様だけに見せたい」
- 「1週間だけ公開したい」
- 「成約したら自動で非公開にしたい」

今回追加した**パスワード保護**と**有効期限**機能で、これらのニーズに対応できるようになりました。

## パスワード保護機能

### 設定方法

物件公開ページエディタで「パスワード保護」にチェックを入れ、パスワードを設定するだけ。

```ruby
# モデルでのパスワード認証
class PropertyPublication < ApplicationRecord
  def password_protected?
    access_password.present?
  end

  def authenticate_password(input_password)
    return true unless password_protected?
    access_password == input_password
  end
end
```

### お客様側の体験

パスワード保護されたページにアクセスすると、パスワード入力画面が表示されます。

正しいパスワードを入力すると、物件情報が表示されます。

### 使用シーン

- **VIP顧客向けの先行公開**: 一般公開前に特定のお客様だけに見せたい
- **競合への情報漏洩防止**: URLが拡散しても、パスワードがなければ見られない
- **内部レビュー用**: 公開前の確認用として社内共有

## 有効期限機能

### 設定方法

「有効期限」に日時を設定すると、その日時を過ぎると自動的にアクセス不可になります。

```ruby
# 有効期限のチェック
class PropertyPublication < ApplicationRecord
  def expired?
    expires_at.present? && expires_at < Time.current
  end

  def accessible?
    published? && !expired?
  end
end
```

### 期限切れ時の表示

有効期限が過ぎたページにアクセスすると、「公開期間が終了しました」というメッセージが表示されます（HTTPステータス: 410 Gone）。

### 使用シーン

- **期間限定キャンペーン**: 「今週末だけ特別公開」
- **成約後の自動非公開**: 成約予定日に合わせて期限を設定
- **イベント連動**: 内覧会期間中のみ公開

## スケジュール公開との組み合わせ

「スケジュール公開」機能と組み合わせると、**公開開始と終了を自動化**できます。

```
例: 12/1 10:00 に公開 → 12/7 23:59 に非公開

scheduled_publish_at: 2025-12-01 10:00
expires_at: 2025-12-07 23:59
```

これで、一度設定すれば手動での操作は不要です。

## プレビュー機能

パスワード保護や有効期限が設定されていても、**ログインユーザーはプレビューモードで確認**できます。

```
/property/abc123?preview=true
```

公開前の確認や、期限切れ後の内容確認に便利です。

## セキュリティに関する注意

パスワード保護は「簡易的なアクセス制限」です。以下の点にご注意ください。

- URLとパスワードを知っている人はアクセス可能
- 高度なセキュリティが必要な場合は、別途対策が必要

機密性の高い情報には、適切なセキュリティ対策を併用してください。

## まとめ

パスワード保護と有効期限機能で、物件公開ページの**公開範囲を柔軟にコントロール**できるようになりました。

- **パスワード保護**: 特定のお客様だけに公開
- **有効期限**: 期間限定公開を自動化
- **プレビュー**: 設定後も内容を確認可能

ぜひ営業活動にお役立てください。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2025-12-30 14:00:00')
  post.commit_hash = '7aef09e'
end

puts "✓ 記事作成: #{blog_post_5.title}"

puts "\n=== ブログ記事作成完了 ==="
puts "作成した記事: #{BlogPost.count}件"
