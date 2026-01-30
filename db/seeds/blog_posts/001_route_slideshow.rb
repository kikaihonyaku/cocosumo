# 記事1: 経路スライドショー機能
blog_post_1 = BlogPost.find_or_create_by!(public_id: 'route-slideshow-2025') do |post|
  post.title = "「駅から物件まで」を疑似体験できる経路スライドショー機能を開発しました"
  post.summary = "最寄り駅から物件までの経路をストリートビューで紹介する機能を実装。お客様に物件周辺の雰囲気を伝えやすくなりました。"
  post.content = <<~'MARKDOWN'
## なぜこの機能を作ったのか

不動産の内見で、お客様からよく聞かれる質問があります。

> 「駅から物件まで、どんな道を歩くんですか？」

物件の間取りや設備はWebで確認できても、**実際に住んだときの通勤・通学路の雰囲気**はなかなか伝わりません。夜道は暗くないか、坂道はきつくないか、コンビニはあるか——こうした「生活動線」の情報は、物件選びの重要な判断材料です。

従来は営業担当が口頭で説明したり、Googleマップを見せたりしていましたが、もっと直感的に伝えられないかと考え、**経路スライドショー機能**を開発しました。

## どんな機能？

### 自動経路計算

Google Directions APIを使用して、指定した2点間の徒歩経路を自動計算します。

```javascript
// 経路計算の例
const response = await directionsService.getDirections({
  origin: { lat: 35.6762, lng: 139.6503 }, // 駅
  destination: { lat: 35.6789, lng: 139.6521 }, // 物件
  travelMode: 'WALKING'
});
```

### ストリートビューポイントの自動生成

経路に沿って**10m間隔**でストリートビューのポイントを自動取得します。さらに、**30度以上の方向変化**がある曲がり角では追加のポイントを生成し、道順がわかりやすくなっています。

```ruby
# 曲がり角検出のロジック
def significant_turn?(prev_heading, current_heading)
  angle_diff = (current_heading - prev_heading).abs
  angle_diff = 360 - angle_diff if angle_diff > 180
  angle_diff >= 30
end
```

### スライドショー再生

生成されたポイントをスライドショー形式で再生できます。

- **インラインモード**: 地図パネル内でコンパクトに再生
- **フルスクリーンモード**: 大画面でサムネイル一覧付き
- **再生速度調整**: 0.5x〜3xで調整可能
- **キーボード操作**: 矢印キーで前後移動

## 技術的なこだわり

### Haversine公式による距離計算

2点間の距離計算には、地球の曲率を考慮したHaversine公式を使用しています。

```javascript
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // 地球の半径（メートル）
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```

### 方位角の計算

各ポイントでストリートビューのカメラをどの方向に向けるか、進行方向の方位角を計算しています。

```javascript
function calculateHeading(from, to) {
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(to.lat));
  const x = Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) -
            Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(dLng);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}
```

## 実際の使われ方

### 遠方のお客様への事前案内

首都圏の物件を地方から検討されているお客様に、内見前に周辺環境をお伝えできます。

### 物件詳細ページへの埋め込み

作成したスライドショーは物件公開ページに埋め込み可能。お客様自身で経路を確認できます。

### 複数経路の比較

駅から物件まで複数のルートがある場合、それぞれを登録して比較検討の材料にできます。

## 今後の展望

- 自転車・バス経路への対応
- 経路上のPOI（コンビニ、スーパー等）の自動検出
- 夜間のストリートビュー対応（Googleの対応待ち）

「百聞は一見にしかず」——経路スライドショーで、物件周辺の雰囲気をもっと伝えやすくしていきます。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2025-12-21 21:00:00')
  post.commit_hash = '8174653'
end

puts "✓ 記事作成: #{blog_post_1.title}"
