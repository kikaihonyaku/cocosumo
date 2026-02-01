# 記事29: 顧客メール送信機能と店舗ベースのメールアドレス管理
blog_post_29 = BlogPost.find_or_create_by!(public_id: 'customer-email-store-migration-2026') do |post|
  post.title = "顧客への直接メール送信と、問い合わせメールアドレスの店舗単位管理を実装"
  post.summary = "顧客詳細画面からメールを直接送信し、返信も自動で対応履歴に記録される仕組みを構築しました。同時に、問い合わせ受付用メールアドレスをテナント単位から店舗単位に移行し、複数店舗運営に対応しました。"
  post.content = <<~'MARKDOWN'
## はじめに — 「このお客様にメールを送りたいだけなのに」

顧客管理画面にお客様の情報が揃っている。対応履歴も見える。でも、メールを送るには別のメールソフトを開いて、アドレスをコピーして、件名を入力して…。

> 「CoCoスモの画面から直接メールを送れたら、対応履歴も自動で残るのに」

この声に応えるべく、今回2つの大きな改善を同時に行いました。

1. **顧客への直接メール送信機能** — 画面からメールを送り、返信も自動で対応履歴に記録
2. **問い合わせメールアドレスの店舗単位管理** — テナント単位だったメールアドレスを店舗ごとに分離

## 顧客メール送信機能

### メール作成から送信まで

顧客詳細画面に「メール」ボタンが追加されました。クリックするとメール作成ダイアログが開き、そのまま送信できます。

```
┌─ メールを送信 ──────────────────┐
│ 宛先: 山田太郎 <yamada@example.com> │
│ 案件: [案件 #1 - ○○マンション 101] │
│ 件名: [内見日程のご案内        ]  │
│       [テンプレート]              │
│ 本文:                             │
│ ┌──────────────────────────┐     │
│ │山田様                     │     │
│ │                           │     │
│ │先日はお問い合わせいただき  │     │
│ │ありがとうございます...     │     │
│ └──────────────────────────┘     │
│            [キャンセル] [送信]     │
└──────────────────────────────────┘
```

送信すると以下が自動的に行われます。

- お客様へのメール配信（Active Job経由の非同期送信）
- 対応履歴への自動記録（activity_type: email, direction: outbound）
- 送信担当者の店舗メールアドレスからの送信（差出人が店舗のアドレスになる）

### メールテンプレート

よく使う定型文をテンプレートとして登録しておけます。

```ruby
class EmailTemplate < ApplicationRecord
  belongs_to :tenant

  validates :name, :subject, :body, presence: true

  scope :kept, -> { where(discarded_at: nil) }
  scope :ordered, -> { order(:position, :name) }
end
```

テンプレートはテナント単位で管理され、「内見日程のご案内」「資料送付のお知らせ」などの定型メールをワンクリックで呼び出せます。件名と本文が一括でセットされるので、少し手直しするだけですぐ送信できます。

### 返信の自動取り込み

ここが今回のこだわりポイントです。お客様がメールに返信すると、**対応履歴に自動で記録されます**。

仕組みは、送信メールの `Reply-To` ヘッダーに追跡用のアドレスを設定することです。

```ruby
class CustomerMailer < ApplicationMailer
  def send_to_customer(customer, sender_user, subject, body, inquiry)
    tenant = customer.tenant
    store = sender_user.store

    from_address = store&.email.presence || default_from
    reply_to_address = "#{tenant.subdomain}-reply-#{customer.id}-#{inquiry.id}-#{store&.id || 0}@inbound.cocosumo.space"

    mail(
      to: customer.email,
      from: from_address,
      reply_to: reply_to_address,
      bcc: from_address,
      subject: subject
    )
  end
end
```

`Reply-To` アドレスに顧客ID・案件ID・店舗IDを埋め込んでいます。お客様がこのメールに返信すると、返信メールは自動的に `CustomerReplyMailbox` にルーティングされ、正しい顧客・案件に紐づけて対応履歴に記録されます。

