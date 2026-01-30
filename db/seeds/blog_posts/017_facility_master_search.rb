# 記事17: 設備マスタと検索機能
blog_post_17 = BlogPost.find_or_create_by!(public_id: 'facility-master-search-2026') do |post|
  post.title = "67種類の設備を10カテゴリに整理！設備マスタと検索機能を実装しました"
  post.summary = "AI解析で抽出した設備情報を構造化し、物件検索で設備による絞り込みができるようになりました。同義語正規化で「エアコン」と「冷暖房」も同一設備として認識します。"
  post.content = <<~'MARKDOWN'
## 「エアコン付き」で検索したい

お客様からの問い合わせで、よくある条件があります。

> 「エアコン付きで、オートロックがある物件を探しています」

不動産ポータルサイトでは当たり前の検索条件ですが、物件管理システムでは意外と難しい課題でした。なぜでしょうか？

### 設備情報は「自由記述」の世界

募集図面から取得した設備情報を見てみると——

- 物件A: `エアコン、バストイレ別、室内洗濯機置場`
- 物件B: `冷暖房完備、バス・トイレ別、洗濯機置場（室内）`
- 物件C: `クーラー、UB別、洗濯機IN`

**同じ設備を指しているのに、表記がバラバラ**です。

これをそのまま検索しても、「エアコン」で検索すると物件Aしかヒットしません。物件B、Cも本当は該当するのに。

## 解決策: 設備マスタ + 同義語正規化

この課題を解決するため、**3層構造のアプローチ**を採用しました。

```
┌─────────────────────────────────────────────────┐
│  Layer 1: 設備マスタ（67項目 × 10カテゴリ）      │
├─────────────────────────────────────────────────┤
│  Layer 2: 同義語テーブル（368パターン以上）      │
├─────────────────────────────────────────────────┤
│  Layer 3: 正規化サービス（FacilityNormalizer）  │
└─────────────────────────────────────────────────┘
```

### Layer 1: 設備マスタ

まず、賃貸物件で一般的な設備を**67項目**に整理しました。

| カテゴリ | 項目例 | 件数 |
|---------|--------|------|
| キッチン | システムキッチン、IH、食洗機 | 8 |
| バス・トイレ | バストイレ別、追い焚き、浴室乾燥機 | 10 |
| 冷暖房 | エアコン、床暖房、給湯器 | 5 |
| セキュリティ | オートロック、TVモニター、宅配ボックス | 7 |
| 収納 | ウォークインクローゼット、シューズボックス | 5 |
| 通信 | インターネット無料、光ファイバー、BS/CS | 5 |
| 洗濯 | 室内洗濯機置場、乾燥機付き | 4 |
| 内装 | フローリング、バルコニー、角部屋 | 10 |
| 共用設備 | エレベーター、駐輪場、24時間ゴミ出し | 8 |
| その他 | ペット可、楽器相談可、事務所利用可 | 5 |

各設備には一意の**コード**（`air_conditioner`など）を割り当て、システム内で統一的に扱います。

```ruby
# 設備マスタのスキーマ
create_table :facilities do |t|
  t.string :code, null: false      # 内部識別子
  t.string :name, null: false      # 表示名
  t.string :category, null: false  # カテゴリ
  t.boolean :is_popular            # 人気設備フラグ
  t.integer :display_order         # 表示順
end
```

### Layer 2: 同義語テーブル

「エアコン」「冷暖房」「クーラー」を同じ設備として認識するため、**同義語テーブル**を用意しました。

```ruby
# 同義語の登録例
Facility.find_by(code: 'air_conditioner').synonyms.create!([
  { synonym: 'エアコン' },
  { synonym: '冷暖房' },
  { synonym: 'クーラー' },
  { synonym: 'AC' },
  { synonym: 'エアーコンディショナー' },
  { synonym: '冷房' },
  { synonym: '暖房' },
])
```

現在、**368パターン以上**の同義語を登録しています。

### Layer 3: FacilityNormalizer

同義語テーブルを使って、自由記述のテキストを設備コードに変換するサービスです。

