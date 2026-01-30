# 記事25: Inquiryドメインリファクタリング — 商談管理を物件単位に移動
blog_post_25 = BlogPost.find_or_create_by!(public_id: 'inquiry-domain-refactor-2026') do |post|
  post.title = "「案件」と「物件問い合わせ」の役割を再定義 — 商談管理をもっと自然に"
  post.summary = "案件（Inquiry）を会話の箱としてシンプルにし、商談ステータス・優先度・担当者を物件問い合わせ（PropertyInquiry）に移動。物件単位で商談進捗を追えるようになりました。"
  post.content = <<~'MARKDOWN'
## はじめに — 設計は「使ってみて」わかることがある

前回の記事で、顧客管理に **案件（Inquiry）** という中間レイヤーを導入したことをご紹介しました。顧客に直接紐付いていた商談ステータスを案件に移し、1人のお客様に複数の案件を持てる構造にしたのです。

しかし、実装を進めて画面を作り込んでいくうちに、ある違和感に気づきました。

> 「この案件の商談ステータスは"内見予約"だけど、実際に内見が決まったのは3物件のうち1つだけなんだよな...」

商談ステータスを **案件単位** で管理すると、同じ案件の中で物件ごとに進捗が異なるケースをうまく表現できないのです。

## 何が問題だったのか

前回の設計はこうでした。

```
Customer
├── Inquiry（案件1）
│   ├── deal_status: 内見予約  ← 案件全体で1つ
│   ├── priority: 高          ← 案件全体で1つ
│   ├── assigned_user: 佐藤   ← 案件全体で1つ
│   ├── PropertyInquiry（〇〇マンション301号）← 内見決定
│   └── PropertyInquiry（△△ハイツ205号）    ← まだ資料請求段階
```

物件Aは内見まで進んでいるのに、物件Bはまだ資料を見ている段階。案件全体のステータスを「内見予約」にすると物件Bの状態を見失いますし、「対応中」にすると物件Aの進捗が埋もれてしまいます。

さらに、担当者も物件によって変えたいケースがありました。駅近マンションは佐藤さん、郊外の戸建ては田中さんが担当——でも同じ案件なので担当者は1人しか設定できません。

## 新しい設計 — 「案件は箱、商談管理は物件単位」

そこで今回、各モデルの**役割を再定義**しました。

```
Customer
├── Inquiry（案件1：アクティブ）
│   ├── status: active（アクティブ / 保留中 / クローズ）
│   ├── notes: "ファミリー向け希望"
│   │
│   ├── PropertyInquiry（〇〇マンション301号）
│   │   ├── deal_status: 内見予約
│   │   ├── priority: 高
│   │   └── assigned_user: 佐藤
│   │
│   └── PropertyInquiry（△△ハイツ205号）
│       ├── deal_status: 対応中
│       ├── priority: 通常
│       └── assigned_user: 田中
```

### Inquiry — 会話の箱

案件（Inquiry）は **物件問い合わせをまとめるグループ** という役割に特化させました。持つ属性はシンプルです。

```ruby
class Inquiry < ApplicationRecord
  belongs_to :tenant
  belongs_to :customer
  has_many :property_inquiries, dependent: :destroy

  enum :status, {
    active: 0,   # アクティブ
    on_hold: 1,  # 保留中
    closed: 2    # クローズ
  }
end
```

3つのステータスだけ。「この案件はまだ動いている（active）」「一旦お客様都合で止まっている（on_hold）」「終わった（closed）」——案件の**ライフサイクル**だけを表現します。

### PropertyInquiry — 物件単位の商談管理

商談の実態は物件ごとに異なります。だから、商談管理の属性は**物件問い合わせ（PropertyInquiry）** に持たせるのが自然です。

```ruby
class PropertyInquiry < ApplicationRecord
  belongs_to :inquiry
  belongs_to :customer
  belongs_to :room
  belongs_to :assigned_user, class_name: "User", optional: true

  enum :deal_status, {
    new_inquiry: 0,       # 新規反響
    contacting: 1,        # 対応中
    viewing_scheduled: 2, # 内見予約
    viewing_done: 3,      # 内見済
    application: 4,       # 申込
    contracted: 5,        # 成約
    lost: 6               # 失注
  }

  enum :priority, {
    low: 0, normal: 1, high: 2, urgent: 3
  }
end
```

これにより、同じ案件の中でも物件Aは「内見予約・佐藤担当」、物件Bは「対応中・田中担当」と、それぞれ独立して管理できます。

## 移動したフィールド

| フィールド | 移動元 | 移動先 |
|-----------|--------|--------|
| deal_status | Inquiry | PropertyInquiry |
| deal_status_changed_at | Inquiry | PropertyInquiry |
| priority | Inquiry | PropertyInquiry |
| assigned_user_id | Inquiry | PropertyInquiry |
| lost_reason | Inquiry | PropertyInquiry |

Inquiry に新たに追加されたのは `status`（active / on_hold / closed）だけです。

## 商談ステータス変更は履歴付き

PropertyInquiry の商談ステータスを変更すると、自動的に対応履歴（CustomerActivity）が記録されます。

