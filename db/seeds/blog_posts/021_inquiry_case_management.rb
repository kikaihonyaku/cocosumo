# 記事21: 案件管理の進化 - 反響対応をもっとスムーズに
blog_post_21 = BlogPost.find_or_create_by!(public_id: 'inquiry-case-management-2026') do |post|
  post.title = "案件管理の進化 - 反響対応をもっとスムーズに"
  post.summary = "「問い合わせ」から「案件」へ。反響対応の流れを一気通貫で管理できるようになりました。"
  post.content = <<~'MARKDOWN'
昨日の記事で顧客管理機能をご紹介しました。今日はその続きとして、**反響対応をもっとスムーズにする**ための機能強化についてお話しします。

## なぜ「案件」という概念が必要だったのか

不動産の反響対応には、こんな課題がありました。

> 「SUUMOからの問い合わせと、自社HPからの問い合わせ、どっちが多いんだろう？」

> 「この物件、公開ページを作る前にお客様から直接問い合わせがあったんだけど、どう記録すれば...」

> 「担当者を変更したとき、いつ誰が変更したか分からなくなる」

これまでの「問い合わせ」機能は、公開ページからの反響を受け取るためのものでした。でも実際の業務では、**様々なチャネルからの反響を統合的に管理**したいというニーズがあったのです。

## 「問い合わせ」から「案件」へ

PropertyInquiry（問い合わせ）モデルを「案件」として再定義しました。

### 追加された属性

| 属性 | 説明 |
|------|------|
| room_id | 物件（必須） - 公開ページがなくても登録可能に |
| assigned_user | 担当者 |
| media_type | 媒体（SUUMO、at home、自社HP、LINE等） |
| origin_type | 発生元（資料請求、来場予約、提案等） |
| status | 状態（未対応、対応中、完了） |

### 媒体（media_type）

どこから反響が来たかを記録できます。

```ruby
enum :media_type, {
  suumo: 0,        # SUUMO
  athome: 1,       # at home
  homes: 2,        # HOMES
  lifull: 3,       # LIFULL
  own_website: 10, # 自社HP
  line: 11,        # LINE
  phone: 12,       # 電話
  walk_in: 13,     # 飛び込み
  referral: 14,    # 紹介
  other_media: 99  # その他
}
```

### 発生元（origin_type）

お客様が何を求めているかを分類できます。

```ruby
enum :origin_type, {
  document_request: 0,   # 資料請求
  visit_reservation: 1,  # 来場予約
  general_inquiry: 2,    # その他問い合わせ
  staff_proposal: 10,    # 提案（スタッフ作成）
  other_origin: 99       # その他
}
```

「提案」は、スタッフが能動的にお客様に物件を提案するケースです。反響を待つだけでなく、こちらからアプローチした案件も記録できます。

## 顧客詳細画面からの操作

顧客詳細画面の右ペインで、案件に対する操作が完結するようになりました。

### ステータス変更

案件カードのステータスチップをクリックすると、その場でステータスを変更できます。

```
┌─────────────────────────────────┐
│ 〇〇マンション 101号            │
│ [未対応] ← クリックで変更      │
│ 資料請求 | SUUMO               │
│ 担当: 未設定 ← クリックで設定  │
│ 2026/01/11 14:30   [履歴追加]  │
└─────────────────────────────────┘
```

選べるステータス：
- 🔴 **未対応** - まだ対応していない
- 🟡 **対応中** - 対応を進めている
- 🟢 **完了** - 対応完了

### 担当者変更

「担当: 未設定」をクリックすると、担当者を選択できます。同じテナントのユーザー一覧から選択。

### 履歴追加

各案件カードに「履歴追加」ボタンを追加しました。クリックすると、**その案件に紐づいた対応履歴**を追加できます。

```jsx
<Button
  onClick={(e) => {
    e.stopPropagation();
    setSelectedInquiryId(inquiry.id);
    setActivityDialogOpen(true);
  }}
>
  履歴追加
</Button>
```

## 対応履歴の自動記録

**これが今回の目玉機能です。**

案件に対する重要な操作は、すべて対応履歴として自動的に記録されます。

### 自動記録されるイベント

| イベント | アクティビティタイプ | 例 |
|----------|---------------------|-----|
| 案件作成 | inquiry | 「資料請求（SUUMO）」 |
| ステータス変更 | status_change | 「案件ステータスを『対応中』に変更」 |
| 担当者変更 | assigned_user_change | 「担当者を『佐藤』に変更」 |

### 実装のポイント

