# 記事31: リッチメール機能 — 不動産営業のメールが「伝わる」ものに
blog_post_31 = BlogPost.find_or_create_by!(public_id: 'rich-email-2026') do |post|
  post.title = "リッチメール機能を実装 — 物件写真・HTMLテンプレート・下書き保存で営業メールが変わる"
  post.summary = "Tiptapリッチテキストエディタによる HTML メール作成、物件写真の挿入、物件カード生成、下書き自動保存、ユーザーごとの署名設定など、不動産営業のメールコミュニケーションを一段階引き上げるリッチメール機能を実装しました。"
  post.content = <<~'MARKDOWN'
## はじめに — テキストメールの限界

不動産の営業メールで、こんな経験はありませんか？

> 「物件の写真を送りたいけど、テキストメールだとURLを貼るしかない…」
> 「間取り図と外観を並べて、お客様にパッと伝えたい」
> 「何度も同じ挨拶文を書くのが面倒。テンプレートはあるけど、見た目が味気ない」

CoCoスモには以前からメール送信機能がありましたが、プレーンテキスト形式のみの対応でした。物件写真を見せたい、レイアウトを整えたい、会社のブランドカラーで統一したい——こうした現場の声に応えるため、今回「リッチメール」機能を実装しました。

## リッチメールでできること

### 1. Tiptap エディタによる WYSIWYG 編集

メール本文の作成に、Tiptap（ProseMirror ベース）のリッチテキストエディタを採用しました。Word感覚で直感的に操作できます。

**対応する書式:**
- **太字**・*斜体*・下線
- 見出し（H2/H3）
- 箇条書き・番号付きリスト
- 引用ブロック
- リンク挿入
- テキストカラー（7色）
- テキスト配置（左寄せ・中央・右寄せ）
- 元に戻す・やり直し

```jsx
// EmailEditorArea.jsx — Tiptap エディタの設定
const editor = useEditor({
  extensions: [
    StarterKit.configure({ heading: { levels: [2, 3] } }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
    }),
    Image.configure({
      inline: false,
      allowBase64: false,
      HTMLAttributes: { style: 'max-width: 100%; height: auto;' },
    }),
    Underline,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TextStyle,
    Color,
  ],
});
```

### 2. 物件写真の挿入

案件に紐づく物件の写真を、ワンクリックでメール本文に挿入できます。サイドパネルに物件写真がサムネイル一覧で表示され、選択するとエディタ上にインライン画像として配置されます。

お客様に「この物件の写真、きれいですね！」と言ってもらえるようなメールが、特別な画像編集ツールなしで作れます。

### 3. 物件カードの自動生成

物件情報をまとめた「物件カード」を HTML で自動生成し、メール本文に挿入できます。

```javascript
// PropertyCardInserter.jsx — 物件カード HTML の自動生成
function buildPropertyCardHtml(property) {
  const details = [
    property.room_type,
    property.area ? `${property.area}m²` : null,
    property.rent ? `賃料 ¥${property.rent?.toLocaleString()}` : null,
  ].filter(Boolean).join(' | ');
  // → "1LDK | 45m² | 賃料 ¥85,000"

  // 写真 + 物件名 + 詳細 + 公開ページリンク のカード HTML を返す
}
```

物件名・間取り・賃料・面積がきれいにレイアウトされたカードが1クリックで挿入されるので、複数物件の提案メールも簡単に作れます。

### 4. 下書き自動保存

書きかけのメールは **30秒ごとに自動保存** されます。ブラウザを閉じてしまっても、次に同じ顧客のリッチメール画面を開けば「下書きを復元しますか？」と案内されます。

```javascript
// useEmailComposer.js — 下書き自動保存のロジック
const AUTOSAVE_DELAY = 30000; // 30秒

// 本文が変更されたら自動保存タイマーを起動
useEffect(() => {
  if (!body || !selectedInquiryId) return;
  autosaveTimerRef.current = setTimeout(() => {
    saveDraft();
  }, AUTOSAVE_DELAY);
  return () => clearTimeout(autosaveTimerRef.current);
}, [body, subject]);
```

下書きデータはサーバーサイドの `email_drafts` テーブルに保存されるため、PC間での引き継ぎも可能です。

