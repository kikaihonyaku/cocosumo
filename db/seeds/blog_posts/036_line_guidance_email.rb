# 記事36: LINE案内メール送信機能 — メールからLINEへの導線を作り営業効率を上げる
blog_post_36 = BlogPost.find_or_create_by!(public_id: 'line-guidance-email-2026') do |post|
  post.title = "LINE案内メール送信機能を実装 — 反響顧客をメールからLINEへ誘導し、営業コミュニケーションを加速する"
  post.summary = "反響のあった顧客にLINE友だち追加を案内するメール送信機能を実装しました。自動確認メールへのLINE案内セクション追加、テンプレートによる個別送信、一括送信機能で、メールからLINEへの導線を作り営業効率を向上させます。"
  post.content = <<~'MARKDOWN'
## はじめに — メールで返事を待つ、もどかしい時間

不動産営業で、こんな経験はありませんか？

> 「お客様にメールで物件情報を送ったけど、返信がなかなか来ない…」
> 「電話するほどでもないけど、ちょっと確認したいことがある」
> 「メールだとやりとりに時間がかかって、他社に先を越されそう」

メールは丁寧なコミュニケーション手段ですが、リアルタイム性に欠けるのが弱点です。一方、LINEなら既読がわかり、写真や間取り図もスムーズに共有でき、チャット感覚で気軽にやりとりできます。

問題は**最初の接点がメールであること**。物件の問い合わせフォームから来た反響は、まずメールでの対応になります。ここからLINEでのやりとりに移行できれば、営業スピードは格段に上がります。

今回実装したのは、その「メールからLINEへの導線」を自然に作る機能です。

## どんな機能？

### 1. 自動確認メールにLINE案内を挿入

物件に問い合わせがあると、お客様に自動返信の確認メールが送られます。このメールの中に、LINE友だち追加の案内セクションが自動で挿入されるようになりました。

```
┌──────────────────────────────────────┐
│  お問い合わせありがとうございます      │
│                                      │
│  ■ お問い合わせ物件                  │
│  物件名：グランメゾン渋谷             │
│  部屋番号：301号室                    │
│                                      │
│  担当者より1〜2営業日以内に           │
│  ご連絡いたします。                   │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ LINEでもお気軽にご相談ください│    │
│  │                              │    │
│  │ LINEで友だち追加すると、      │    │
│  │ 物件情報の送付やチャットでの   │    │
│  │ ご相談がスムーズに行えます    │    │
│  │                              │    │
│  │   [LINEで友だち追加する]      │    │
│  └──────────────────────────────┘    │
│                                      │
│  [物件情報を再度確認する]             │
└──────────────────────────────────────┘
```

LINE緑（#06C755）のCTAボタンで視認性を高めています。すでにLINE連携済みの顧客には表示されないので、不要な案内が届くこともありません。

### 2. テンプレートで個別送信

顧客詳細画面に「LINE案内」ボタンが追加されました。LINE未連携でメールアドレスがある顧客に表示され、クリックするとLINE友だち追加のご案内テンプレートが自動選択された状態でメール作成画面が開きます。

テンプレートには `{{LINE友だち追加URL}}` プレースホルダーが使えるようになり、送信時にLINE設定で登録した友だち追加URLに自動置換されます。

### 3. 一括送信

顧客一覧画面にチェックボックスとLINE連携フィルターを追加しました。「LINE未連携」でフィルターし、複数の顧客を選択して一括でLINE案内メールを送れます。

| 操作 | 説明 |
|:---|:---|
| LINE連携フィルター | すべて / LINE未連携 / LINE連携済み |
| チェックボックス選択 | 個別選択 + 全選択/解除 |
| 一括送信ダイアログ | テンプレート選択 → 送信対象確認 → 送信 |

LINE連携済みの顧客やメール未登録の顧客は自動的に除外されるため、誤送信の心配はありません。

## 使い方ガイド

