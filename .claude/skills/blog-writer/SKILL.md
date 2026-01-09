---
name: blog-writer
description: CoCoスモの開発者ブログ記事を作成するスキル。「ブログを書いて」「開発ブログを作成」「blog post」などのリクエスト時に使用。
---

# 開発者ブログ作成スキル

CoCoスモの開発者ブログ記事を作成するためのスキルです。

## 使用方法

1. まず [開発者ブログガイド](../../../docs/DEVELOPMENT_BLOG_GUIDE.md) を読んで、文体・構成を確認
2. `db/seeds/blog_posts.rb` の既存記事を参考にする
3. ガイドに従って記事を作成

## 記事の基本構成

1. **課題提起** - なぜこの機能を作ったのか（読者が共感できる課題）
2. **機能の概要** - どんな機能？（スクリーンショットの代わりにコード例で説明）
3. **使い方・設定方法** - 実際の利用手順
4. **技術的な詳細** - コードサンプル付き（Ruby/JavaScript/JSX）
5. **活用シーン** - 実際の使われ方（3-4個のユースケース）
6. **まとめ・今後の展望** - 締めくくり

## 文体

- 「です・ます」調で統一
- 読者に語りかけるような口調
- 専門用語は適度に説明を入れる
- 引用形式（`>`）でお客様の声などを表現

## BlogPostモデルの属性

| 属性 | 説明 |
|------|------|
| public_id | ユニークID（URL用、例: 'feature-name-2026'） |
| title | 記事タイトル |
| summary | 要約（1-2文、一覧表示用） |
| content | 本文（Markdown形式） |
| status | 公開状態（:draft / :published） |
| published_at | 公開日時 |
| commit_hash | 関連するgitコミットハッシュ |

## 記事追加のテンプレート

```ruby
blog_post_N = BlogPost.find_or_create_by!(public_id: 'feature-name-YYYY') do |post|
  post.title = "記事タイトル"
  post.summary = "記事の要約（1-2文）"
  post.content = <<~'MARKDOWN'
## なぜこの機能を作ったのか

課題提起...

## どんな機能？

機能説明...

## 技術的なこだわり

コードサンプル付きの説明...

## 実際の使われ方

ユースケース...

## 今後の展望

将来の計画...

## まとめ

締めくくり...
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('YYYY-MM-DD HH:MM:SS')
  post.commit_hash = 'コミットハッシュ（7桁）'
end

puts "✓ 記事作成: #{blog_post_N.title}"
```

## seed実行コマンド

```bash
bin/rails runner 'load Rails.root.join("db/seeds/blog_posts.rb")'
```