```ruby
class FacilityNormalizer
  def normalize(text)
    items = parse_facilities(text)  # カンマ区切りで分割

    items.each do |item|
      # 1. 完全一致
      facility = exact_match(item)
      next record_match(facility, item) if facility

      # 2. 部分一致
      facility = partial_match(item)
      next record_match(facility, item) if facility

      # 3. 曖昧マッチ（編集距離）
      facility = fuzzy_match(item)
      next record_match(facility, item) if facility

      # マッチしない場合は記録（後で同義語追加の参考に）
      record_unmatched(item)
    end
  end
end
```

**3段階のマッチング**で、表記ゆれを吸収します。

1. **完全一致**: 同義語テーブルと完全に一致
2. **部分一致**: 同義語が含まれている（「浴室乾燥機付き」→「浴室乾燥機」）
3. **曖昧マッチ**: 編集距離が近い（「オートロツク」→「オートロック」のtypo対応）

## 検索UIの実装

設備マスタが整備されたので、物件検索画面に**設備フィルタ**を追加しました。

### 人気設備のチップ表示

検索画面には、よく使われる設備を**チップ形式**で表示。ワンクリックで絞り込めます。

```jsx
{popularFacilities.map((facility) => (
  <Chip
    key={facility.code}
    label={facility.name}
    onClick={() => handleFacilityToggle(facility.code)}
    sx={{
      bgcolor: isSelected ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
      border: isSelected ? '2px solid white' : '1px solid rgba(255, 255, 255, 0.3)',
    }}
  />
))}
```

### カテゴリ別ダイアログ

「その他の設備を選択」ボタンを押すと、**全67項目をカテゴリ別**に選べるダイアログが開きます。

- アコーディオンでカテゴリを展開/折りたたみ
- カテゴリ単位で「すべて選択」も可能
- 選択中の設備をチップで一覧表示

### AND検索

複数の設備を選択した場合は**AND検索**。「エアコン」と「オートロック」の両方を持つ物件だけが表示されます。

```javascript
// 設備フィルタのロジック
if (facilities.length > 0) {
  const roomFacilities = room.facility_codes || [];
  const hasAllFacilities = facilities.every(f => roomFacilities.includes(f));
  if (!hasAllFacilities) return false;
}
```

## AI解析との連携

募集図面のAI解析で抽出された設備は、自動的に正規化されます。

```
AI解析結果: "エアコン、バストイレ別、室内洗濯機置場"
      ↓ FacilityNormalizer
正規化結果: [air_conditioner, bath_toilet_separate, washer_indoor]
```

解析画面では、正規化された設備を**チップ形式**で表示。そのまま「適用」すると、部屋の設備情報として保存されます。

## 未マッチ設備の学習

正規化でマッチしなかった設備は、`unmatched_facilities`テーブルに記録されます。

```ruby
create_table :unmatched_facilities do |t|
  t.string :raw_text       # 元テキスト
  t.integer :occurrence    # 出現回数
  t.string :status         # pending / ignored / added_synonym
end
```

これを定期的に確認し、新しい同義語を追加していくことで、**正規化の精度を継続的に向上**させます。

## 活用シーン

### お客様の希望条件での検索

「バストイレ別、宅配ボックス付き」といった条件で、該当物件を即座に絞り込み。

### 競合物件との設備比較

同じエリアの物件を、設備の有無で比較分析。

### 設備統計の可視化

「オートロック付き物件の割合」「築年数と設備の相関」など、データ分析にも活用可能に。

## 今後の展望

### 設備グレードの管理

「エアコン」でも「各部屋設置」「リビングのみ」など、グレードの違いを管理。

### 設備の自動推薦

「この物件に多い設備」「お客様の希望に近い設備」を自動提案。

### 外部データとの連携

不動産ポータルサイトの設備コードとの変換テーブルを整備し、データ連携を容易に。

## まとめ

自由記述の設備情報を、**67項目の設備マスタ**と**368パターンの同義語**で構造化しました。

- 「エアコン」も「冷暖房」も「クーラー」も、同じ設備として検索可能
- 10カテゴリに整理された設備を、チップやダイアログで直感的に選択
- AI解析との連携で、募集図面から自動的に設備情報を登録
- 未マッチ設備の記録で、継続的に精度向上

**構造化されたデータは、検索の質を高め、業務効率を向上させます**。

設備検索、ぜひお試しください。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2026-01-05 21:00:00')
  post.commit_hash = nil  # まだコミット前
end

puts "✓ 記事作成: #{blog_post_17.title}"
