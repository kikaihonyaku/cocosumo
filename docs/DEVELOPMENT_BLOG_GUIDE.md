# 開発者ブログ作成ガイド

このドキュメントは、CoCoスモ開発者ブログの記事を作成する手順をまとめたものです。

## 概要

開発者ブログは `db/seeds/blog_posts/` ディレクトリに記事ごとの個別ファイルとして管理されています。
`db/seeds/blog_posts.rb` はローダーとして機能し、ディレクトリ内のファイルを自動読み込みします。
gitのコミットログから開発内容を抽出し、読み物として面白いストーリー形式で記事を作成します。

## 作成手順

### 1. gitコミットログの確認

```bash
# 最近のコミットを確認
git log --oneline -50

# 特定のコミットの詳細を確認
git show <commit_hash> --stat
git log <commit_hash> -1 --format="%B"
```

### 2. 既存記事の文体確認

`db/seeds/blog_posts/` 内の既存記事を読み、文体・構成を確認します。

**基本構成:**
1. 課題提起（なぜこの機能を作ったのか）
2. 機能の概要（どんな機能？）
3. 使い方・設定方法
4. 技術的な詳細（コードサンプル付き）
5. 活用シーン（実際の使われ方）
6. まとめ・今後の展望

### 3. 記事の作成

`db/seeds/blog_posts/` に新しいファイルを作成します。ファイル名は `NNN_slug.rb` の形式です（例: `027_feature_name.rb`）。

```ruby
# 記事N: タイトル
blog_post_N = BlogPost.find_or_create_by!(public_id: 'unique-id-YYYY') do |post|
  post.title = "記事タイトル"
  post.summary = "記事の要約（1-2文）"
  post.content = <<~'MARKDOWN'
## 見出し1

本文...

### 小見出し

本文...

```ruby
# コードサンプル
```

## 見出し2

...
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('YYYY-MM-DD HH:MM:SS')
  post.commit_hash = 'コミットハッシュ（7桁）'
end

puts "✓ 記事作成: #{blog_post_N.title}"
```

### 4. seedの実行

```bash
# ブログ記事のseedのみ実行
bin/rails runner 'load Rails.root.join("db/seeds/blog_posts.rb")'

# または全seed実行（既存データがある場合はエラーになる可能性あり）
bin/rails db:seed
```

## 記事の書き方のポイント

### 文体

- 「です・ます」調で統一
- 読者に語りかけるような口調
- 専門用語は適度に説明を入れる

### 構成のコツ

1. **課題から始める**: 読者が共感できる課題を提示
   > 「不動産の内見で、お客様からよく聞かれる質問があります。」

2. **引用で臨場感**: お客様の声などを引用形式で
   > 「駅から物件まで、どんな道を歩くんですか？」

3. **コードサンプル**: 技術ブログとして、適度にコードを含める
   - Ruby (バックエンド)
   - JavaScript/JSX (フロントエンド)
   - YAML (設定)

4. **表で比較**: 機能の違いなどは表形式で整理

5. **活用シーンは具体的に**: 実際のユースケースを3-4個列挙

### 特別な記事（年末など）

- 年末: 1年の振り返り + 感謝 + 来年への展望
- 新機能リリース: ストーリー性を持たせる
- マイルストーン: 開発の背景や思いを込める

## BlogPostモデルの属性

| 属性 | 説明 |
|------|------|
| public_id | ユニークID（URL用、例: 'route-slideshow-2025'） |
| title | 記事タイトル |
| summary | 要約（1-2文、一覧表示用） |
| content | 本文（Markdown形式） |
| status | 公開状態（:draft / :published） |
| published_at | 公開日時 |
| commit_hash | 関連するgitコミットハッシュ |

## コマンドまとめ

```bash
# コミットログ確認
git log --oneline -50
git show <hash> --stat

# seed実行
bin/rails runner 'load Rails.root.join("db/seeds/blog_posts.rb")'

# 記事数確認
bin/rails runner 'puts BlogPost.count'
```

## 注意事項

- `find_or_create_by!` を使用し、冪等性を確保
- `public_id` は一意であること
- HEREDOC は `<<~'MARKDOWN'`（シングルクォート）で変数補間を回避
- 画像は含めず、テキストとコードで構成
