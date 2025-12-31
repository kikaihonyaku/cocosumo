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

# 記事6: 開発者ブログ開始のお知らせ
blog_post_6 = BlogPost.find_or_create_by!(public_id: 'blog-launch-2025') do |post|
  post.title = "CoCoスモ開発者ブログを始めます"
  post.summary = "不動産テック「CoCoスモ」の開発チームが、新機能の紹介や技術的な取り組みをお届けする開発者ブログを開始しました。"
  post.content = <<~'MARKDOWN'
## はじめに

こんにちは。CoCoスモ開発チームです。

本日より、**CoCoスモ開発者ブログ**を開始します。このブログでは、CoCoスモの新機能紹介、開発の裏話、技術的なチャレンジなどをお届けしていきます。

## CoCoスモとは

CoCoスモは、不動産会社向けの**物件管理・マーケティングプラットフォーム**です。

「不動産業務を、もっとスマートに」をコンセプトに、以下の機能を提供しています。

- **GISベースの物件管理**: Google Maps上で物件を直感的に管理
- **AI画像編集**: 物件写真をAIでワンクリック加工
- **VRルームツアー**: 360度パノラマでバーチャル内見
- **バーチャルステージング**: 空室写真にAIで家具を配置
- **物件公開ページ**: お客様向けの物件紹介ページを簡単作成

## なぜブログを始めるのか

CoCoスモは日々進化しています。毎週のように新機能がリリースされ、既存機能も改善されています。

しかし、「こんな機能があるの知らなかった」「使い方がわからない」という声をいただくことも。

そこで、このブログを通じて：

1. **新機能の紹介**: リリースした機能の使い方やユースケースを解説
2. **開発の裏話**: 機能を作った背景や技術的な工夫を共有
3. **Tips & Tricks**: 知っておくと便利な使い方を紹介

していきたいと思います。

## 今後の予定

今後、以下のような記事を予定しています。

- 物件検索機能の使い方
- AI画像編集で物件写真をワンランクアップ
- VRルームツアーの作り方
- バーチャルステージングで空室を魅力的に
- お客様向け物件ページの作成方法

## 最後に

CoCoスモは、不動産業界のDXを推進するために生まれました。

このブログが、皆様の業務効率化の一助となれば幸いです。

ご意見・ご要望がありましたら、お気軽にお問い合わせください。

それでは、今後ともCoCoスモをよろしくお願いいたします。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2025-11-30 10:00:00')
  post.commit_hash = '51174a7'
end

puts "✓ 記事作成: #{blog_post_6.title}"

# 記事7: 物件管理の検索機能
blog_post_7 = BlogPost.find_or_create_by!(public_id: 'property-search-2025') do |post|
  post.title = "地図と連動した物件検索機能のご紹介"
  post.summary = "条件指定、地図上での範囲選択、レイヤー絞り込みなど、多彩な検索機能で物件を素早く見つけられます。"
  post.content = <<~'MARKDOWN'
## 物件を探す、という課題

不動産会社が管理する物件は、数十件から数千件まで様々です。その中から「条件に合う物件」を素早く見つけることは、日常業務の大きな課題です。

> 「駅から徒歩10分以内で、家賃8万円以下の1Kを探して」

こんなリクエストに、スムーズに応えられていますか？

CoCoスモの物件検索機能は、**条件指定**と**地図連動**を組み合わせて、直感的に物件を探せるように設計されています。

## 3つの検索アプローチ

### 1. 条件で絞り込む

左パネルの「検索」ボタンから、詳細な条件を指定できます。

- **賃料**: 最小〜最大の範囲指定（スライダー対応）
- **間取り**: 1R、1K、1DK、1LDK、2LDK...
- **面積**: 最小〜最大㎡
- **築年数**: 新築〜指定年数以内
- **ステータス**: 空室のみ、成約済みを含む、など

```javascript
// フィルター条件の例
const filters = {
  rent: { min: 50000, max: 80000 },
  roomType: ['1K', '1DK'],
  area: { min: 20 },
  yearBuilt: { max: 10 }
};
```

### 2. 地図上で範囲選択

「もっと視覚的に探したい」という方には、地図上での範囲選択がおすすめです。

#### 円で選択

指定した地点を中心に、半径○○mの範囲で物件を検索。

「この駅から徒歩圏内」という探し方に最適です。

#### ポリゴンで選択

