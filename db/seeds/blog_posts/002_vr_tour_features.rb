# 記事2: VRツアー機能
blog_post_2 = BlogPost.find_or_create_by!(public_id: 'vr-tour-features-2025') do |post|
  post.title = "VRツアー機能を大幅強化！8つの新機能をリリース"
  post.summary = "360度パノラマVRツアーに、オートプレイ、ジャイロスコープ対応、SNSシェアなど8つの新機能を追加しました。"
  post.content = <<~'MARKDOWN'
## VRツアーがさらに進化しました

不動産の内見をオンラインで完結させたい——そんなニーズに応えるため、CoCoスモではVRツアー機能を提供しています。今回、お客様からのフィードバックをもとに、**8つの新機能**を追加しました。

## 新機能一覧

### 1. オートプレイ機能

パノラマビューが自動で回転し、シーンも自動で切り替わります。展示会でのデモや、お客様への自動案内に最適です。

```jsx
// オートプレイの設定
const autoplayConfig = {
  rotationSpeed: 0.5,      // 回転速度
  sceneInterval: 10000,    // シーン切り替え間隔（ミリ秒）
  pauseOnInteraction: true // 操作時に一時停止
};
```

### 2. ジャイロスコープ対応

スマートフォンを傾けると、その方向にパノラマビューが動きます。まるでその場にいるような体験を提供します。

```javascript
// ジャイロスコープの処理
window.addEventListener('deviceorientation', (event) => {
  const alpha = event.alpha; // Z軸の回転（コンパス方向）
  const beta = event.beta;   // X軸の回転（前後の傾き）
  const gamma = event.gamma; // Y軸の回転（左右の傾き）

  viewer.setOrientation(alpha, beta, gamma);
});
```

### 3. 情報ホットスポット

従来のシーン移動ホットスポットに加え、**情報表示用のホットスポット**を追加。クリックすると詳細情報がパネルで表示されます。

- 設備の説明（エアコン、床暖房など）
- 画像の表示
- 外部リンク

### 4. SNSシェア・QRコード

公開したVRツアーをLINE、X（旧Twitter）、Facebookで簡単にシェアできます。QRコードも生成でき、チラシやパンフレットに印刷可能です。

### 5. シーン切り替えトランジション

シーン間の移動時にフェードアニメーションを追加。より自然な遷移を実現しました。

```jsx
const SceneTransition = ({ isTransitioning }) => (
  <div className={`
    absolute inset-0 bg-black pointer-events-none
    transition-opacity duration-500
    ${isTransitioning ? 'opacity-100' : 'opacity-0'}
  `} />
);
```

### 6. キーボード操作

- **矢印キー**: 上下左右にパノラマ移動
- **数字キー**: 対応するシーンに直接移動
- **スペースキー**: オートプレイの再生/停止

### 7. 埋め込みコード生成

作成したVRツアーを外部サイトに埋め込むためのiframeコードを生成できます。

```html
<iframe
  src="https://cocosumo.space/embed/vr/abc123xyz"
  width="100%"
  height="500"
  frameborder="0"
  allowfullscreen
></iframe>
```

### 8. ミニマップ改善

各シーンのサムネイルをビジュアルで選択できるようになりました。現在地もわかりやすく表示されます。

## 技術的な工夫

### パフォーマンス最適化

360度パノラマは画像サイズが大きくなりがちです。以下の工夫でパフォーマンスを確保しています。

- **プログレッシブローディング**: 低解像度→高解像度の段階読み込み
- **シーンのプリロード**: 次に遷移する可能性のあるシーンを事前読み込み
- **WebGL最適化**: Three.jsのジオメトリ再利用

### アクセシビリティ対応

- キーボードのみでの操作
- スクリーンリーダー対応のラベル
- 高コントラストモード

## 実際の活用シーン

### オンライン内見

遠方のお客様にVRツアーを送付し、事前に物件を確認していただけます。

### 物件サイトへの埋め込み

自社サイトにVRツアーを埋め込み、物件の魅力をアピールできます。

### 展示会でのデモ

オートプレイ機能で、スタッフが付きっきりでなくても物件紹介ができます。

## まとめ

VRツアーは単なる「360度写真の表示」から、**インタラクティブな物件体験ツール**へと進化しました。ぜひ新機能をお試しください。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2025-12-29 12:00:00')
  post.commit_hash = '1571562'
end

puts "✓ 記事作成: #{blog_post_2.title}"
