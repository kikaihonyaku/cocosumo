# バーチャルステージング機能改善計画

このドキュメントは、バーチャルステージング機能のUI/UX改善タスクを管理するものです。

## 進捗状況

| # | タスク | ステータス | 完了日 |
|---|--------|-----------|--------|
| 1 | AI統合機能 | ✅ 完了 | 2025-12-29 |
| 2 | スライダーハンドル改善 | ⏳ 未着手 | - |
| 3 | SNSシェア・QRコード生成 | ⏳ 未着手 | - |
| 4 | 複数バリエーション対応 | ⏳ 未着手 | - |
| 5 | フルスクリーンモード | ⏳ 未着手 | - |
| 6 | 画像ホバープレビュー | ⏳ 未着手 | - |
| 7 | アノテーション機能 | ⏳ 未着手 | - |
| 8 | 埋め込みコード生成 | ⏳ 未着手 | - |

---

## 1. AI統合機能 ✅ 完了

### 実装内容
- `AiStagingDialog.jsx` コンポーネント作成
- Before画像からAIでAfter画像を自動生成
- 5つのスタイルプリセット:
  - **カスタム**: 自由なプロンプト入力（デフォルト）
  - **モダン**: シンプルでクリーンな現代的インテリア
  - **トラディショナル**: 木目調・暖色系のクラシックデザイン
  - **ナチュラル**: 観葉植物・自然素材の明るいインテリア
  - **空室クリーン**: 家具・ゴミを削除して清潔な空室に
- 生成画像をRoomPhotoとして保存
- 進捗表示付き

### 関連ファイル
- `app/frontend/components/VirtualStaging/AiStagingDialog.jsx`
- `app/frontend/pages/VirtualStagingEditor.jsx`

---

## 2. スライダーハンドル改善

### 目的
Before/After比較スライダーの視認性と操作性を向上させる

### 実装予定
- [ ] カスタムスライダーハンドル（矢印アイコン、グラデーション）
- [ ] 初回表示時のアニメーションガイド「← ドラッグして比較 →」
- [ ] キーボード操作対応（矢印キーでスライダー位置変更）
- [ ] タッチ操作改善（ピンチズーム対応）

### 関連ファイル
- `app/frontend/components/VirtualStaging/BeforeAfterSlider.jsx`

### 参考
react-compare-sliderのカスタマイズオプション:
https://react-compare-slider.vercel.app/

---

## 3. SNSシェア・QRコード生成機能

### 目的
公開ページの共有を容易にし、マーケティング効果を高める

### 実装予定
- [ ] SNSシェアボタン追加（LINE、Twitter/X、Facebook）
- [ ] QRコード生成機能（公開URLのQRコード）
- [ ] QRコードダウンロード機能
- [ ] 印刷用レイアウト対応

### 追加ライブラリ候補
- `qrcode.react` - QRコード生成
- `react-share` - SNSシェアボタン

### 関連ファイル
- `app/frontend/pages/PublicVirtualStaging.jsx`
- `app/frontend/pages/VirtualStagingEditor.jsx`（公開後のURL共有部分）

---

## 4. 複数バリエーション対応

### 目的
1つのBefore画像に対して複数のAfterバリエーションを提供

### 実装予定
- [ ] データベース: `virtual_staging_variations` テーブル追加
- [ ] モデル: `VirtualStagingVariation` 作成
- [ ] API: バリエーションCRUD
- [ ] UI: エディタでバリエーション追加・管理
- [ ] 公開ページ: スタイル切り替えボタン

### データ構造案
```ruby
# virtual_staging_variations
- id
- virtual_staging_id (FK)
- after_photo_id (FK)
- style_name (string)
- display_order (integer)
```

### 関連ファイル
- `app/models/virtual_staging_variation.rb`（新規）
- `app/controllers/api/v1/virtual_staging_variations_controller.rb`（新規）
- `app/frontend/pages/VirtualStagingEditor.jsx`
- `app/frontend/pages/PublicVirtualStaging.jsx`

---

## 5. フルスクリーンモード

### 目的
没入感のある体験を提供

### 実装予定
- [ ] フルスクリーン表示ボタン追加
- [ ] Fullscreen API使用
- [ ] ESCキーで終了
- [ ] モバイル対応

### 関連ファイル
- `app/frontend/components/VirtualStaging/BeforeAfterSlider.jsx`
- `app/frontend/pages/PublicVirtualStaging.jsx`
- `app/frontend/pages/VirtualStagingViewer.jsx`

---

## 6. 画像ホバープレビュー

### 目的
写真選択時の効率化

### 実装予定
- [ ] サムネイルホバーで拡大プレビュー表示
- [ ] プレビューにキャプション・カテゴリ表示
- [ ] Before/After選択時に左右並列プレビュー

### 関連ファイル
- `app/frontend/components/VirtualStaging/PhotoSelector.jsx`

---

## 7. アノテーション機能

### 目的
画像上に説明を追加して提案力を向上

### 実装予定
- [ ] 画像上にマーカー/吹き出しを追加
- [ ] ラベル編集（例:「新しいソファ」「ダイニングテーブル」）
- [ ] アノテーションの表示/非表示切り替え
- [ ] アノテーションデータの保存

### データ構造案
```ruby
# virtual_staging_annotations
- id
- virtual_staging_id (FK)
- x_position (decimal)
- y_position (decimal)
- label (string)
- description (text)
```

### 関連ファイル
- `app/models/virtual_staging_annotation.rb`（新規）
- `app/frontend/components/VirtualStaging/AnnotationLayer.jsx`（新規）

---

## 8. 埋め込みコード生成

### 目的
外部サイトへの埋め込みを可能にする

### 実装予定
- [ ] iframe埋め込みコード生成
- [ ] カスタマイズオプション（サイズ、テーマ）
- [ ] コピーボタン
- [ ] 埋め込み専用軽量ページ

### 出力例
```html
<iframe
  src="https://example.com/embed/virtual-staging/abc123"
  width="800"
  height="600"
  frameborder="0"
></iframe>
```

### 関連ファイル
- `app/frontend/pages/EmbedVirtualStaging.jsx`（新規）
- `config/routes.rb`

---

## 技術メモ

### 現在使用中のライブラリ
- `react-compare-slider` v3.1.0 - Before/Afterスライダー
- Material-UI v7.3.4 - UIコンポーネント

### 関連API
- `POST /api/v1/imagen/edit_image` - AI画像編集
- `GET/POST /api/v1/rooms/:room_id/virtual_stagings` - CRUD
- `POST /api/v1/rooms/:room_id/virtual_stagings/:id/publish` - 公開

### 関連モデル
- `VirtualStaging` - メインモデル
- `RoomPhoto` - Before/After画像
- `AiGeneratedImage` - AI生成画像（参考）