```
お客様がメールに返信
    ↓
test-reply-42-7-3@inbound.cocosumo.space に届く
    ↓ Action Mailbox
CustomerReplyMailbox（アドレスからID抽出）
    ↓ customer_id=42, inquiry_id=7, store_id=3
対応履歴に自動記録（inbound email）
    ↓
店舗担当者に通知メール送信
```

スタッフは何も意識する必要がありません。普通にメールを送って、普通にお客様が返信するだけで、すべてのやり取りがCoCoスモの対応履歴に蓄積されていきます。

### スパム・レートリミット対策

外部からメールを受信する仕組みなので、安全対策も万全です。

```ruby
class CustomerReplyMailbox < ApplicationMailbox
  RATE_LIMIT_COUNT = 10
  RATE_LIMIT_PERIOD = 1.hour
  SPAM_SCORE_THRESHOLD = 5.0

  before_processing :check_spam_score
  before_processing :find_tenant
  before_processing :find_customer_and_inquiry
  before_processing :check_rate_limit
  # ...
end
```

- **スパムスコアチェック**: メールヘッダーの `X-Spam-Score` が閾値を超えたらバウンス
- **レートリミット**: 同一顧客からの受信を1時間10件に制限
- **ID検証**: アドレスに埋め込まれた顧客ID・案件IDが実在し、テナントに所属していることを確認

不正なメールや大量送信は自動的にブロックされます。

## 問い合わせメールアドレスの店舗単位管理

### なぜ変えたのか

これまで問い合わせ受付用メールアドレスはテナント（会社）単位で1つだけ生成されていました。

```
旧: demo-inquiry@inbound.cocosumo.space     ← テナントに1つ
```

しかし不動産会社は複数の店舗を持つケースが一般的です。「渋谷店への問い合わせ」と「新宿店への問い合わせ」を同じアドレスで受けると、振り分けの手間が発生します。

そこで、メールアドレスを**店舗単位**に変更しました。

```
新: demo-s3-inquiry@inbound.cocosumo.space   ← 店舗ごとに1つ
新: demo-s5-inquiry-suumo@inbound.cocosumo.space  ← ポータル別も店舗ごと
```

`s3` の部分が店舗IDです。これにより、どの店舗宛の問い合わせかがメールアドレスだけで判別できます。

### Store モデルへのメソッド追加

メールアドレスの生成ロジックを `Tenant` から `Store` に移動しました。

```ruby
class Store < ApplicationRecord
  # メール問い合わせ用のメールアドレスを返す
  def inquiry_email_address
    "#{tenant.subdomain}-s#{id}-inquiry@inbound.cocosumo.space"
  end

  # ポータル別メール問い合わせ用のメールアドレスを返す
  def portal_inquiry_email_address(portal)
    "#{tenant.subdomain}-s#{id}-inquiry-#{portal}@inbound.cocosumo.space"
  end

  # 全ポータルの問い合わせ用メールアドレスを返す
  def portal_inquiry_email_addresses
    { suumo: portal_inquiry_email_address(:suumo) }
  end
end
```

### 後方互換のあるメール受信

既に運用中の旧形式アドレスでもメールを受信できるよう、正規表現で新旧両方に対応しています。

```ruby
# PropertyInquiryMailbox#find_tenant
match = recipient.match(/^(.+?)(?:-s(\d+))?-inquiry@/i)
subdomain = match&.[](1)
store_id = match&.[](2)&.to_i
```

`(?:-s(\d+))?` が任意マッチになっているのがポイントです。

| 受信アドレス | subdomain | store_id |
|-------------|-----------|----------|
| `demo-s3-inquiry@...`（新形式） | demo | 3 |
| `demo-inquiry@...`（旧形式） | demo | nil |

旧形式で `store_id` が取れない場合は、テナントの最初の店舗にフォールバックします。既存の転送設定を変更しなくても、問い合わせの取りこぼしは発生しません。

### テナント情報画面の更新

ヘッダーのテナント名をクリックすると表示される情報ダイアログも、店舗ベースに更新しました。