### Step 1: LINE友だち追加URLを設定

管理画面 > LINE設定 に新しく「LINE友だち追加URL」入力欄が追加されました。

LINE Official Account Manager から取得した友だち追加URL（`https://line.me/R/ti/p/@...` 形式）を入力して保存してください。この設定が完了すると、すべてのLINE案内機能が有効になります。

### Step 2: 自動メールは設定不要

友だち追加URLを設定するだけで、以後の物件問い合わせ確認メールに自動的にLINE案内が含まれます。追加の操作は不要です。

### Step 3: 個別送信

顧客詳細画面で「LINE案内」ボタンをクリック → テンプレートが自動選択されるので、必要に応じて内容を編集して送信します。

### Step 4: 一括送信

顧客一覧 → LINE連携フィルターで「LINE未連携」を選択 → 対象顧客にチェック → 「LINE案内メール送信」ボタン → テンプレート確認 → 送信。バックグラウンドジョブで処理されるため、大量送信でも画面がブロックされません。

## 技術的な詳細

### LineConfigモデルの拡張

`friend_add_url` カラムを追加し、URLバリデーションでLINE公式のドメインのみ受け付けるようにしています。

```ruby
class LineConfig < ApplicationRecord
  validates :friend_add_url,
    format: {
      with: /\Ahttps:\/\/(line\.me|lin\.ee)\//,
      message: "はLINEのURL（https://line.me/ または https://lin.ee/）を指定してください"
    },
    allow_blank: true

  def line_guidance_available?
    friend_add_url.present? && active?
  end
end
```

`line_guidance_available?` メソッドで、URLが設定済みかつLINE連携がアクティブかを一括チェックできます。

### 自動メールでの条件分岐

確認メールを送信する際に、テナントのLineConfig設定と顧客のLINE連携状態をチェックします。

```ruby
# PropertyInquiryMailer
def confirm_to_customer(property_inquiry)
  # ... 既存の処理 ...

  # LINE友だち追加案内（LINE未連携の顧客のみ）
  line_config = @building.tenant&.line_config
  customer = property_inquiry.customer
  if line_config&.line_guidance_available? && customer&.line_user_id.blank?
    @line_friend_add_url = line_config.friend_add_url
  end

  mail(to: @inquiry.email, subject: "...")
end
```

テンプレート側では `@line_friend_add_url.present?` で条件表示するだけです。

```erb
<% if @line_friend_add_url.present? %>
<div style="background: #f0faf4; border: 1px solid #06C755; ...">
  <p>LINEでもお気軽にご相談ください</p>
  <a href="<%= @line_friend_add_url %>" style="background: #06C755; ...">
    LINEで友だち追加する
  </a>
</div>
<% end %>
```

### プレースホルダー置換の仕組み

メールテンプレートのプレースホルダーは送信時にサーバーサイドで置換されます。

```ruby
def replace_template_placeholders(text, customer)
  return text if text.blank?

  tenant = current_user.tenant
  line_config = tenant.line_config

  text.gsub("{{LINE友だち追加URL}}", line_config&.friend_add_url.presence || "")
      .gsub("{{お客様名}}", customer.name.presence || "")
      .gsub("{{会社名}}", tenant.name.presence || "")
      .gsub("{{担当者名}}", current_user.name.presence || "")
end
```

`{{LINE友だち追加URL}}` が設定されていない場合は空文字に置換されるため、テンプレートが壊れることはありません。

### 一括送信のバックグラウンドジョブ

大量の顧客に一括送信する場合、リクエスト中に処理を完了するのは非現実的です。Active Jobでバックグラウンド処理します。

