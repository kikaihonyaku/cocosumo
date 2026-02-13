# 記事35: メール開封追跡 + LINE クリック追跡 — 「送ったけど見てもらえたのか」を可視化する
blog_post_35 = BlogPost.find_or_create_by!(public_id: 'email-line-tracking-2026') do |post|
  post.title = "メール開封追跡 + LINE クリック追跡を実装 — SendGrid Webhook とトラッキングリンクで「反応」を可視化する"
  post.summary = "SendGrid Event Webhook でメールの配信・開封・クリック・バウンスを追跡し、LINE Flex Message のリンクにトラッキング URL を挿入してクリックを追跡する機能を実装しました。対応履歴のチャットビュー・タイムライン・詳細ダイアログに配信状況をリアルタイム表示します。"
  post.content = <<~'MARKDOWN'
## はじめに — 「送ったけど、見てもらえたのかな…」

不動産営業で、こんな不安を感じたことはありませんか？

> 「お客様にメールを送ったけど、開封されたのかな？」
> 「LINEで物件カードを送ったけど、リンクをタップしてくれたかな？」
> 「返信がないのは興味がないから？それともメールが届いていない？」

CoCoスモでは対応履歴にメール・LINEの送受信を記録していましたが、**送った後の反応**は把握できませんでした。メールが実際に届いたのか、開封されたのか、物件リンクをクリックしたのか——この「送信後のブラックボックス」を解消するため、メール開封追跡とLINEクリック追跡を実装しました。

## どんな機能？

### メール：配信 → 開封 → クリックの3段階を追跡

SendGrid の Event Webhook を活用し、メール送信後の状態遷移をリアルタイムに追跡します。

| ステータス | 意味 | 表示 |
|:---|:---|:---|
| ✓ 配信済み | メールサーバーに到達 | グレーのチェック |
| 👁 開封 | メール本文が表示された | 開封回数つき |
| 🔗 クリック | 本文中のリンクがクリックされた | クリック回数つき |
| ⚠ 配信失敗 | バウンスまたはドロップ | 赤色でエラー理由表示 |

開封は**回数**も記録されるため、「3回開封された = 何度も見返している = 関心が高い」といった判断材料になります。

### LINE：物件カードのリンククリックを追跡

LINEの仕様上、メッセージの既読情報はAPI経由で取得できません。そこで、Flex Message（物件カード）の「詳細を見る」ボタンに**トラッキングリンク**を挟み、お客様がタップしたかどうかを検知します。

```
お客様がタップ
  ↓
/api/v1/t/xxxxx（トラッキングURL）
  ↓ クリック記録 + リダイレクト
/property/abc123（物件詳細ページ）
```

お客様の体験は変わりません。タップすれば今まで通り物件詳細ページが開きます。その裏側で、いつ・何回クリックされたかが対応履歴に記録されます。

### 対応履歴に配信状況が表示される

追跡結果は3つの場所に表示されます。

**チャットビュー** — 送信メッセージのバブル下部に小さなステータスが表示されます。

```
┌─────────────────────────┐
│ 📧 メール               │
│ RE: 内見のご案内         │
│ 本文テキスト...          │
│                担当者名  │
│   ✓ 配信済み 👁 開封3回  🔗 クリック1回 │
└─────────────────────────┘
```

**タイムライン** — 各アクティビティの日時・担当者の下にステータスが表示されます。

**詳細ダイアログ** — アクティビティをクリックすると、配信状況の詳細セクションが表示されます。初回開封日時、最新開封日時、クリック回数などを確認できます。

## 使い方ガイド

### メール追跡：SendGrid の設定

メール追跡を有効にするには、SendGrid 管理画面での設定が必要です。

**1. Open Tracking / Click Tracking を有効化**

SendGrid ダッシュボード > Settings > Tracking から、Open Tracking と Click Tracking をオンにします。

**2. Event Webhook を設定**

Settings > Mail Settings > Event Webhook で以下を設定します。

| 項目 | 値 |
|:---|:---|
| HTTP Post URL | `https://あなたのドメイン/api/v1/sendgrid/webhook` |
| 対象イベント | delivered, open, click, bounce, dropped |

**3. 署名検証キーの設定（推奨）**

Event Webhook の署名検証を有効にし、Verification Key を環境変数に設定します。

```bash
SENDGRID_WEBHOOK_VERIFICATION_KEY=your_verification_key_here
```

設定が完了すれば、以後のメール送信は自動的に追跡が有効になります。既存のメール送信フローに変更は不要です。

