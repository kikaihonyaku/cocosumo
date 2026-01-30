# 記事20: 顧客管理機能
blog_post_20 = BlogPost.find_or_create_by!(public_id: 'customer-management-2026') do |post|
  post.title = "反響から成約まで一元管理！顧客管理機能をリリースしました"
  post.summary = "問い合わせから顧客アクセス発行、対応履歴、商談ステータスまで、顧客対応の流れを一画面で管理できるようになりました。"
  post.content = <<~'MARKDOWN'
## なぜこの機能を作ったのか

不動産仲介業務では、**複数の物件に問い合わせをするお客様**が珍しくありません。

> 「この方、先週も別の物件で問い合わせてきた方だ」
> 「前回の内見で何を話したっけ...」
> 「このお客様、今どこまで進んでるんだっけ？」

これまでのCoCoスモでは、問い合わせと顧客アクセスが物件単位で管理されており、**同じお客様の対応履歴を横断的に把握する**のが難しい状況でした。

そこで今回、**顧客を軸にした管理機能**を実装しました。

## どんな機能？

### 1. 顧客の自動統合

同じメールアドレスで複数物件に問い合わせがあった場合、**自動的に1人の顧客として統合**されます。

```ruby
# 問い合わせ作成時に顧客を自動リンク
def link_or_create_customer
  tenant = property_publication.room.building.tenant
  self.customer = Customer.find_or_initialize_by_contact(
    tenant: tenant,
    email: email,
    name: name,
    phone: phone
  )
  customer.save! if customer.new_record?
end
```

手動で顧客を紐付ける必要はありません。問い合わせが来るたびに、既存顧客かどうかを自動判定します。

### 2. 顧客一覧画面

テナント内のすべての顧客を一覧表示。問い合わせ件数、発行済みアクセス権数、最終連絡日などが一目でわかります。

**フィルター機能**も充実：
- 商談ステータス（新規反響/対応中/内見予約/内見済/申込/成約/失注）
- 優先度（緊急/高/通常/低）
- 顧客状態（アクティブ/アーカイブ）
- フリーワード検索（名前、メール、電話番号）

### 3. 顧客詳細画面（3カラムレイアウト）

顧客に関する情報を**3カラム**で効率的に表示。各カラムはドラッグで幅を調整可能です。

| 左カラム | 中央カラム | 右カラム |
|----------|------------|----------|
| 顧客情報 | 対応履歴タイムライン | 問い合わせ/アクセス権タブ |
| 連絡先 | 電話、メール、来店... | 物件ごとの履歴 |
| メモ | ステータス変更履歴 | 詳細ページへのリンク |

### 4. 対応履歴（アクティビティ）

顧客との接点を時系列で記録・表示します。

```ruby
enum :activity_type, {
  note: 0,           # メモ
  phone_call: 1,     # 電話
  email: 2,          # メール
  visit: 3,          # 来店
  viewing: 4,        # 内見
  inquiry: 5,        # 問い合わせ（自動記録）
  access_issued: 6,  # アクセス発行（自動記録）
  status_change: 7,  # ステータス変更（自動記録）
  line_message: 8    # LINEメッセージ
}
```

**自動記録されるイベント：**
- 問い合わせ受信
- 顧客アクセス発行
- 商談ステータス変更

**手動で追加できるイベント：**
- 電話（発信/着信）
- メール送受信
- 来店対応
- 内見実施
- 社内メモ

### 5. 商談ステータス管理

お客様の検討状況を7段階で管理できます。

```
新規反響 → 対応中 → 内見予約 → 内見済 → 申込 → 成約
                                          ↓
                                        失注
```

ステータス変更時には理由やメモを記録でき、履歴として残ります。

```jsx
// ステータス変更ダイアログ
<StatusChangeDialog
  currentStatus={customer.deal_status}
  onChanged={() => {
    loadActivities();
    loadCustomer();
  }}
/>
```

### 6. 優先度設定

急ぎの対応が必要なお客様には優先度を設定。一覧画面でアイコン表示されるので、見落としを防げます。