```ruby
class BulkLineGuidanceEmailJob < ApplicationJob
  queue_as :default

  def perform(tenant_id:, customer_ids:, template_id:, sender_user_id:)
    tenant = Tenant.find(tenant_id)
    sender_user = tenant.users.find(sender_user_id)
    template = tenant.email_templates.find(template_id)

    customers = tenant.customers.where(id: customer_ids)
                      .where.not(email: [nil, ""])
                      .where(line_user_id: [nil, ""])

    customers.find_each do |customer|
      inquiry = customer.inquiries.order(created_at: :desc).first
      next unless inquiry

      subject = replace_placeholders(template.subject, ...)
      body = replace_placeholders(template.body, ...)

      activity = customer.add_activity!(...)
      CustomerMailer.send_to_customer(...).deliver_later
    end
  end
end
```

ポイントは2つあります。

1. **ジョブ内でさらに `deliver_later`** — メール送信自体も非同期にすることで、ジョブの実行時間を短縮
2. **`find_each` でメモリ効率を確保** — 大量の顧客でもバッチ処理で安定動作

### フロントエンドの preSelectTemplateName パターン

EmailComposeDialogに `preSelectTemplateName` プロップを追加し、テンプレート読み込み後に名前で自動選択する仕組みを入れました。

```jsx
export default function EmailComposeDialog({
  preSelectTemplateName = null,
  // ...
}) {
  const loadTemplates = async () => {
    const res = await axios.get('/api/v1/email_templates');
    setTemplates(res.data);

    if (preSelectTemplateName) {
      const target = res.data.find(t => t.name === preSelectTemplateName);
      if (target) {
        setSubject(target.subject);
        setBody(target.body);
      }
    }
  };
}
```

CustomerDetailからは2つのEmailComposeDialogインスタンスを使い分けています。

```jsx
{/* 通常のメール作成 */}
<EmailComposeDialog open={emailDialogOpen} ... />

{/* LINE案内メール（テンプレート自動選択） */}
<EmailComposeDialog
  open={lineGuidanceEmailOpen}
  preSelectTemplateName="LINE友だち追加のご案内"
  ...
/>
```

## 活用シーン

### 反響直後のファーストタッチ

物件の問い合わせがあった瞬間、自動返信メールにLINE案内が含まれます。お客様が「この会社、LINEでも連絡できるんだ」と気づいてくれれば、次のやりとりからはLINEでスピーディーに進められます。

### 既存顧客への一斉案内

LINE連携を始めたばかりの不動産会社なら、既存の顧客データベースから「LINE未連携」の顧客を一括抽出し、案内メールを送信。一度の操作で大量の顧客にアプローチできます。

### 内見前のLINE誘導

内見日程の調整はメールより LINEの方が圧倒的にスムーズです。内見予約が入った段階で、まだ LINE未連携のお客様に「LINE案内」ボタンから個別にメールを送り、当日の連絡手段を確保します。

### メールが届きにくい顧客への代替連絡手段

メールの開封追跡（前回実装済み）で「メールが開封されていない」とわかった顧客に、LINE案内を送ることで別の連絡チャネルを確保。コミュニケーションの断絶を防ぎます。

## まとめ

今回の実装のテーマは**「チャネルをつなぐ」**です。

不動産の営業コミュニケーションは、問い合わせフォーム → メール → LINE → 電話 → 対面と、段階的にチャネルが変わっていきます。その中で「メールからLINEへ」の移行をシステムが自然にサポートする仕組みを作りました。

こだわったのは3つです。

1. **自然な導線** — 確認メールに案内を含めることで、お客様に新しいアクションを要求せず、自然に気づいてもらう
2. **柔軟な運用** — 自動・個別・一括の3パターンで、どんな営業スタイルにも対応
3. **安全な設計** — LINE連携済みの顧客には案内を出さない、URLバリデーション、送信対象の自動フィルタリング

メールとLINE、それぞれの強みを活かしながら、お客様との距離を縮める。CoCoスモは、不動産営業のコミュニケーション全体を最適化していきます。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2026-02-14 23:00:00')
  post.commit_hash = '751951c9'
end

puts "✓ 記事作成: #{blog_post_36.title}"
