# 記事32: LINE Messaging API連携 — 不動産のお客様コミュニケーションをLINEで
blog_post_32 = BlogPost.find_or_create_by!(public_id: 'line-messaging-api-2026') do |post|
  post.title = "LINE Messaging API連携を実装 — 物件カード・テンプレート・Webhook で不動産コミュニケーションが変わる"
  post.summary = "テナントごとのLINE公式アカウント連携を実装しました。テキスト・画像・物件カード（Flex Message）の送信、Webhookによるメッセージ受信・友だち追加検知、LINEテンプレート管理など、メールに加えてLINEでもお客様とやり取りできる環境を整えました。"
  post.content = <<~'MARKDOWN'
## はじめに — メールだけでは届かない時代

不動産の営業活動で、こんな経験はありませんか？

> 「メールを送ったのに、なかなか開封されない…」
> 「お客様から『LINEで連絡もらえますか？』と言われたけど、個人LINEでやり取りするのは管理が大変」
> 「物件情報をLINEで送りたいけど、テキストだけだと味気ない」

総務省の調査によると、LINEの利用率は全年代で90%超。特に20〜30代の物件探し世代にとって、LINEはメールよりも身近なコミュニケーション手段です。しかし、営業担当者の個人LINEでお客様とやり取りすると、履歴が会社に残らない、担当者が変わると引き継げない——そんな課題がありました。

今回、CoCoスモにLINE Messaging API連携を実装し、**会社のLINE公式アカウントからお客様にメッセージを送受信し、その履歴をすべて対応履歴に自動記録する**仕組みを構築しました。

## LINE連携でできること

### 1. 3種類のメッセージ送信

顧客詳細画面の「LINE」ボタンから、3種類のメッセージを送信できます。

| メッセージタイプ | 用途 | 内容 |
|:---|:---|:---|
| テキスト | 日常的なやり取り | 自由入力テキスト |
| 画像 | 物件写真の共有 | HTTPS画像URLを指定 |
| 物件カード | 物件提案 | Flex Messageで物件情報をリッチに表示 |

テキストメッセージでは、事前に登録したLINEテンプレートをワンクリックで呼び出せます。「内見日程のご案内」「お申し込みありがとうございます」など、よく使う文面をテンプレート化しておけば、入力の手間を大幅に削減できます。

### 2. 物件カード（Flex Message）

LINEならではの機能が**物件カード**です。Flex Messageを使い、物件写真・建物名・賃料・間取り・面積・最寄駅を1枚のカードにまとめて送信します。

```ruby
# FlexMessageBuilder — 物件カードの構造
def build_property_card(room)
  {
    type: "bubble",
    hero: {                           # 物件写真
      type: "image",
      url: photo_url,
      size: "full",
      aspectRatio: "20:13",
      aspectMode: "cover"
    },
    body: {                           # 建物名・賃料・間取り等
      type: "box",
      layout: "vertical",
      contents: body_contents(room, building)
    },
    footer: {                         # 「詳細を見る」ボタン
      type: "button",
      style: "primary",
      action: { type: "uri", label: "詳細を見る", uri: url }
    }
  }
end
```

物件の公開ページが発行されている場合は「詳細を見る」ボタンが自動で追加され、お客様はタップするだけで物件の詳細ページを開けます。メールのテキストリンクとは比較にならない、直感的な導線です。

### 3. Webhookによるメッセージ受信

お客様からのLINEメッセージは、Webhookで自動的にCoCoスモに取り込まれます。

```ruby
# LineWebhookController — イベント種別ごとの処理
events.each do |event|
  case event
  when Line::Bot::Event::Message    # テキスト・画像メッセージ
    handle_message(event)
  when Line::Bot::Event::Follow     # 友だち追加
    handle_follow(event)
  when Line::Bot::Event::Unfollow   # ブロック
    handle_unfollow(event)
  end
end
```

受信したメッセージは自動的に顧客の対応履歴に記録され、チャットビューでメールとLINEのやり取りを時系列で一覧できます。**友だち追加**イベントでは、LINEのプロフィール情報を取得して顧客情報に自動紐付けし、設定した挨拶メッセージを自動送信します。

### 4. 対応履歴でのLINE表示

送受信したLINEメッセージは、既存のメール履歴と同じチャットビューに統合表示されます。画像メッセージはインラインでプレビュー表示、物件カードは専用のカード表示で「どの物件を提案したか」が一目でわかります。

## 使い方ガイド

### Step 1: LINE公式アカウントの設定

管理者メニューから「LINE設定」画面を開き、LINE Developers コンソールで取得した以下の情報を入力します。

| 設定項目 | 取得元 |
|:---|:---|
| Channel ID | LINE Developers > チャネル基本設定 |
| Channel Secret | LINE Developers > チャネル基本設定 |
| Channel Token | LINE Developers > Messaging API設定 > チャネルアクセストークン |
| 挨拶メッセージ | 友だち追加時に自動送信するテキスト（任意） |