PropertyInquiryモデルにコールバックを追加しています。

```ruby
class PropertyInquiry < ApplicationRecord
  # 変更者を追跡するための一時属性
  attr_accessor :changed_by

  # コールバック
  after_create :record_inquiry_activity
  after_update :record_status_change_activity, if: :saved_change_to_status?
  after_update :record_assigned_user_change_activity, if: :saved_change_to_assigned_user_id?

  private

  def record_status_change_activity
    old_status, new_status = saved_change_to_status
    old_label = I18n.t("activerecord.enums.property_inquiry.status.#{old_status}")
    new_label = status_label

    customer_activities.create!(
      customer: customer,
      user: changed_by,
      activity_type: :status_change,
      direction: :internal,
      subject: "案件ステータスを「#{new_label}」に変更",
      content: "#{property_title}：#{old_label} → #{new_label}"
    )
  end
end
```

コントローラーでは、更新前に `changed_by` を設定します。

```ruby
def update
  @inquiry.changed_by = current_user
  @inquiry.update(update_params)
end
```

これにより、**誰がいつ何を変更したか**が自動的に対応履歴に残ります。

## 案件作成の改善

顧客詳細画面のヘッダーに、目立つ「案件作成」ボタンを配置しました。

```jsx
<Button
  variant="contained"
  color="primary"
  startIcon={<AddIcon />}
  onClick={() => setCreateInquiryDialogOpen(true)}
>
  案件作成
</Button>
```

案件作成ダイアログでは：

1. **物件を検索** - 建物名・部屋番号で検索
2. **発生元を選択** - 資料請求、来場予約、提案など
3. **媒体を選択** - SUUMO、at home、自社HPなど
4. **担当者を設定**（任意）
5. **メモを入力**（任意）

公開ページがない物件でも、部屋単位で案件を作成できます。

## 問い合わせ管理画面の改善

管理者向けの問い合わせ一覧画面も改善しました。

### フィルタリング

- **ステータス** - 未対応/対応中/完了
- **担当者** - 担当者で絞り込み
- **顧客** - 顧客名で検索

### モーダルダイアログ

詳細を見るときは、モーダルダイアログで表示。一覧を離れずに確認できます。

### 「次へ/前へ」ナビゲーション

フィルタリングした結果の中で、前後の案件に移動できます。

```jsx
<Button onClick={() => navigateToInquiry(currentIndex - 1)}>
  前へ
</Button>
<Typography>
  {currentIndex + 1} / {filteredInquiries.length}
</Typography>
<Button onClick={() => navigateToInquiry(currentIndex + 1)}>
  次へ
</Button>
```

### 顧客情報へのリンク

「顧客情報を見る」ボタンで、顧客詳細画面に遷移。対応履歴の追加や商談ステータスの変更は顧客詳細画面で行います。

## 実際の使われ方

### SUUMOから反響があったとき

1. 問い合わせが届き、案件が自動作成
2. 対応履歴に「資料請求（SUUMO）」と自動記録
3. 顧客詳細で案件カードを確認
4. ステータスを「対応中」に変更 → 履歴に自動記録
5. 担当者を設定 → 履歴に自動記録
6. 電話対応 → 「履歴追加」で手動記録

### 自社HPからの問い合わせ

1. 案件が自動作成（媒体: 自社HP）
2. 発生元が「来場予約」なら、すぐに日程調整
3. ステータス変更を重ねながら対応を進める
4. すべての変更履歴が時系列で残る

### 飛び込み対応

1. 顧客詳細から「案件作成」をクリック
2. 物件を検索して選択
3. 発生元「その他」、媒体「飛び込み」を選択
4. その場で担当者を設定
5. 対応内容を「履歴追加」で記録

### 月次レポート

1. 問い合わせ管理画面でCSVエクスポート
2. 媒体別の反響数を集計
3. ステータス別の進捗を確認
4. 担当者別の対応件数を把握

## まとめ

**反響対応のすべてが、対応履歴として残る**ようになりました。

- 案件の作成・変更が自動で履歴に記録
- 「誰がいつ何をしたか」が一目で分かる
- 顧客詳細画面から全ての操作が完結
- 公開ページがなくても案件を作成可能

「あれ、この案件どうなってたっけ？」と履歴を遡れば、すぐに状況が把握できます。

次回は、この案件データを使った分析機能についてご紹介する予定です。お楽しみに。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2026-01-11 18:00:00')
  post.commit_hash = 'c5c1a8b'
end

puts "✓ 記事作成: #{blog_post_21.title}"