自由な形で範囲を描いて検索。

「この学区内」「この川の南側」など、複雑な条件にも対応できます。

### 3. レイヤーで絞り込む

学区や行政区域などの**GeoJSONレイヤー**を表示し、クリックするだけで絞り込み。

```javascript
// レイヤークリック時の処理
const handleLayerClick = (feature) => {
  const geometry = feature.getGeometry();
  setGeoFilter({
    type: 'polygon',
    coordinates: geometry.getCoordinates()
  });
};
```

「○○小学校区内の物件」をワンクリックで抽出できます。

## リアルタイム集計

検索条件を変更すると、**リアルタイムで集計情報**が更新されます。

- 物件数: 123件
- 空室数: 45件
- 平均家賃: 72,500円
- 築年数分布: グラフ表示

条件を変えながら、市場の傾向を把握できます。

## 検索結果の活用

### 一覧表示

検索結果は一覧で表示され、クリックで詳細に移動。カラムでのソートも可能です。

### 地図表示

検索結果の物件が地図上にピン表示されます。クリックすると物件概要がポップアップ。

### CSV出力

検索結果をCSVでエクスポート。他のツールでの分析に活用できます。

## 検索条件の保存

よく使う検索条件は保存しておけます。

- 「徒歩10分以内・1K」
- 「ファミリー向け（2LDK以上）」
- 「○○学区内」

毎回同じ条件を入力する手間が省けます。

## まとめ

CoCoスモの物件検索は、**条件指定**、**地図範囲選択**、**レイヤー絞り込み**の3つのアプローチを組み合わせて使えます。

- 条件がはっきりしている → 検索フィルター
- エリアで探したい → 地図範囲選択
- 学区・行政区域で探したい → レイヤー絞り込み

お客様のニーズに合わせて、最適な方法で物件を探してください。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2025-12-01 10:00:00')
  post.commit_hash = '89039af'
end

puts "✓ 記事作成: #{blog_post_7.title}"

# 記事8: AI画像編集機能
blog_post_8 = BlogPost.find_or_create_by!(public_id: 'ai-photo-editor-2025') do |post|
  post.title = "AI画像編集機能で物件写真をワンランクアップ"
  post.summary = "Google Gemini（Nano Banana）を活用したAI画像編集機能で、物件写真を簡単に加工できるようになりました。"
  post.content = <<~'MARKDOWN'
## 物件写真の悩み

不動産の物件写真、こんな悩みはありませんか？

- 「曇りの日に撮影したので、暗い印象になってしまった」
- 「生活感のある家具が写り込んでいる」
- 「窓の外が白飛びしている」

プロのカメラマンに依頼すれば解決しますが、全物件に対応するのは現実的ではありません。

そこで、**AI画像編集機能**の出番です。

## 2種類の編集モード

CoCoスモの画像編集機能には、2つのモードがあります。

### 1. 基本調整モード

スライダーで直感的に調整できます。

- **明るさ**: 暗い写真を明るく
- **コントラスト**: メリハリをつける
- **彩度**: 色味を調整

```javascript
// Canvas APIを使用したリアルタイムフィルター
const applyFilters = (imageData, { brightness, contrast, saturation }) => {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    // 明るさ調整
    data[i] = data[i] + brightness;     // R
    data[i+1] = data[i+1] + brightness; // G
    data[i+2] = data[i+2] + brightness; // B
    // ...コントラスト、彩度の処理
  }
  return imageData;
};
```

プレビューを見ながらリアルタイムで調整できます。

### 2. AI編集モード

Google Gemini 2.5 Flash（開発コード：Nano Banana）を使った、**AIによる自動編集**です。

テキストで指示を出すだけで、AIが画像を加工します。

#### 使用例

```
「窓の外の景色を青空にして」
「床を明るい色のフローリングに変えて」
「家具を消して空室の状態にして」
「全体的に明るく爽やかな印象にして」
```

#### 仕組み

```ruby
# バックエンド処理（簡略化）
def edit_image(image, prompt)
  client = Google::Cloud::AIPlatform::V1::PredictionService::Client.new

  response = client.predict(
    endpoint: gemini_endpoint,
    instances: [{
      prompt: prompt,
      image: { bytesBase64Encoded: Base64.encode64(image) }
    }]
  )

  response.predictions.first
end
```

## 保存オプション