```ruby
class PropertyInquiry < ApplicationRecord
  def change_deal_status!(new_status, user: nil, reason: nil)
    self.deal_status = new_status
    self.lost_reason = reason if new_status.to_s == "lost"
    self.changed_by = user
    save!
  end

  private

  def record_deal_status_change_activity
    customer_activities.create!(
      customer: customer,
      inquiry: inquiry,
      user: changed_by,
      activity_type: :status_change,
      subject: "商談ステータスを「#{deal_status_label}」に変更",
      content: property_title
    )
  end
end
```

「誰が、どの物件の商談ステータスを、いつ変えたか」が物件単位で追跡できます。

## API の変更

### 物件問い合わせに商談管理エンドポイントを追加

```
POST   /api/v1/property_inquiries/:id/change_deal_status
PATCH  /api/v1/property_inquiries/:id  # priority, assigned_user_id も更新可能に
```

### 案件のステータス変更はシンプルに

```
POST   /api/v1/inquiries/:id/change_status  # active / on_hold / closed
PATCH  /api/v1/inquiries/:id                # notes の更新
```

案件 API からは deal_status / priority / assigned_user 関連のフィルタを削除し、シンプルな CRUD に絞りました。

## フロントエンドの変更

### 顧客詳細画面 — 3カラムレイアウト

```
┌─────────────┬──────────────────┬─────────────────────┐
│ 案件一覧     │ 対応履歴         │ 物件問い合わせ       │
│             │                  │                     │
│ 案件1       │ ・内見予約に変更  │ 〇〇マンション 301号 │
│ [アクティブ] │ ・電話対応       │ [内見予約] 優先:高   │
│ 物件:2件    │ ・資料送付       │  担当: 佐藤         │
│             │                  │                     │
│ 案件2       │                  │ △△ハイツ 205号     │
│ [クローズ]  │                  │ [対応中] 優先:通常   │
│ 物件:1件    │                  │  担当: 田中         │
└─────────────┴──────────────────┴─────────────────────┘
```

左ペインで案件を選択すると、右ペインにその案件の物件問い合わせが表示されます。各物件カードには商談ステータス・優先度・担当者が表示され、それぞれ個別に編集できます。

### 新しいダイアログ

**案件ステータス変更ダイアログ** は、3つの選択肢（アクティブ / 保留中 / クローズ）だけのシンプルなUIに。

**物件問い合わせ編集ダイアログ** を新設し、商談ステータス（7段階）・優先度・担当者をまとめて編集できます。

```jsx
// 案件のステータス変更（ライフサイクル）
await axios.post(`/api/v1/inquiries/${inquiryId}/change_status`, {
  status: 'on_hold'
});

// 物件問い合わせの商談ステータス変更
await axios.post(`/api/v1/property_inquiries/${piId}/change_deal_status`, {
  deal_status: 'viewing_scheduled',
  reason: null
});
```

### ダッシュボード

ダッシュボードの集計も PropertyInquiry ベースに変更しました。

- **商談ステータス分布** — PropertyInquiry の deal_status でグルーピング
- **優先度別アラート** — 優先度「高」「緊急」の PropertyInquiry を物件名付きで表示
- **今月の成約数** — PropertyInquiry のステータスが「成約」に変わった件数

## 実際の使われ方

### 同じ案件で物件ごとに進捗が違うとき

1. お客様が3物件を検討中 → 1つの案件に3つの PropertyInquiry
2. 物件Aは内見予約済み、物件Bは資料確認中、物件Cは見送り
3. それぞれ独立したステータスで管理 → 「物件Aだけ内見予約」が正確に表現できる
4. 物件Cが失注しても、案件全体はアクティブのまま

### 担当者を物件ごとに分けたいとき

1. 駅近マンションはエリア担当の佐藤さん、郊外の戸建ては田中さんが対応
2. 同じ案件内でも物件ごとに担当者を設定
3. 各担当者は自分の担当物件の問い合わせだけをフィルタリングできる

### 案件の一時停止

1. お客様が「しばらく検討を中断したい」と連絡
2. 案件を「保留中」に → 物件問い合わせの商談ステータスはそのまま保持
3. 再開時に案件を「アクティブ」に戻す → 各物件の進捗がそのまま復元

### 顧客一覧での表示

顧客一覧では、**最新の PropertyInquiry** から商談ステータス・優先度・担当者を取得して表示します。これにより、「この顧客の今の状況」が一目でわかります。

## 設計判断の振り返り

前回 Inquiry に商談管理を持たせたのは間違いだったのでしょうか？

そうではないと考えています。まず Customer → Inquiry → PropertyInquiry という3層構造を作り、その上で実際の業務フローに合わせて「商談管理はどの粒度が自然か？」を検証した結果です。

最初から完璧な設計を目指すより、**動くものを作って使ってみて、フィードバックをもとに改善する**——このアプローチの方が、結果的に良い設計にたどり着けると実感しました。

## まとめ

今回のリファクタリングで、各モデルの役割がより明確になりました。

- **Customer**: 顧客の「人」としての情報
- **Inquiry**: 物件問い合わせをまとめる箱（アクティブ / 保留中 / クローズ）
- **PropertyInquiry**: 物件単位の商談管理（ステータス・優先度・担当者・失注理由）
- **CustomerActivity**: 対応履歴（案件・物件に紐付く）

「案件は箱、商談は物件単位」——この考え方によって、不動産業務の実態により近いデータモデルが実現できました。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2026-01-30 18:00:00')
  post.commit_hash = 'c8bdd61'
end

puts "✓ 記事作成: #{blog_post_25.title}"
