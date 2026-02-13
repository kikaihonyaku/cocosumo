# 記事34: 未読通知システム — 「気づかなかった」をゼロにする
blog_post_34 = BlogPost.find_or_create_by!(public_id: 'unread-notifications-2026') do |post|
  post.title = "未読通知システムを実装 — 案件単位×ユーザー別の軽量な既読管理で「気づかなかった」をゼロにする"
  post.summary = "メール反響やLINE問い合わせの見落としを防ぐため、案件ごと×ユーザーごとにlast_read_atを記録する軽量な未読管理を導入。担当者ベースの通知ターゲティング、30秒ポーリング、ブラウザ通知、ヘッダーバッジで「気づかなかった」を解消します。"
  post.content = <<~'MARKDOWN'
## はじめに — 「あの反響、誰か見ましたか？」

不動産の営業現場で、こんなやり取りが起きていませんか？

> 「昨日SUUMOから反響が来ていたんですけど、誰か対応しましたか？」
> 「LINEで問い合わせがあったの、気づきませんでした…」
> 「え、3日前のメール、まだ返信してなかったの？」

CoCoスモには `CustomerActivity` で顧客とのすべてのやり取りを記録する仕組みがありますが、**スタッフがそれに気づく仕組み**がありませんでした。管理画面を開かない限り、新しい反響が来ていることすら分からない——これは不動産営業にとって致命的な問題です。

反響への初動対応のスピードは、成約率に直結します。今回、この「気づかなかった」問題を根本から解決する **未読通知システム** を実装しました。

## どんな機能？

### ヘッダーのベルアイコンで一目瞭然

ログインすると、ヘッダー右上にベルアイコンが表示されます。未読の問い合わせがあれば、赤いバッジで件数が表示されます。

ベルアイコンをクリックすると、未読案件の一覧がドロップダウンで表示されます。各アイテムには以下の情報が含まれます。

- **顧客名** — 誰からの問い合わせか
- **アクティビティ種別アイコン** — LINE（緑）、メール（青）、問い合わせ（黄）
- **最新メッセージのプレビュー** — 内容を確認してから詳細へ
- **経過時間** — 「5分前」「3時間前」「2日前」のような相対表示
- **担当者・ステータス** — 案件の現状を一目で把握

クリックすると顧客詳細ページへ遷移し、自動的に既読になります。

### 問い合わせ管理画面でも未読が分かる

問い合わせ管理画面（InquiryManager）でも、未読の案件には**青いドット**と**太字テキスト**で視覚的にインジケータが表示されます。モバイルでは左端に青いボーダーラインが付きます。

### ブラウザ通知で見逃し防止

タブがバックグラウンドにある時に新しい未読が検出されると、OSのブラウザ通知で知らせます。別のタブで作業していても、反響を見逃しません。

### 自動既読で手間いらず

以下のアクションを取ると、その案件は自動的に既読になります。

| アクション | 場所 |
|-----------|------|
| 案件詳細を表示 | 案件管理画面 |
| 問い合わせに返信 | 問い合わせ詳細 |
| LINEメッセージを送信 | 顧客詳細画面 |
| アクティビティ一覧を閲覧 | 顧客詳細画面 |

## 設計のこだわり — 「軽量」と「的確」の両立

### なぜ「案件×ユーザー」の last_read_at 方式なのか

未読管理のアプローチは大きく2つあります。

**方式A: アクティビティ個別既読方式**

各 `CustomerActivity` レコードに対してユーザーごとの既読フラグを管理する方法です。

```
activity_read_statuses テーブル
= activity_id × user_id × read_at
= 行数: アクティビティ数 × ユーザー数 → 数万〜数十万行
```

正確ですが、テーブルが膨大になり、集計クエリも重くなります。

**方式B: 案件単位の last_read_at 方式（今回採用）**

案件（Inquiry）ごとに「このユーザーが最後に確認した時刻」だけを記録します。

```
inquiry_read_statuses テーブル
= user_id × inquiry_id × last_read_at
= 行数: 最大でもユーザー数 × 案件数 → 数百〜数千行
```

