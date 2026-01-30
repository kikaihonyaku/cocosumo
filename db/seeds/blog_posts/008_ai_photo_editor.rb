# 記事8: AI画像編集機能
blog_post_8 = BlogPost.find_or_create_by!(public_id: 'ai-photo-editor-2025') do |post|
  post.title = "AI画像編集機能で物件写真をワンランクアップ"
  post.summary = "Google Gemini（Nano Banana）を活用したAI画像編集機能で、物件写真を簡単に加工できるようになりました。"
  post.content = <<~'MARKDOWN'
## 物件写真の悩み

不動産の物件写真、こんな悩みはありませんか？

- 「曇りの日に撮影したので、暗い印象になってしまった」
- 「生活感のある家具が写り込んでいる」
- 「窓の外が白飛びしている」

プロのカメラマンに依頼すれば解決しますが、全物件に対応するのは現実的ではありません。

そこで、**AI画像編集機能**の出番です。

## 2種類の編集モード

CoCoスモの画像編集機能には、2つのモードがあります。

### 1. 基本調整モード

スライダーで直感的に調整できます。

- **明るさ**: 暗い写真を明るく
- **コントラスト**: メリハリをつける
- **彩度**: 色味を調整

```javascript
// Canvas APIを使用したリアルタイムフィルター
const applyFilters = (imageData, { brightness, contrast, saturation }) => {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    // 明るさ調整
    data[i] = data[i] + brightness;     // R
    data[i+1] = data[i+1] + brightness; // G
    data[i+2] = data[i+2] + brightness; // B
    // ...コントラスト、彩度の処理
  }
  return imageData;
};
```

プレビューを見ながらリアルタイムで調整できます。

### 2. AI編集モード

Google Gemini 2.5 Flash（開発コード：Nano Banana）を使った、**AIによる自動編集**です。

テキストで指示を出すだけで、AIが画像を加工します。

#### 使用例

```
「窓の外の景色を青空にして」
「床を明るい色のフローリングに変えて」
「家具を消して空室の状態にして」
「全体的に明るく爽やかな印象にして」
```

#### 仕組み

```ruby
# バックエンド処理（簡略化）
def edit_image(image, prompt)
  client = Google::Cloud::AIPlatform::V1::PredictionService::Client.new

  response = client.predict(
    endpoint: gemini_endpoint,
    instances: [{
      prompt: prompt,
      image: { bytesBase64Encoded: Base64.encode64(image) }
    }]
  )

  response.predictions.first
end
```

## 保存オプション

編集した画像は、2つの方法で保存できます。

1. **上書き保存**: 元の画像を置き換え
2. **新規保存**: 別の画像として保存（元の画像を残す）

Before/Afterを比較したい場合は、新規保存がおすすめです。

## 活用シーン

### 内見前の写真補正

曇りの日に撮影した写真を、明るく爽やかな印象に補正。お客様に好印象を与えます。

### 空室イメージの作成

家具が残っている写真から、AIで家具を消して空室イメージを作成。

### 季節感の演出

冬に撮影した庭の写真を、緑豊かな春〜夏の雰囲気に変更。

## 注意点

AI編集は強力ですが、以下の点にご注意ください。

- **実際と異なる印象を与えない**: 広さや間取りを変えるような加工は避ける
- **重要な瑕疵を隠さない**: 壁のひび割れなど、告知すべき情報は隠さない
- **加工であることを明示**: 必要に応じて「イメージ画像」と表記

## まとめ

AI画像編集機能を使えば、**専門知識がなくても**物件写真を簡単に加工できます。

- 基本調整: 明るさ・コントラスト・彩度をスライダーで
- AI編集: テキスト指示で高度な加工

物件の魅力を最大限に引き出す写真で、成約率アップを目指しましょう。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2025-12-03 10:00:00')
  post.commit_hash = '1a80f89'
end

puts "✓ 記事作成: #{blog_post_8.title}"