```
┌─────────────────────────────────────────┐
│ テナント情報                              │
├─────────────────────────────────────────┤
│ 所属店舗                                  │
│ 🏪 渋谷店                                │
│                                           │
│ 問い合わせ受付用メールアドレス（汎用）        │
│ ✉ demo-s3-inquiry@inbound.cocosumo.space  │
│                                           │
│ SUUMO反響受付用メールアドレス                │
│ ✉ demo-s3-inquiry-suumo@inbound.cocosmo…  │
│   SUUMOの反響通知メール転送先として          │
│   設定してください                          │
└─────────────────────────────────────────┘
```

ログイン中のユーザーが所属する店舗のメールアドレスが表示されます。APIレスポンスにも `store` オブジェクトとしてメールアドレスが含まれるようになりました。

### 通知メールの送信先も店舗メールに

問い合わせが届いたときの管理者通知メールも、店舗のメールアドレスに送信されるようになりました。

```ruby
# PropertyInquiryMailer
def notify_admin(property_inquiry, store: nil)
  # 店舗メール → テナントユーザーメールの順でフォールバック
  admin_email = store&.email.presence || @building.tenant&.user&.email
  return unless admin_email.present?
  # ...
end
```

店舗メールが設定されていない場合は従来通りテナントのユーザーメールにフォールバックするので、設定漏れがあっても通知が消失することはありません。

## 2つの機能がつながる

今回の2つの改善は独立しているようで、実は密接に連携しています。

```
[店舗メールアドレス] ← 差出人・返信先として使用
        │
        ↓
[顧客メール送信] → 対応履歴に記録（outbound）
        │
        ↓ お客様が返信
[CustomerReplyMailbox] → 対応履歴に記録（inbound）
        │
        ↓ 店舗担当者に通知
[店舗メールアドレス] ← 通知先として使用
```

店舗のメールアドレスが「差出人」「返信通知先」として一貫して使われることで、**お客様から見ても、スタッフから見ても、自然なメールのやり取り**が実現します。

## 実際の使われ方

### 内見後のフォローメール

内見を終えたお客様に、顧客詳細画面からすぐにフォローメールを送れます。テンプレートから「内見お礼」を選び、物件名を少し書き足すだけ。送信履歴は自動で対応履歴に残ります。

### ポータル反響への一次対応

SUUMOから問い合わせが届いたら、顧客詳細画面を開いてすぐに一次対応メールを送信。お客様からの返信も対応履歴にそのまま記録されるので、やり取りの全体像が常に見える状態になります。

### 複数店舗の独立運用

渋谷店と新宿店で別々の問い合わせメールアドレスを持てるようになりました。各店舗のスタッフは自分の店舗のアドレスをポータルサイトに設定し、問い合わせは自動的に正しい店舗に紐づきます。

### 引き継ぎの円滑化

前回の記事で紹介したチャット風UIと組み合わせると、メールのやり取りが吹き出し表示で一覧できます。担当者の引き継ぎ時に「このお客様とはこんなメールをやり取りしていた」という流れが一目瞭然です。

## まとめ

今回の実装で、CoCoスモのメールコミュニケーション機能が大きく前進しました。

- **送信**: 顧客詳細画面から直接メール送信、テンプレート対応
- **受信**: 返信メールの自動取り込みと対応履歴への記録
- **通知**: 返信受信時の店舗担当者への即座な通知
- **店舗分離**: メールアドレスの店舗単位管理で複数店舗に対応
- **後方互換**: 旧形式のアドレスも引き続き受信可能

「メールを送ったら対応履歴に残り、返信が来たらまた自動で残る」——この当たり前に見えるサイクルを、特別な設定なしに実現できるようになりました。メールソフトとの行き来や手動での履歴記録から解放されることで、スタッフの方々が本来の業務——お客様への丁寧な対応——に集中できるようになれば幸いです。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2026-02-02 12:00:00')
  post.commit_hash = '0374ab6'
end

puts "✓ 記事作成: #{blog_post_29.title}"
