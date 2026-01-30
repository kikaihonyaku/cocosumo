# 記事24: Inquiryモデルの導入 - 1顧客×複数案件の管理へ
blog_post_24 = BlogPost.find_or_create_by!(public_id: 'inquiry-model-restructure-2026') do |post|
  post.title = "1人のお客様に複数の案件を — Inquiryモデルで顧客管理を再設計しました"
  post.summary = "顧客に直接紐付いていた商談ステータスを独立した「案件（Inquiry）」モデルに分離。1人のお客様に対して複数の案件を並行管理できるようになりました。"
  post.content = <<~'MARKDOWN'
## なぜ再設計が必要だったのか

前回ご紹介した顧客管理機能では、**商談ステータス（新規反響→対応中→成約）** を顧客に直接持たせていました。1人のお客様に対して1つのステータス——シンプルで分かりやすい設計です。

しかし、運用を想定していくうちに、2つの課題が見えてきました。

**課題1：1人のお客様が複数回商談するケース**

> 「このお客様、前回の物件は見送りになったけど、今回また別の物件で問い合わせてきた」

前回は失注、今回は商談中——顧客のステータスを1つしか持てないと、どちらに合わせるか悩みます。

**課題2：1つの商談で複数物件を検討するケース**

> 「このお客様、駅近のマンションと郊外の戸建て、両方見たいそうです」

1人のお客様が複数の物件に問い合わせることは日常茶飯事です。それらの問い合わせを**1つの案件としてまとめて管理**し、商談全体の進捗を追いたいというニーズがありました。

これまでの構造では、物件問い合わせ（PropertyInquiry）が顧客に直接ぶら下がっており、「どの問い合わせが同じ商談なのか」をグルーピングする手段がありませんでした。

そこで今回、顧客管理のデータ構造を大きく見直しました。

## Before / After

### Before：顧客に直接ステータスを持つ

```
Customer
├── deal_status（新規反響/対応中/成約/失注...）
├── priority（緊急/高/通常/低）
├── assigned_user（担当者）
├── PropertyInquiry（物件A）
├── PropertyInquiry（物件B）
└── CustomerActivity（対応履歴）
```

この構造では、物件Aが失注で物件Bが商談中のとき、顧客のステータスをどちらに合わせるか悩みます。

### After：案件（Inquiry）を中間に挟む

```
Customer
├── Inquiry（案件1：引っ越し検討）
│   ├── deal_status: 内見予約
│   ├── priority: 高
│   ├── assigned_user: 佐藤
│   ├── PropertyInquiry（〇〇マンション301号）
│   ├── PropertyInquiry（△△ハイツ205号）
│   └── CustomerActivity（案件1の対応履歴）
│
└── Inquiry（案件2：投資物件検討）
    ├── deal_status: 対応中
    ├── PropertyInquiry（□□レジデンス102号）
    └── CustomerActivity（案件2の対応履歴）
```

ポイントは2つあります。

1. **1顧客 × N案件**: 1人のお客様が複数の案件（商談）を持てる
2. **1案件 × N物件問い合わせ**: 1つの案件の中で複数の物件を検討できる

**案件（Inquiry）** という中間レイヤーを設けることで、「この商談ではどの物件を検討しているのか」「この顧客には今いくつの商談が走っているのか」が明確になりました。

## Inquiryモデルの設計

新しく作成した `Inquiry` モデルは、これまで `Customer` が持っていた商談関連の属性を引き受けます。

```ruby
class Inquiry < ApplicationRecord
  belongs_to :tenant
  belongs_to :customer
  belongs_to :assigned_user, class_name: "User", optional: true
  has_many :property_inquiries, dependent: :destroy
  has_many :customer_activities, dependent: :destroy

  enum :deal_status, {
    new_inquiry: 0,      # 新規反響
    contacting: 1,       # 対応中
    viewing_scheduled: 2, # 内見予約
    viewing_done: 3,     # 内見済
    application: 4,      # 申込
    contracted: 5,       # 成約
    lost: 6              # 失注
  }

  enum :priority, {
    low: 0, normal: 1, high: 2, urgent: 3
  }
end
```