編集した画像は、2つの方法で保存できます。

1. **上書き保存**: 元の画像を置き換え
2. **新規保存**: 別の画像として保存（元の画像を残す）

Before/Afterを比較したい場合は、新規保存がおすすめです。

## 活用シーン

### 内見前の写真補正

曇りの日に撮影した写真を、明るく爽やかな印象に補正。お客様に好印象を与えます。

### 空室イメージの作成

家具が残っている写真から、AIで家具を消して空室イメージを作成。

### 季節感の演出

冬に撮影した庭の写真を、緑豊かな春〜夏の雰囲気に変更。

## 注意点

AI編集は強力ですが、以下の点にご注意ください。

- **実際と異なる印象を与えない**: 広さや間取りを変えるような加工は避ける
- **重要な瑕疵を隠さない**: 壁のひび割れなど、告知すべき情報は隠さない
- **加工であることを明示**: 必要に応じて「イメージ画像」と表記

## まとめ

AI画像編集機能を使えば、**専門知識がなくても**物件写真を簡単に加工できます。

- 基本調整: 明るさ・コントラスト・彩度をスライダーで
- AI編集: テキスト指示で高度な加工

物件の魅力を最大限に引き出す写真で、成約率アップを目指しましょう。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2025-12-03 10:00:00')
  post.commit_hash = '1a80f89'
end

puts "✓ 記事作成: #{blog_post_8.title}"

# 記事9: AIを使った周辺施設チャット
blog_post_9 = BlogPost.find_or_create_by!(public_id: 'ai-grounding-chat-2025') do |post|
  post.title = "AIチャットで周辺施設を調べる機能をリリース"
  post.summary = "建物詳細画面からAIに質問するだけで、物件周辺のスーパー、学校、病院などの情報を調べられます。"
  post.content = <<~'MARKDOWN'
## お客様からの「周辺に何がありますか？」

物件案内で必ず聞かれる質問があります。

> 「この辺りにスーパーはありますか？」
> 「最寄りの小学校はどこですか？」
> 「病院は近くにありますか？」

従来は、Googleマップで調べたり、地域の知識を頼りに答えたりしていました。しかし、管轄外のエリアや、新しくオープンした施設は把握しきれないこともあります。

そこで、**AIチャット機能**を開発しました。

## どんな機能？

建物詳細画面の地図パネルに、**AIチャット**を統合しました。

質問を入力するだけで、AIが物件周辺の施設情報を調べて回答します。

### 使用例

```
Q: 近くにスーパーはありますか？

A: この物件の周辺には以下のスーパーがあります：

   1. **まいばすけっと 恵比寿駅前店** - 徒歩3分（約200m）
      営業時間: 7:00-24:00

   2. **成城石井 恵比寿ガーデンプレイス店** - 徒歩5分（約350m）
      営業時間: 10:00-22:00

   3. **ピーコックストア 恵比寿店** - 徒歩7分（約500m）
      営業時間: 9:00-21:00
```

### 住所クリックで地図表示

AIの回答に含まれる住所はクリック可能。クリックすると、地図上にマーカーが表示されます。

## 技術的な仕組み

### Vertex AI Grounding with Google Maps

この機能は、Google CloudのVertex AIと、**Grounding with Google Maps**を組み合わせて実現しています。

```ruby
# VertexAiGroundingService（簡略化）
class VertexAiGroundingService
  def query(prompt, context)
    # 物件住所をコンテキストとして設定
    system_prompt = <<~PROMPT
      あなたは不動産の周辺情報アシスタントです。
      対象物件の住所: #{context[:address]}

      ユーザーの質問に対して、周辺施設の情報を
      Google Mapsのデータを参照して回答してください。
    PROMPT

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

### 会話履歴の保持

マルチターン会話に対応しており、前の質問を踏まえた回答が可能です。

```
Q: 近くに小学校はありますか？
A: 渋谷区立恵比寿小学校が徒歩8分の場所にあります。

