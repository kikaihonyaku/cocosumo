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