### ステータス変更は履歴付き

案件のステータスを変更すると、自動的に対応履歴（CustomerActivity）が記録されます。

```ruby
def change_deal_status!(new_status, user: nil, reason: nil)
  old_status = deal_status
  self.deal_status = new_status
  self.lost_reason = reason if new_status.to_s == "lost"
  save!

  customer_activities.create!(
    customer: customer,
    user: user,
    activity_type: :status_change,
    direction: :internal,
    subject: "#{deal_status_label}に変更"
  )
end
```

「誰がいつステータスを変えたか」が案件単位で追跡できます。

## 既存モデルへの影響

### Customerモデル — スリムに

`Customer` から以下のカラムを削除しました。

| 削除したカラム | 移動先 |
|---------------|--------|
| deal_status | Inquiry |
| deal_status_changed_at | Inquiry |
| priority | Inquiry |
| assigned_user_id | Inquiry |
| lost_reason | Inquiry |

Customer は顧客の「人」としての情報（名前、メール、電話）に集中し、商談の進捗は Inquiry が管理します。

現在の商談状況を知りたいときは、最新の案件から取得します。

```ruby
class Customer < ApplicationRecord
  has_many :inquiries, dependent: :destroy

  def current_deal_status
    inquiries.order(created_at: :desc).first&.deal_status
  end
end
```

### PropertyInquiry — 案件に紐付く

物件への問い合わせ（PropertyInquiry）は、必ず案件（Inquiry）に紐付くようになりました。1つの案件が複数の物件問い合わせを束ねます。

```ruby
class PropertyInquiry < ApplicationRecord
  belongs_to :inquiry  # 新規追加（必須）
  belongs_to :customer
  belongs_to :room
end
```

公開ページからの問い合わせフォーム送信時には、同じ顧客の既存案件がなければ Inquiry が自動作成され、PropertyInquiry がその案件に紐付きます。顧客詳細画面から手動で案件に物件を追加することも可能です。

### CustomerActivity — 案件ごとの履歴

対応履歴も案件に紐付きます。これにより、「案件1の履歴」「案件2の履歴」を分けて表示できます。

```ruby
class CustomerActivity < ApplicationRecord
  belongs_to :inquiry    # 新規追加（必須）
  belongs_to :customer
end
```

## API の変更

### 新しいエンドポイント

案件管理用の RESTful API を新設しました。

```
GET    /api/v1/inquiries          # 案件一覧（フィルター対応）
GET    /api/v1/inquiries/:id      # 案件詳細（物件・履歴含む）
POST   /api/v1/inquiries          # 案件作成
PATCH  /api/v1/inquiries/:id      # 案件更新
POST   /api/v1/inquiries/:id/change_status  # ステータス変更
```

一覧 API では、ステータス・優先度・担当者・顧客でのフィルタリングとページネーションに対応しています。

### ルート名の変更

既存の物件問い合わせ API は、案件 API との混同を避けるためパスを変更しました。

| Before | After |
|--------|-------|
| `/api/v1/inquiries` | `/api/v1/property_inquiries` |

フロントエンドの呼び出し箇所もすべて更新しています。

## フロントエンドの変更

### 顧客詳細画面 — 案件単位の階層表示

顧客詳細画面の右ペインは、案件（Inquiry）を起点とした階層表示に変わりました。

```
┌──────────────────────────────────┐
│ 案件1: [対応中]  優先度: 高      │
│ 担当: 佐藤                       │
│ ├─ 〇〇マンション 301号          │
│ │   資料請求 / SUUMO             │
│ └─ △△ハイツ 205号               │
│     来場予約 / 自社HP            │
│ [ステータス変更] [履歴追加]      │
├──────────────────────────────────┤
│ 案件2: [失注]  優先度: 通常      │
│ 担当: 田中                       │
│ └─ □□レジデンス 102号           │
│     資料請求 / at home           │
│ 失注理由: 他社で成約             │
└──────────────────────────────────┘
```