Q: そこの評判はどうですか？
A: 恵比寿小学校は、渋谷区内でも人気の高い学校です...
```

「そこ」が「恵比寿小学校」を指していることを理解して回答します。

## 活用シーン

### 内見前の事前調査

お客様を案内する前に、周辺施設を把握しておけます。

### 電話問い合わせへの即答

「この物件の周辺に○○はありますか？」という問い合わせに、その場で調べて回答。

### 物件紹介資料の作成

AIの回答を参考に、物件紹介資料に周辺情報を追加。

## 質問のコツ

より良い回答を得るためのコツをいくつかご紹介します。

1. **具体的に聞く**: 「近くに何がありますか？」より「徒歩5分以内のコンビニ」
2. **複数施設をまとめて聞く**: 「スーパー、ドラッグストア、コンビニを教えて」
3. **条件を指定する**: 「24時間営業のスーパー」「小児科のある病院」

## 今後の展望

- 学区情報との連携
- 通勤時間シミュレーション
- ハザードマップ情報の統合

物件の「立地」をより深く理解できる機能へと進化させていきます。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2025-12-05 10:00:00')
  post.commit_hash = '7f5c2e1'
end

puts "✓ 記事作成: #{blog_post_9.title}"

# 記事10: VRルームツアー
blog_post_10 = BlogPost.find_or_create_by!(public_id: 'vr-room-tour-intro-2025') do |post|
  post.title = "360度パノラマで物件を紹介！VRルームツアー機能"
  post.summary = "360度カメラで撮影した写真を使って、没入感のあるバーチャル内見体験を提供できます。"
  post.content = <<~'MARKDOWN'
## 「来店しなくても内見したい」

コロナ禍以降、オンライン内見のニーズが急増しました。

しかし、普通の写真だけでは「部屋の広さ」「窓からの眺め」「生活動線」がイメージしにくいという声も。

そこで、**VRルームツアー**機能を開発しました。360度パノラマ写真を使って、まるでその場にいるような内見体験を提供できます。

## VRルームツアーとは

360度カメラ（RICOH THETAなど）で撮影した写真を使って、**バーチャルルームツアー**を作成できる機能です。

- **パノラマビュー**: マウスドラッグやスワイプで全方向を見渡せる
- **複数シーン**: リビング、キッチン、寝室など、複数の撮影ポイントを登録
- **ホットスポット**: クリックで別のシーンに移動するポイントを設置

## VRルームツアーの作り方

### Step 1: 360度写真を撮影

RICOH THETAなどの360度カメラで、部屋の各ポイントを撮影します。

**撮影のコツ**:
- 三脚を使って、床から1.2〜1.5mの高さで撮影
- 照明を点けて明るく
- なるべく部屋の中央で撮影

### Step 2: 写真をアップロード

部屋詳細画面から「VRルームツアー」を作成し、写真をアップロードします。

アップロードした写真は「シーン」として登録されます。

### Step 3: ホットスポットを設置

シーン間を移動するための「ホットスポット」を設置します。

例えば、リビングのシーンで「キッチン」の方向にホットスポットを置くと、クリックでキッチンのシーンに移動できます。

```javascript
// ホットスポットの設定例
const hotspot = {
  pitch: -10,      // 縦方向の角度
  yaw: 45,         // 横方向の角度
  targetSceneId: 'kitchen',
  label: 'キッチンへ'
};
```

### Step 4: 公開

「公開」ボタンを押すと、URLが発行されます。このURLをお客様に共有するだけで、VRルームツアーを体験していただけます。

## 高度な機能

### 情報ホットスポット

シーン移動だけでなく、**情報を表示するホットスポット**も設置できます。

- 設備の説明（「床暖房完備」）
- 仕様の詳細（「キッチン：IHクッキングヒーター」）
- 注意事項（「この壁は撤去可能」）

### オートプレイ

自動でパノラマが回転し、シーンも自動で切り替わります。展示会でのデモや、お客様への自動案内に最適です。

### ジャイロスコープ対応

スマートフォンを傾けると、その方向にパノラマビューが動きます。より没入感のある体験を提供できます。

### 埋め込み

iframeコードを生成して、自社サイトや物件ポータルに埋め込むことも可能です。

```html
<iframe
  src="https://cocosumo.space/vr/abc123"
  width="100%"
  height="500"
  allowfullscreen