### 5. メール署名の設定

プロフィール設定画面から、ユーザーごとにメール署名を設定できるようになりました。リッチメール送信時に自動的に署名が本文の末尾に挿入されます。

| 設定場所 | 説明 |
|---------|------|
| プロフィール設定 | 署名テキストを入力・保存 |
| リッチメール画面 | 本文の下に署名が自動表示 |
| 送信時 | 本文 + 署名がまとめて HTML メールとして送信 |

### 6. HTMLテンプレート対応

メールテンプレート管理画面もリッチテキストエディタに対応しました。管理者が作成した HTML テンプレートを、リッチメール画面でそのまま適用できます。

```ruby
# EmailTemplate モデル — body_format カラム追加
validates :body_format, inclusion: { in: %w[text html] }
```

テンプレートに設定したプレースホルダー（`{{お客様名}}`、`{{会社名}}` など）は、送信時にサンプル値でプレビュー確認できます。

## 技術的なこだわり

### 別タブでの編集体験

リッチメール画面は顧客詳細ページから**別タブで開く**設計にしました。

```jsx
// CustomerDetail.jsx — リッチメール起動
<Button
  onClick={() => {
    const url = `/email/compose?customerId=${id}&inquiryId=${selectedInquiryId}`;
    window.open(url, '_blank');
  }}
>
  リッチメール
</Button>
```

顧客詳細画面の対応履歴を見ながらメールを書ける——これが「別タブ」設計の狙いです。3カラムレイアウトの中に無理にエディタを押し込むのではなく、メール作成に集中できる専用画面を用意しました。

### HTML メールのセキュリティ

ユーザーが作成した HTML をそのままメールに含めるのはセキュリティリスクがあります。送信時にサーバーサイドで `ActionController::Base.helpers.sanitize` を使い、許可されたタグ・属性のみに制限しています。

```ruby
# CustomersController — HTML サニタイズ
def sanitize_email_html(html)
  ActionController::Base.helpers.sanitize(
    html,
    tags: %w[p strong em u h2 h3 ul ol li blockquote a img br div span hr],
    attributes: %w[href src alt style target rel width height]
  )
end
```

### 対応履歴での HTML レンダリング

送信した HTML メールは、対応履歴のタイムライン・チャットビューでもリッチに表示されます。`content_format` フィールドが `html` の場合、`dangerouslySetInnerHTML` で安全にレンダリングします（サーバーサイドでサニタイズ済み）。

## 実際の使われ方

### 物件提案メール

案件の物件写真を挿入し、物件カードを並べて「本日の内見候補はこちらの3物件です」と送信。お客様はメールを開くだけで物件の全体像を把握できます。

### 内見後のフォローメール

内見で気に入った物件の写真を改めてメールで送り、「本日ご覧いただいた物件の情報をお送りします」と丁寧にフォロー。テンプレートから呼び出せば、所要時間は1分程度です。

### 新着物件のお知らせ

新しく入った物件の写真と物件カードをメールに挿入して、条件に合うお客様に一斉にご案内。テキストだけの物件名リストとは反応率が違います。

### 契約手続きのご案内

書類一覧を箇条書きで整理し、手続きの流れを番号付きリストで説明。見やすくフォーマットされたメールで、お客様の不安を軽減します。

## まとめ

今回のリッチメール機能は、単なる「HTMLメールが送れるようになった」という話ではありません。

**物件写真をその場で挿入でき、物件カードをワンクリックで生成し、下書きは自動保存され、署名も自動で付く** ——不動産営業のメールワークフロー全体を効率化する機能です。

コンポーネント構成も、`EmailComposer` を中心に `EmailEditorArea`（本文）、`EmailComposerToolbar`（書式バー）、`PropertyImagePicker`（写真挿入）、`PropertyCardInserter`（物件カード）、`AttachmentPanel`（添付ファイル）と責務を分離し、今後の拡張にも対応しやすい設計にしています。

お客様への第一印象はメールで決まることも多い不動産営業。「伝わるメール」が簡単に作れるこの機能が、日々の営業活動の力になれば幸いです。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2026-02-08 12:00:00')
  post.commit_hash = '149a2a2'
end

puts "✓ 記事作成: #{blog_post_31.title}"