### LINE追跡：設定不要

LINE クリック追跡は、物件カード（Flex Message）の送信時に自動的に有効になります。追加の設定は不要です。

テキストメッセージや画像メッセージにはリンクが含まれないため、追跡対象にはなりません。

## 技術的な詳細

### SendGrid Event Webhook の仕組み

メール送信時に、SendGrid の `X-SMTPAPI` ヘッダーに `unique_args` を付与し、Webhook イベントと `CustomerActivity` を紐付けます。

```ruby
# CustomerMailer — トラッキングヘッダーの付与
def send_to_customer(customer, sender_user, subject, body, inquiry,
                     body_format: "text", attachment_ids: nil, activity_id: nil)
  if activity_id.present?
    headers["X-SMTPAPI"] = {
      unique_args: {
        activity_id: activity_id,
        tenant_id: tenant.id
      }
    }.to_json
  end

  mail(to: customer.email, subject: subject)
end
```

SendGrid がメールの配信・開封・クリック・バウンスを検知するたびに、Webhook エンドポイントにイベントが POST されます。

```ruby
# SendgridWebhookController — イベント処理
def process_event(event)
  activity_id = event.dig("unique_args", "activity_id")
  return unless activity_id

  activity = CustomerActivity.find_by(id: activity_id)
  return unless activity

  metadata = activity.metadata || {}

  case event["event"]
  when "delivered"
    metadata["email_delivered_at"] ||= event["timestamp"]
  when "open"
    metadata["email_opened_at"] ||= event["timestamp"]
    metadata["email_open_count"] = (metadata["email_open_count"] || 0) + 1
    metadata["email_last_opened_at"] = event["timestamp"]
  when "click"
    metadata["email_clicked_at"] ||= event["timestamp"]
    metadata["email_click_count"] = (metadata["email_click_count"] || 0) + 1
  when "bounce"
    metadata["email_bounced_at"] = event["timestamp"]
    metadata["email_bounce_reason"] = event["reason"]
  end

  activity.update_column(:metadata, metadata)
end
```

ポイントは **初回のタイムスタンプは `||=` で保持し、回数だけインクリメント** する設計です。「いつ初めて開封されたか」と「合計何回開封されたか」の両方を記録できます。

### Webhook 署名検証

SendGrid の Event Webhook Signature Verification に対応しています。ECDSA 署名を検証し、第三者からの偽リクエストを防ぎます。

```ruby
def verify_webhook_signature
  verification_key = ENV["SENDGRID_WEBHOOK_VERIFICATION_KEY"]
  return if verification_key.blank?

  signature = request.headers["X-Twilio-Email-Event-Webhook-Signature"]
  timestamp = request.headers["X-Twilio-Email-Event-Webhook-Timestamp"]

  payload = timestamp + request.body.read
  request.body.rewind

  expected = OpenSSL::PKey::EC.new(Base64.decode64(verification_key))
  digest = OpenSSL::Digest::SHA256.new
  unless expected.dsa_verify_asn1(digest.digest(payload), Base64.decode64(signature))
    head :unauthorized
  end
end
```

### LINE トラッキングリンクの仕組み

`MessageTracking` モデルが、元の URL とトラッキング用トークンを管理します。

```ruby
class MessageTracking < ApplicationRecord
  belongs_to :customer_activity

  before_create :generate_token

  def record_click!
    activity = customer_activity
    metadata = activity.metadata || {}
    metadata["line_link_clicked_at"] ||= Time.current.to_i
    metadata["line_click_count"] = (metadata["line_click_count"] || 0) + 1
    metadata["line_last_clicked_at"] = Time.current.to_i
    activity.update_column(:metadata, metadata)
  end

  private

  def generate_token
    self.token = SecureRandom.urlsafe_base64(16) if token.blank?
  end
end
```

物件カードの Flex Message を組み立てる際に、「詳細を見る」ボタンの URL をトラッキング URL に差し替えます。

```ruby
# FlexMessageBuilder — トラッキング URL の挿入
def footer_contents(room, activity_id: nil)
  url = "#{base_url}/property/#{publication.publication_id}"

  if activity_id
    tracking = MessageTracking.create!(
      customer_activity_id: activity_id,
      destination_url: url
    )
    url = "#{base_url}/api/v1/t/#{tracking.token}"
  end

  # ... Flex Message の button に url を設定
end
```

トラッキングコントローラーは、クリックを記録してから元の URL にリダイレクトするだけのシンプルな設計です。