未読判定は「その案件の最新受信アクティビティの時刻 > ユーザーの last_read_at」というシンプルな比較です。テーブルサイズが桁違いに小さく、30秒ごとのポーリングにも耐えられます。

### 担当者ベースの通知ターゲティング

複数の従業員が使うシステムで、全員に全案件の通知を出すとノイズだらけになります。かといって、担当者だけに通知すると、新規の問い合わせ（まだ誰も担当していない）が見落とされます。

そこで、以下のルールを設けました。

| 案件の状態 | 通知先 |
|-----------|--------|
| 担当者なし | テナント内の全アクティブユーザー |
| 担当者あり | 担当者のみ |
| admin / super_admin | 常に全案件を確認可能 |

これにより、「新規問い合わせ → 全員に見える → 誰かが担当に入る → 以後その人だけに通知」という自然なワークフローが実現します。

## 技術的な詳細

### データベース設計

```ruby
# db/migrate/20260214100001_create_inquiry_read_statuses.rb
create_table :inquiry_read_statuses do |t|
  t.references :user, null: false, foreign_key: true
  t.references :inquiry, null: false, foreign_key: true
  t.datetime :last_read_at, null: false
  t.timestamps
end
add_index :inquiry_read_statuses,
          [:user_id, :inquiry_id],
          unique: true
```

ユニークインデックスにより、UPSERT（INSERT ON CONFLICT UPDATE）で安全に既読を更新できます。

### UPSERT による既読マーク

```ruby
class InquiryReadStatus < ApplicationRecord
  def self.mark_as_read!(user:, inquiry:)
    upsert(
      { user_id: user.id,
        inquiry_id: inquiry.id,
        last_read_at: Time.current },
      unique_by: [:user_id, :inquiry_id]
    )
  end

  def self.mark_all_as_read!(user:, inquiry_ids:)
    return if inquiry_ids.blank?

    now = Time.current
    records = inquiry_ids.map do |inquiry_id|
      { user_id: user.id,
        inquiry_id: inquiry_id,
        last_read_at: now }
    end

    upsert_all(records, unique_by: [:user_id, :inquiry_id])
  end
end
```

Rails の `upsert` / `upsert_all` を活用し、レコードが存在しなければ INSERT、存在すれば `last_read_at` を UPDATE します。個別のSELECTが不要なため、高速です。

### 未読判定の SQL

未読案件の取得は、サブクエリとLEFT JOINを組み合わせた1クエリで実現しています。

```ruby
class UnreadInquiryService
  INBOUND_ACTIVITY_TYPES = %w[line_message email inquiry].freeze

  def unread_count
    unread_base_query.count
  end

  private

  def unread_base_query
    target_inquiry_scope
      .joins(<<~SQL)
        INNER JOIN (
          SELECT inquiry_id,
                 MAX(created_at) AS last_inbound_at
          FROM customer_activities
          WHERE activity_type IN (8, 2, 5)
            AND direction = 2
          GROUP BY inquiry_id
        ) AS latest_inbound
          ON latest_inbound.inquiry_id = inquiries.id
      SQL
      .joins(<<~SQL)
        LEFT JOIN inquiry_read_statuses
          ON inquiry_read_statuses.inquiry_id = inquiries.id
          AND inquiry_read_statuses.user_id = #{@user.id}
      SQL
      .where(<<~SQL)
        inquiry_read_statuses.last_read_at IS NULL
        OR latest_inbound.last_inbound_at
           > inquiry_read_statuses.last_read_at
      SQL
  end
end
```

ポイントは以下の3つです。

1. **INNER JOIN でサブクエリを結合** — 受信アクティビティが1件もない案件は対象外
2. **LEFT JOIN で既読状態を結合** — まだ一度も閲覧していない案件は `last_read_at IS NULL` で未読判定
3. **direction = inbound のみ対象** — 自分が送信したメッセージでは未読にならない

### フロントエンドのポーリング