></iframe>
```

## 活用事例

### 遠方のお客様への事前案内

首都圏の物件を地方から検討されているお客様に、来店前にVRルームツアーを体験していただけます。

### 物件サイトへの埋め込み

SUUMO等のポータルサイトへのリンクに加え、自社サイトにVRルームツアーを埋め込み、物件の魅力をアピール。

### 展示会でのデモ

オートプレイ機能で、スタッフが付きっきりでなくても物件紹介ができます。

## まとめ

VRルームツアーは、**オンライン内見**の強力なツールです。

- 360度写真で没入感のある体験
- ホットスポットでシーン間を自由に移動
- オートプレイ、ジャイロスコープなど高度な機能

ぜひ物件紹介にご活用ください。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2025-12-13 10:00:00')
  post.commit_hash = 'c9f6426'
end

puts "✓ 記事作成: #{blog_post_10.title}"

# 記事11: バーチャルステージング機能
blog_post_11 = BlogPost.find_or_create_by!(public_id: 'virtual-staging-intro-2025') do |post|
  post.title = "空室を魅力的に！バーチャルステージング機能のご紹介"
  post.summary = "空室写真にAIで家具を配置し、Before/After比較ができるバーチャルステージング機能をご紹介します。"
  post.content = <<~'MARKDOWN'
## 空室の「もったいなさ」

内見で空室を案内すると、お客様からこんな声をいただくことがあります。

> 「何もないと、どう使えばいいかイメージが湧かない」
> 「広いのか狭いのか、よくわからない」

せっかくの良い物件なのに、空室であるがゆえに魅力が伝わらない——これは本当に「もったいない」ことです。

かといって、ホームステージング（実際に家具を入れる）はコストも手間もかかります。

そこで役立つのが、**バーチャルステージング**です。

## バーチャルステージングとは

空室の写真に、**CGで家具を合成**する手法です。

CoCoスモでは、**AI（Google Imagen）**を使って、簡単にバーチャルステージング画像を作成できます。

## 作成の流れ

### Step 1: Before画像をアップロード

空室の写真をアップロードします。できるだけ広角で、床と壁がしっかり写っている写真がおすすめです。

### Step 2: スタイルを選択

5つのスタイルプリセットから選べます。

| スタイル | 特徴 | おすすめの物件 |
|----------|------|---------------|
| モダン | シンプルでスタイリッシュ | 単身向け、デザイナーズ |
| トラディショナル | 落ち着いた伝統的スタイル | ファミリー向け |
| ナチュラル | 木目や自然素材 | 女性向け、ファミリー向け |
| 空室クリーン | 生活感を消してクリーンに | 退去直後の物件 |
| カスタム | 自由なプロンプト | 特定のコンセプト |

### Step 3: AI生成

「AI生成」ボタンをクリックすると、数秒でAfter画像が生成されます。

### Step 4: 公開

作成したバーチャルステージングは、そのまま公開できます。

## Before/After比較機能

バーチャルステージングの最大の魅力は、**Before/After比較**です。

スライダーを左右にドラッグすると、空室と家具あり状態を直感的に比較できます。

```jsx
<CompareSlider
  beforeImage="/images/room_empty.jpg"
  afterImage="/images/room_staged.jpg"
  sliderPosition={50}
