# 記事28: ポータルサイト反響メール自動取り込み
blog_post_28 = BlogPost.find_or_create_by!(public_id: 'portal-inquiry-email-2026') do |post|
  post.title = "SUUMOなどポータルサイトの反響メールを自動取り込み — メール本文パースで顧客情報を即登録"
  post.summary = "SUUMOをはじめとする不動産ポータルサイトからの反響通知メールを受信し、本文をパースして顧客の名前・メールアドレス・電話番号を自動抽出する仕組みを構築しました。ポータル別メールアドレスと送信元ドメインによる自動判別のハイブリッド方式です。"
  post.content = <<~'MARKDOWN'
## はじめに — 反響メールの手動転記、もうやめませんか？

不動産会社の日常業務の中で、意外と時間を取られている作業があります。SUUMOやat homeなどのポータルサイトから届く「反響メール」の処理です。

> 「SUUMOから問い合わせが来た。名前と電話番号をコピーして、管理システムに入力して…」

ポータルサイトからの反響メールは、だいたいこんな流れで届きます。

1. お客様がSUUMOなどで「資料請求」や「見学予約」ボタンを押す
2. ポータルサイトからお客様の情報を含んだ通知メールが届く
3. スタッフがメールを開いて、名前・電話番号・メールアドレスを読み取る
4. 管理システムに手動で入力する

3〜4のステップ、1件なら大した手間ではありませんが、繁忙期に1日何十件も来ると話は別です。入力ミスのリスクもあります。

今回、この手動転記をゼロにする仕組みを構築しました。

## どんな仕組み？

CoCoスモに**ポータル専用のメールアドレス**を用意し、そこにポータルサイトの反響通知メールを転送するだけで、顧客情報が自動的に登録されます。

```
SUUMOの反響通知メール
        ↓ 転送設定
demo-inquiry-suumo@inbound.cocosumo.space
        ↓ Action Mailbox
PortalInquiryMailbox（メール受信）
        ↓
SuumoParser（本文パース）
        ↓ 名前・メール・電話番号を抽出
顧客 + 問い合わせ 自動作成
```

### 2つの受信方式（ハイブリッドアプローチ）

メールの受け取り方を2種類用意しています。

| 方式 | メールアドレス例 | 判定方法 |
|------|-----------------|---------|
| ポータル別アドレス | `demo-inquiry-suumo@...` | 宛先アドレスにポータル名が含まれる |
| 汎用アドレス | `demo-inquiry@...` | 送信元ドメイン（`suumo.jp`）で自動判定 |

**ポータル別アドレス**は、SUUMOの管理画面で転送先として設定する専用アドレスです。アドレスにポータル名が入っているので、確実にポータル種別を判定できます。

**汎用アドレス**は、既存の問い合わせ受付アドレスです。もしポータルからのメールが汎用アドレスに届いた場合でも、送信元のドメイン（`@suumo.jp`）を見て自動的にポータルのパーサーに振り分けます。

## メール本文のパース

ポータルからの反響メールには、お客様の情報が定型フォーマットで記載されています。パーサーがこれを読み取って、構造化されたデータに変換します。

```ruby
module PortalEmailParsers
  class SuumoParser < BaseParser
    def parse(mail)
      body = extract_body(mail)

      {
        name: extract_name(body),
        email: extract_email(body),
        phone: extract_phone(body),
        message: body,
        origin_type: detect_origin_type(body)
      }
    end

    private

    def extract_name(body)
      extract_field(body, /お名前[：:]\s*(.+)/) ||
        extract_field(body, /氏名[：:]\s*(.+)/) ||
        extract_field(body, /名前[：:]\s*(.+)/)
    end

    def detect_origin_type(body)
      if body.include?('資料請求')
        :document_request
      elsif body.include?('見学予約') || body.include?('内見')
        :visit_reservation
      else
        :general_inquiry
      end
    end
  end
end
```

「お名前」「氏名」「名前」など、複数のラベルパターンに対応しています。全角コロン（`：`）と半角コロン（`:`）の両方を認識するので、ポータル側のフォーマットが多少変わっても柔軟に対応できます。

### 問い合わせ種別の自動判定

メール本文のキーワードから、問い合わせの種類も自動判定します。

| キーワード | 判定結果 |
|-----------|---------|
| 「資料請求」 | 資料請求 |
| 「見学予約」「内見」 | 見学予約 |
| その他 | 一般問い合わせ |

これにより、問い合わせ一覧画面で「資料請求が何件、見学予約が何件」といったポータル経由の反響を種別ごとに把握できるようになります。

### パース失敗時のフォールバック

ポータルのメール形式が変わった場合など、パースがうまくいかないケースも想定しています。

```ruby
# PortalInquiryMailbox#process より
name = parsed[:name] || fallback_name
email = parsed[:email] || sender_email
phone = parsed[:phone]
message = parsed[:message] || sanitized_body
```