```javascript
// useUnreadNotifications.js
const POLLING_INTERVAL = 30000; // 30秒

export default function useUnreadNotifications({ enabled = true } = {}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const prevCountRef = useRef(0);

  const fetchCount = useCallback(async () => {
    const res = await axios.get('/api/v1/unread_notifications/count');
    const newCount = res.data.unread_count;

    // 新しい未読 → バックグラウンド時はブラウザ通知
    if (newCount > prevCountRef.current && document.hidden) {
      browserNotification.show('CoCoスモ', {
        body: `${newCount - prevCountRef.current}件の新しい問い合わせがあります`,
        tag: 'unread-inquiry'
      });
    }

    prevCountRef.current = newCount;
    setUnreadCount(newCount);
  }, [enabled]);

  // 30秒ポーリング + タブ復帰時に即リフレッシュ
  useEffect(() => {
    fetchCount();
    const timer = setInterval(fetchCount, POLLING_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchCount]);

  useEffect(() => {
    const handler = () => { if (!document.hidden) fetchCount(); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [fetchCount]);

  // ...
}
```

ポーリング間隔は30秒に設定しています。`/count` エンドポイントは件数のみを返す軽量なAPIのため、サーバー負荷は最小限です。さらに、`visibilitychange` イベントでタブに戻った瞬間に即座に最新状態を取得します。

## 実際の使われ方

### ケース1: 朝の出勤時チェック

出社してCoCoスモにログインすると、ヘッダーのベルアイコンに「3」のバッジが。昨夜のうちにSUUMOから2件、LINEで1件の問い合わせが来ていたことが一目で分かります。ドロップダウンで内容をざっと確認し、優先度の高いものから対応開始。

### ケース2: 担当者割り当て後のフォーカス

新規問い合わせは全スタッフに表示されますが、上司が「この案件は山田さん担当ね」と割り当てると、以降は山田さんのベルだけに通知が来ます。他のメンバーは自分の案件に集中できます。

### ケース3: 顧客対応中の自動既読

顧客詳細画面を開いてアクティビティ一覧を確認すると、自動的にその案件は既読に。返信メールを送った時点でも既読になるので、わざわざ「既読にする」ボタンを押す必要はありません。

### ケース4: 外出中のブラウザ通知

別タブで物件情報を編集している最中に、LINEで新しいメッセージが。ブラウザ通知で「1件の新しい問い合わせがあります」と知らされるので、すぐに確認できます。

## API エンドポイント

| メソッド | パス | 用途 |
|---------|------|------|
| GET | `/api/v1/unread_notifications/count` | 未読件数のみ（ポーリング用） |
| GET | `/api/v1/unread_notifications` | 未読案件の一覧（ドロップダウン用） |
| POST | `/api/v1/unread_notifications/mark_read` | 特定案件を既読にする |
| POST | `/api/v1/unread_notifications/mark_all_read` | 全件既読にする |

ポーリング用の `/count` は件数だけを返す軽量レスポンスなので、30秒間隔でも負荷は気になりません。ドロップダウンを開いた時だけ `/index` で詳細を取得する設計です。

## 今後の展望

現在は30秒ポーリングですが、将来的には **ActionCable（WebSocket）** を導入して、反響が来た瞬間にリアルタイム通知する仕組みに進化させる計画です。

また、通知の種類を拡張して、以下のようなイベントも通知対象にできると考えています。

- 顧客マイページでの物件閲覧（ホットリードの検知）
- AIシミュレーションの利用（顧客の関心度が高い証拠）
- アクセス権の有効期限切れ間近

## まとめ

不動産業界では「いかに早く反響に対応するか」が成約率を左右します。今回の未読通知システムにより、メールやLINEで入ってきた問い合わせを**見落としなく、素早く**対応できるようになりました。

「案件×ユーザーの last_read_at」というシンプルな設計で軽量さを保ちつつ、担当者ベースのターゲティングで必要な人にだけ通知が届く——現場のワークフローに自然に溶け込む仕組みを目指しました。

もう「あの反響、誰か見ましたか？」という会話は、過去のものになるはずです。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2026-02-14 18:00:00')
  post.commit_hash = '8d5d6a4b'
end

puts "✓ 記事作成: #{blog_post_34.title}"