1つの案件に複数の物件問い合わせがぶら下がる構造が、視覚的にも分かりやすくなっています。

### ステータス変更ダイアログ

ステータス変更は案件単位で行います。API の呼び出し先も変更されました。

```jsx
// Before: 顧客のステータスを変更
await api.post(`/api/v1/customers/${customerId}/change_status`, data);

// After: 案件のステータスを変更
await api.post(`/api/v1/inquiries/${inquiryId}/change_status`, data);
```

### 対応履歴ダイアログ

履歴追加時に「どの案件に対する履歴か」を選択できるようになりました。案件が1つだけなら自動選択されます。

## マイグレーション戦略

今回の変更は27ファイル、845行の追加・558行の削除という大規模なリファクタリングでした。

マイグレーションは以下の順序で実行しています。

1. **データ削除** — rake タスクで既存の問い合わせ関連データをクリーンアップ
2. **inquiries テーブル作成** — 新規テーブル
3. **FK 追加** — PropertyInquiry, CustomerActivity, CustomerAccess に `inquiry_id` を追加
4. **不要カラム削除** — Customer から商談関連カラムを削除、PropertyInquiry から `assigned_user_id` を削除

既存データを全削除してからスキーマ変更を行うことで、NOT NULL 制約を安全に追加できました。開発段階だからこそ取れるアプローチです。

```ruby
# lib/tasks/cleanup_inquiry_data.rake
namespace :inquiry do
  task cleanup: :environment do
    ActiveRecord::Base.transaction do
      CustomerActivity.delete_all
      CustomerRoute.delete_all
      CustomerAccess.delete_all
      PropertyInquiry.delete_all
      Customer.delete_all
    end
  end
end
```

## 実際の使われ方

### 同じお客様から再度問い合わせがあったとき

1. 新しい問い合わせが届く
2. 既存顧客にマッチ → 新しい **案件（Inquiry）** が自動作成
3. 過去の案件（失注）と新しい案件（新規反響）が並んで表示される
4. 過去の対応履歴を参考に、より適切な提案ができる

### 1つの案件で複数物件を検討中のお客様

1. お客様が「駅近マンション」と「郊外の戸建て」の両方に問い合わせ
2. 同じ案件（Inquiry）に2つの PropertyInquiry が紐付く
3. 案件のステータスは「内見予約」——まとめて内見の日程を調整
4. 案件のメモに「ファミリー向け希望、予算〇〇万円」と記録

### 別々の案件として管理したいお客様

1. 同じお客様が「自宅用」と「投資用」で別々に物件を探している
2. それぞれ別の案件（Inquiry）として作成
3. 「自宅用」は成約、「投資用」はまだ対応中——ステータスが独立
4. 担当者も案件ごとに別の人をアサインできる

### ダッシュボードでの営業状況把握

ダッシュボードの集計も Inquiry ベースに変更しました。

- **アクティブ案件数** — 成約・失注以外の案件をカウント
- **今月の成約数** — Inquiry のステータスが「成約」に変わった件数
- **優先度別アラート** — 優先度「高」「緊急」の案件を表示

### チーム内での案件引き継ぎ

担当者（assigned_user）が案件に紐付いているため、担当変更も案件単位。別の案件は別の担当者が持つことも可能です。

## まとめ

今回の再設計で、CoCoスモの顧客管理は **「1顧客 = 1ステータス」から「1顧客 × N案件 × N物件」** へと進化しました。

- **Customer**: 顧客の「人」としての情報に集中
- **Inquiry**: 案件（商談）単位で進捗・担当者・優先度を管理
- **PropertyInquiry**: 案件に紐付く物件単位の問い合わせ（1案件に複数可）
- **CustomerActivity**: 案件ごとの対応履歴

「この案件では3物件を検討中」「このお客様には2つの案件が走っている」——データ構造が業務の実態に近づいたことで、より自然な顧客対応フローが実現できます。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2026-01-29 18:00:00')
  post.commit_hash = '049b7cc'
end

puts "✓ 記事作成: #{blog_post_24.title}"