/>
```

「家具を置いたらこうなる」がひと目でわかります。

## 複数バリエーション

同じ部屋でも、ターゲットによって最適なスタイルは異なります。

CoCoスモでは、**1つの写真に対して複数のバリエーション**を作成できます。

- 単身男性向け: シンプルモダン
- 単身女性向け: ナチュラル
- カップル向け: スタイリッシュモダン

お客様の属性に合わせて、最適なバリエーションを見せられます。

## アノテーション機能

画像上にマーカーと説明を追加できます。

- 「このソファはイメージです」
- 「この位置にエアコンがあります」
- 「収納スペース」

誤解を防ぎつつ、物件の特徴をアピールできます。

## VRツアーとの統合

バーチャルステージング画像は、**VRルームツアー**に組み込むことも可能です。

360度パノラマのVRツアー内で、Before/After比較を表示。より没入感のある体験を提供できます。

## 注意点

バーチャルステージングを使用する際は、以下の点にご注意ください。

1. **イメージであることを明記**: 実際の家具とは異なることを明示
2. **過度な加工は避ける**: 部屋の広さや形状を変えるような加工はNG
3. **物件の瑕疵を隠さない**: 壁のシミなど、重要な情報は隠さない

## まとめ

バーチャルステージングは、**空室物件の魅力を最大限に引き出すツール**です。

- AIで簡単に家具を配置
- Before/Afterで直感的に比較
- 複数バリエーションでターゲット別にアピール

空室物件の成約率アップに、ぜひご活用ください。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2025-12-15 10:00:00')
  post.commit_hash = '7dd1a7a'
end

puts "✓ 記事作成: #{blog_post_11.title}"

# 記事12: ホームページ作成機能（物件公開ページ）
blog_post_12 = BlogPost.find_or_create_by!(public_id: 'property-publication-intro-2025') do |post|
  post.title = "お客様向け物件紹介ページを簡単作成！ホームページ機能"
  post.summary = "物件情報、写真、VRツアーを組み合わせた「お客様向け物件紹介ページ」を数分で作成できます。"
  post.content = <<~'MARKDOWN'
## 物件情報をどう共有していますか？

お客様に物件を紹介するとき、どのような方法を使っていますか？

- メールに写真を添付
- PDFの物件資料を送付
- ポータルサイトのURLを共有

どれも手間がかかったり、情報が分散したりしていませんか？

CoCoスモの**物件公開ページ**機能を使えば、**お客様専用の物件紹介ページ**を数分で作成できます。

## 物件公開ページとは

物件の情報、写真、VRツアー、バーチャルステージングをまとめた、**お客様向けの専用ページ**です。

URLを共有するだけで、お客様はスマホやPCから物件情報を閲覧できます。

## 作成の流れ

### Step 1: 基本情報を入力

- **タイトル**: 「○○マンション 101号室」
- **キャッチコピー**: 「駅徒歩3分！南向き角部屋」
- **PR文**: 物件の魅力を自由に記述（リッチテキスト対応）

### Step 2: 写真を選択

部屋・建物に登録済みの写真から、公開する写真を選択。ドラッグ&ドロップで順番を変更できます。

```jsx
// 写真の並び替え（@dnd-kit使用）
<DndContext onDragEnd={handleDragEnd}>
  <SortableContext items={photos}>
    {photos.map((photo) => (
      <SortablePhoto key={photo.id} photo={photo} />
    ))}
  </SortableContext>
</DndContext>
```

### Step 3: コンテンツを追加

VRツアー、バーチャルステージングを追加できます。

- **VRツアー**: 360度パノラマで没入感のある内見体験
- **バーチャルステージング**: Before/After比較で空室の可能性をアピール

### Step 4: 表示項目をカスタマイズ

何を表示するか、細かくカスタマイズできます。

- 間取り図: 表示/非表示
- 周辺地図: 表示/非表示
- 問い合わせフォーム: 表示/非表示
- SNSシェアボタン: 表示/非表示

### Step 5: 公開

「公開」ボタンを押すと、URLが発行されます。このURLをお客様に共有するだけで完了です。

## 高度な機能

### テンプレート選択

4種類のテンプレートから選べます。

| テンプレート | 特徴 |
|--------------|------|
| スタンダード | シンプルで見やすい標準デザイン |
| SUUMO風 | ポータルサイト風のレイアウト |
| モダン | 写真を大きく見せるデザイン |
| ミニマル | 情報を絞ったシンプルデザイン |

### パスワード保護

特定のお客様だけに見せたい場合、パスワードを設定できます。

### 有効期限

「1週間だけ公開」など、期限付きの公開が可能です。期限が過ぎると自動で非公開になります。

### スケジュール公開

「明日の10時に公開」など、公開日時を予約できます。

### QRコード

公開ページのQRコードを自動生成。チラシやパンフレットに印刷して活用できます。

### 問い合わせフォーム

公開ページから直接問い合わせを受け付けられます。問い合わせがあると、メールで通知されます。

### アクセス分析

- ページビュー数
- 滞在時間
- デバイス別アクセス（PC/スマホ/タブレット）
- 時間帯別アクセス

どの物件が注目されているか、データで把握できます。

## 活用シーン

### 内見予約前の事前案内

「詳しい情報はこちらをご覧ください」とURLを共有。お客様に事前に物件を理解していただけます。

### 複数物件の比較検討

お客様ごとに複数の物件ページを共有。比較検討の材料としてご活用いただけます。

### SNSでの物件紹介

InstagramやTwitterで物件を紹介する際、公開ページのURLを貼るだけ。

## まとめ

物件公開ページ機能を使えば、**お客様専用の物件紹介ページ**を数分で作成できます。

- 写真、VRツアー、バーチャルステージングをまとめて紹介
- テンプレート選択で見栄えの良いページを簡単作成
- パスワード保護、有効期限、スケジュール公開などの高度な機能
- 問い合わせフォーム、アクセス分析で営業活動をサポート

ぜひ物件紹介にご活用ください。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2025-12-17 10:00:00')
  post.commit_hash = '64f0734'
end

puts "✓ 記事作成: #{blog_post_12.title}"

# 記事13: 店舗管理機能
blog_post_13 = BlogPost.find_or_create_by!(public_id: 'store-management-2025') do |post|
  post.title = "複数店舗の物件を一元管理！店舗管理機能"
  post.summary = "店舗マスタを登録し、物件を店舗ごとに管理・絞り込みできる店舗管理機能をリリースしました。"
  post.content = <<~'MARKDOWN'
## 複数店舗を展開する会社の課題

不動産会社が複数の店舗を展開している場合、こんな課題はありませんか？

- 「A店の物件とB店の物件が混在して、管理しにくい」
- 「他店の物件を間違えてお客様に紹介してしまった」
- 「店舗ごとの物件数や成約状況を把握したい」

CoCoスモの**店舗管理機能**で、これらの課題を解決できます。

## 店舗管理機能とは

会社内の**店舗（支店・営業所）をマスタ登録**し、物件と紐付けて管理できる機能です。

- 店舗ごとに物件を絞り込み
- 店舗の位置を地図上に表示
- 店舗別の集計・分析

## 設定の流れ

### Step 1: 店舗マスタを登録

管理画面から店舗情報を登録します。

- **店舗名**: 「恵比寿店」「渋谷店」など
- **住所**: 店舗の所在地
- **電話番号**: 店舗の連絡先
- **座標**: 住所から自動取得（ジオコーディング）

```ruby
# ジオコーディング処理
class Store < ApplicationRecord
  before_save :geocode_address

  def geocode_address
    return if address.blank?

    result = Geocoder.search(address).first
    if result
      self.latitude = result.latitude
      self.longitude = result.longitude
    end
  end