保存後、「接続テスト」ボタンでBot情報が正しく取得できるか確認できます。

```
Webhook URL: https://あなたのドメイン/api/v1/line/webhook/テナントサブドメイン
```

このURLをLINE Developersの「Webhook URL」に設定してください。

### Step 2: LINEテンプレートの準備

「LINEテンプレート管理」画面で、よく使うメッセージのテンプレートを登録します。

テンプレートでは `{{お客様名}}` や `{{会社名}}` などのプレースホルダーが使え、送信時に自動で置換されます。テキスト・画像・Flex Messageの3タイプに対応しています。

### Step 3: 顧客へのLINEメッセージ送信

1. 顧客詳細画面を開く
2. ヘッダーの「LINE」ボタン（緑色）をクリック
3. メッセージタイプを選択（テキスト / 画像 / 物件カード）
4. 内容を入力（またはテンプレートを選択）
5. 案件を選び、「送信」をクリック

物件カードの場合は、物件を検索・選択するだけでOK。Flex Messageの組み立てはシステムが自動で行います。

## 技術的なこだわり

### トークンの暗号化

LINE APIの認証情報（Channel ID・Channel Secret・Channel Token）は、Active Record Encryptionで暗号化してデータベースに保存しています。

```ruby
class LineConfig < ApplicationRecord
  encrypts :channel_id, :channel_secret, :channel_token
end
```

万が一データベースが漏洩しても、トークンが平文で流出することはありません。

### Webhook署名検証

LINEからのWebhookリクエストは、`X-Line-Signature` ヘッダーで署名検証を行い、正規のリクエストのみを処理します。

```ruby
def verify_signature
  body = request.body.read
  request.body.rewind
  signature = request.env["HTTP_X_LINE_SIGNATURE"]

  unless @client.validate_signature(body, signature)
    head :bad_request
  end
end
```

### マルチテナント対応

Webhook URLにテナントのサブドメインを含めることで、複数の不動産会社がそれぞれ独自のLINE公式アカウントを運用できます。テナントごとに設定・テンプレート・メッセージ履歴が完全に分離されています。

```
POST /api/v1/line/webhook/:tenant_subdomain
```

### 非同期送信とリトライ

大量送信時やネットワーク障害に備え、`SendLineMessageJob` でバックグラウンド送信にも対応しています。Solid Queue上で動作し、送信失敗時は多項式的に間隔を広げながら最大3回リトライします。

```ruby
class SendLineMessageJob < ApplicationJob
  retry_on LineMessageService::DeliveryError,
           wait: :polynomially_longer, attempts: 3
  discard_on LineMessageService::NotConfiguredError
end
```

## 活用シーン

### 内見日程の調整

お客様に物件カードを送信し、「こちらの物件、今週末に内見いかがですか？」とLINEで提案。お客様はカードをタップして物件詳細を確認し、そのまま「土曜の午後でお願いします」と返信——テンポの良いコミュニケーションが実現します。

### 新着物件のお知らせ

条件に合う新着物件が入ったら、物件カードをLINEで即座にお知らせ。メールと違い、お客様のスマホにプッシュ通知が届くため、見逃しを防げます。

### 契約手続きのリマインド

「必要書類のご案内」「契約日のリマインド」など、テンプレートを活用して定型的な連絡を効率化。既読確認の有無がわかるLINEなら、連絡の行き違いも減らせます。

### 友だち追加からの自動顧客登録

物件チラシやWebサイトにLINE公式アカウントのQRコードを掲載。お客様が友だち追加するだけで、CoCoスモに顧客情報が自動登録され、挨拶メッセージが送信されます。営業担当者が手動で顧客登録する手間がなくなります。

## まとめ

今回のLINE Messaging API連携は、**メールと並ぶもう一つの顧客コミュニケーションチャネル**をCoCoスモに追加するものです。

特にこだわったのは「既存のワークフローへの自然な統合」です。新しい画面を覚える必要はほとんどなく、顧客詳細画面のLINEボタンを押すだけ。送受信履歴はメールと同じチャットビューに表示され、対応状況の把握も従来通りです。

物件カード（Flex Message）による視覚的な物件提案、Webhookによる受信メッセージの自動取り込み、友だち追加からの顧客自動登録——LINEならではの強みを活かしながら、不動産営業の日常業務に溶け込む設計を目指しました。

メールは丁寧な長文連絡に、LINEは素早いやり取りに。お客様に合わせたコミュニケーション手段を選べることが、これからの不動産営業のスタンダードになっていくと考えています。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2026-02-11 12:00:00')
  post.commit_hash = '24946a6'
end

puts "✓ 記事作成: #{blog_post_32.title}"