- 🔴 **緊急** - すぐに対応が必要
- 🟡 **高** - 優先的に対応
- ⚪ **通常** - 通常対応
- ⚪ **低** - 時間があるときに

## 技術的なこだわり

### リサイズ可能な3カラムレイアウト

マウスドラッグでカラム幅を調整できるUIを実装。RoomDetailやBuildingDetailと同じパターンで、一貫した操作感を実現しています。

```jsx
const [leftPaneWidth, setLeftPaneWidth] = useState(280);
const [rightPaneWidth, setRightPaneWidth] = useState(380);

// スプリッター
<Box
  onMouseDown={handleLeftMouseDown}
  sx={{
    width: 8,
    cursor: 'col-resize',
    '&:hover': { bgcolor: 'action.hover' }
  }}
/>
```

### URLパラメータによるタブ遷移

顧客詳細から問い合わせやアクセス権の詳細に遷移する際、**直接該当タブを開く**ことができます。

```jsx
// 問い合わせタブを直接開く
to={`/room/${roomId}/property-publication/${id}/edit?tab=inquiries`}

// 顧客アクセスタブを直接開く
to={`/room/${roomId}/property-publication/${id}/edit?tab=access`}
```

PropertyPublicationEditorでURLパラメータを読み取り、初期タブを設定：

```jsx
const getInitialTab = () => {
  const tabParam = searchParams.get('tab');
  switch (tabParam) {
    case 'access': return 5;
    case 'inquiries': return 6;
    default: return 0;
  }
};
```

### 最終連絡日の自動更新

顧客との接触があった場合、`last_contacted_at`を自動更新。一覧画面で「しばらく連絡していない顧客」を把握しやすくなります。

```ruby
def update_customer_last_contacted
  if activity_type_phone_call? || activity_type_email? ||
     activity_type_visit? || activity_type_viewing?
    customer.update_column(:last_contacted_at, created_at)
  end
end
```

## 実際の使われ方

### 反響を受けたとき

1. 問い合わせメールが届く
2. 顧客レコードが自動作成（または既存顧客に紐付け）
3. 対応履歴に「問い合わせ」が自動記録
4. 営業担当が顧客詳細を開き、過去の対応履歴を確認
5. 電話やメールで対応し、履歴を追加

### 内見の調整

1. 顧客一覧で「対応中」のお客様をフィルター
2. 顧客詳細で問い合わせ物件を確認
3. 内見日程を調整し、ステータスを「内見予約」に変更
4. 内見実施後、履歴に記録して「内見済」に更新

### 商談状況の把握

1. 顧客一覧で商談ステータスをフィルター
2. 「内見済」のまま停滞している顧客を発見
3. 対応履歴を確認し、フォローアップの電話
4. 進展があれば「申込」にステータス変更

### 失注分析

1. 顧客一覧で「失注」をフィルター
2. 失注理由（他社で成約、条件不一致など）を確認
3. 傾向を分析して営業戦略に活用

## 今後の展望

### LINE連携

`line_user_id`カラムはすでに用意されています。LINE公式アカウントとの連携で、LINEでの問い合わせも同じ顧客として統合する予定です。

### 担当者アサイン

`assigned_user_id`で担当者を設定し、担当案件の管理や引き継ぎをスムーズに。

### 自動フォローアップ通知

「内見済みから3日経過」「最終連絡から1週間」などの条件で、自動的にリマインドする機能を検討中。

### 顧客のセグメント分け

タグやラベル機能で、顧客をカテゴリ分けできるようにする予定です。

## まとめ

**反響から成約まで、顧客対応の流れを一画面で把握**できるようになりました。

- 問い合わせから顧客を自動統合
- 対応履歴をタイムラインで可視化
- 商談ステータスで進捗管理
- 優先度設定で見落とし防止
- 3カラムレイアウトで情報を効率的に表示

「このお客様、前回何を話したっけ？」がなくなり、スムーズな顧客対応を実現します。

ぜひ、サイドメニューの「顧客管理」からお試しください。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2026-01-10 18:00:00')
  post.commit_hash = 'ffe1e36'
end

puts "✓ 記事作成: #{blog_post_20.title}"