end
```

### Step 2: 物件に店舗を紐付け

物件（建物）の登録・編集画面で、担当店舗を選択します。

### Step 3: 店舗で絞り込み

地図画面や物件一覧画面で、店舗を選択して絞り込み。自分の店舗の物件だけを表示できます。

## 機能詳細

### 店舗の地図表示

地図上に店舗の位置がアイコンで表示されます。

初回アクセス時は、店舗の位置を中心に地図が表示されるので、すぐに周辺物件を確認できます。

### 店舗別フィルター

左パネルの検索条件に「店舗」を追加。

- 全店舗
- 恵比寿店
- 渋谷店
- 代官山店

ワンクリックで切り替えられます。

### 検索前提条件

「この店舗の物件だけを常に表示したい」という場合は、検索前提条件に店舗を設定。

毎回フィルターを選択する手間が省けます。

### 店舗別集計

店舗ごとの物件数、空室数、成約率などを集計・比較できます。

## 活用シーン

### 店舗間の情報共有

他店舗の物件情報も閲覧可能。お客様の希望エリアに応じて、他店舗の物件を紹介できます。

### 店舗別の業績管理

店舗ごとの物件数、成約数を把握。営業戦略の立案に活用できます。

### 新店舗オープン時

新店舗を登録し、担当エリアの物件を紐付け。スムーズに業務を開始できます。

## 権限管理（今後の展望）

現在は全店舗の物件を閲覧できますが、今後は権限管理機能を追加予定です。

- 自店舗の物件のみ閲覧/編集可能
- 他店舗の物件は閲覧のみ
- 本部は全店舗の物件を管理

店舗規模や運用に合わせて、柔軟に設定できるようになります。

## まとめ

店舗管理機能を使えば、**複数店舗の物件を一元管理**できます。

- 店舗マスタを登録し、物件と紐付け
- 店舗ごとに物件を絞り込み・集計
- 地図上に店舗位置を表示

複数店舗を展開する不動産会社様、ぜひご活用ください。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2025-12-19 10:00:00')
  post.commit_hash = 'd205773'
end

puts "✓ 記事作成: #{blog_post_13.title}"

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

## 顧客アクセス管理

### 一元管理画面

発行した顧客アクセスは、**顧客アクセス管理ページ**で一覧表示されます。

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

puts "\n=== ブログ記事作成完了 ==="
puts "作成した記事: #{BlogPost.count}件"