```ruby
class Api::V1::TrackingController < ApplicationController
  def redirect
    tracking = MessageTracking.find_by(token: params[:token])
    return head :not_found unless tracking

    tracking.record_click!
    redirect_to tracking.destination_url, allow_other_host: true
  end
end
```

### metadata を活用したスキーマレスな設計

追跡データの保存先として、`CustomerActivity` の既存の `metadata` カラム（JSONB）を活用しています。新しいテーブルやカラムを追加する代わりに、metadata に追跡情報をマージする方式です。

```json
{
  "email_delivered_at": 1707900000,
  "email_opened_at": 1707901000,
  "email_open_count": 3,
  "email_last_opened_at": 1707915000,
  "email_clicked_at": 1707902000,
  "email_click_count": 1
}
```

この設計には以下のメリットがあります。

- **スキーマ変更不要** — 既存の metadata カラムに載せるだけ
- **追跡が不要なアクティビティには影響なし** — metadata が空のままなだけ
- **フロントエンドに自然に伝達** — metadata はすでに API レスポンスに含まれている

### 注意書きの UX 設計

メール開封追跡には技術的な制約があります（画像ブロック、Apple Mail のプライバシー保護など）。これをユーザーに正しく伝えるため、詳細ダイアログに**折りたたみ可能な注意書き**を設置しました。

```jsx
// 初回表示時のみ自動展開、以後は localStorage で記憶
useEffect(() => {
  const dismissed = localStorage.getItem(NOTES_DISMISSED_KEY);
  if (!dismissed) {
    setNotesOpen(true);
    localStorage.setItem(NOTES_DISMISSED_KEY, '1');
  }
}, []);
```

初めて配信状況セクションを見た時だけ自動展開され、一度閉じれば以後は閉じたままです。「大事な情報だけど、毎回読む必要はない」というバランスを取っています。

## 活用シーン

### 反響対応の優先順位づけ

メールを送った5人の顧客のうち、3人が開封済み・2人が未開封。開封済みの顧客を優先的にフォローすれば、限られた時間で効率的に営業活動できます。

### ホットリードの検知

メールを3回開封し、さらにリンクをクリックしている顧客は関心度が高いサイン。「物件情報、もう少し詳しくご説明しましょうか？」と一歩踏み込んだ提案ができます。

### メール不達の早期発見

バウンスが発生したら、すぐに「⚠ 配信失敗」が表示されます。「メールアドレスが間違っているかもしれません」——電話や LINE で連絡先を確認し、機会損失を防ぎます。

### LINE 物件提案の効果測定

物件カードを送ったけどクリックされていない場合、「この物件は条件に合わなかったかな」と判断して別の物件を提案。逆にクリックされていれば「興味がありそう」と見込んで内見を提案。データに基づいた営業判断が可能になります。

## 追跡の限界と正しい理解

メール追跡は万能ではありません。システムが正直に注意書きを表示するのは、ユーザーに誤った判断をさせないためです。

| 制約 | 理由 |
|:---|:---|
| 画像ブロック環境では開封を検知できない | 開封検知は「トラッキングピクセル（1×1の透明画像）」の読み込みに依存 |
| Apple Mail で実際に開封していなくても記録される場合がある | プライバシー保護機能がプリフェッチでトラッキングピクセルを読み込む |
| 開封回数はプレビューも含む | メールソフトのプレビュー表示も画像読み込みが発生する場合がある |
| 配信済みは受信トレイ到達を保証しない | メールサーバーに到達しただけで、迷惑メールフォルダに入る可能性がある |
| LINE はリンク付きメッセージのみ追跡可能 | テキストのみのメッセージはクリック対象がない |

追跡データはあくまで**参考情報**として活用し、「開封されていない=読んでいない」と断定しないことが大切です。

## まとめ

今回の実装で、メールと LINE のコミュニケーションに**フィードバックループ**が生まれました。

送信して終わりではなく、「届いたか」「読まれたか」「反応があったか」が見えるようになったことで、営業活動の PDCAが回しやすくなります。

特にこだわったのは2点です。

1. **既存の仕組みへの自然な統合** — 追跡データは既存の `metadata` に載せ、対応履歴の UI にシームレスに表示。新しい操作を覚える必要はありません
2. **正直な注意書き** — 追跡の限界をユーザーに正しく伝え、データの過信を防ぐ

「送ったけど見てもらえたのかな…」——そんな不安が、データで解消される日常を目指しています。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2026-02-14 21:00:00')
  post.commit_hash = 'bf625986'
end

puts "✓ 記事作成: #{blog_post_35.title}"