名前が取れなければ送信元の表示名を、メールアドレスが取れなければ送信元アドレスをフォールバック値として使います。パースに完全に失敗しても、メール本文はそのまま `message` に保存されるので、後から手動で確認できます。**データが消えることは絶対にありません。**

## メールのルーティング

Rails の Action Mailbox を活用して、受信アドレスによるルーティングを行っています。

```ruby
class ApplicationMailbox < ActionMailbox::Base
  # ポータル別アドレス → PortalInquiryMailbox（先にマッチ）
  routing(/-inquiry-(suumo|athome|homes|lifull)@/i => :portal_inquiry)

  # 汎用アドレス → PropertyInquiryMailbox
  routing(/-inquiry@/i => :property_inquiry)

  routing :all => :bounces
end
```

ポータル別アドレスのルーティングを**先に**定義しているのがポイントです。`demo-inquiry-suumo@...` は `-inquiry-suumo@` にも `-inquiry@` にもマッチしますが、先に定義されたルールが優先されるため、正しく `PortalInquiryMailbox` に振り分けられます。

## テナント情報画面での確認

ヘッダーのテナント名をクリックすると表示されるテナント情報ダイアログに、SUUMO反響受付用メールアドレスが追加されました。

```
┌─────────────────────────────────────┐
│ テナント情報                          │
├─────────────────────────────────────┤
│ 問い合わせ受付用メールアドレス（汎用）    │
│ ✉ demo-inquiry@inbound.cocosumo.space  │
│                                       │
│ SUUMO反響受付用メールアドレス            │
│ ✉ demo-inquiry-suumo@inbound.cocosumo… │
│   SUUMOの反響通知メール転送先として      │
│   設定してください                      │
└─────────────────────────────────────┘
```

コピーボタンで簡単にアドレスをクリップボードにコピーできるので、SUUMOの管理画面にそのまま貼り付けられます。

## パーサーの拡張性

今回はSUUMOパーサーを実装しましたが、新しいポータルへの対応は3ステップで完了します。

**1. パーサークラスを追加**

```ruby
# app/services/portal_email_parsers/athome_parser.rb
module PortalEmailParsers
  class AthomeParser < BaseParser
    def parse(mail)
      body = extract_body(mail)
      # at home固有のフォーマットに合わせてパース
      { name: ..., email: ..., phone: ..., ... }
    end
  end
end
```

**2. パーサーを登録**

```ruby
# PortalInquiryMailbox
PORTAL_PARSERS = {
  suumo: PortalEmailParsers::SuumoParser,
  athome: PortalEmailParsers::AthomeParser,  # 追加
}.freeze
```

**3. 送信元ドメインを登録（汎用アドレス用）**

```ruby
# PropertyInquiryMailbox
PORTAL_SENDER_DOMAINS = {
  "suumo.jp" => :suumo,
  "athome.co.jp" => :athome,  # 追加
}.freeze
```

ルーティングの正規表現にはすでに `athome|homes|lifull` が含まれているので、メールアドレスの追加対応は不要です。パーサークラスを書いて登録するだけで、新しいポータルに対応できます。

## 実際の使われ方

### SUUMOの反響を自動で顧客台帳に登録

SUUMOの管理画面で反響通知メールの転送先を `demo-inquiry-suumo@inbound.cocosumo.space` に設定するだけ。お客様がSUUMOで問い合わせボタンを押した瞬間、CoCoスモの問い合わせ一覧に反映されます。

### 反響元の可視化

問い合わせには `media_type` として「SUUMO」が記録されるため、「今月SUUMOから何件来たか」「SUUMOとat homeではどちらの反響が多いか」といった分析が可能になります。

### 見学予約の即時対応

メール本文に「内見」「見学予約」といったキーワードが含まれていれば、問い合わせ種別が自動的に「見学予約」になります。問い合わせ一覧で見学予約をフィルタリングすれば、優先的に対応すべき案件がすぐに見つかります。

### 複数ポータル×複数店舗の一元管理

テナントごとにポータル別のメールアドレスが生成されるため、複数店舗を運営している場合でも、どの店舗にどのポータルから問い合わせが来たかを正確に把握できます。

## まとめ

ポータルサイトからの反響メールの手動転記は、地味ですが確実に業務を圧迫する作業でした。今回の対応により、以下が実現しました。

- **転記ゼロ**: メール転送設定だけで顧客情報が自動登録
- **ミスゼロ**: 機械的なパースで入力ミスを排除
- **即時反映**: メール到着と同時に問い合わせ一覧に反映
- **分析可能**: ポータル別・種別別の反響データが蓄積

まずはSUUMOからのスタートですが、at home・HOMES・LIFULLなど主要ポータルへの対応も順次進めていく予定です。パーサーを追加するだけという拡張性の高い設計にしているので、サンプルメールさえあればすぐに対応できます。

ポータル反響の処理に手間を感じている方は、ぜひお試しください。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2026-02-01 15:00:00')
  post.commit_hash = 'c4235ec'
end

puts "✓ 記事作成: #{blog_post_28.title}"
