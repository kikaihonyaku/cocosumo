# VRルームツアー機能改善計画

このドキュメントは、VRルームツアー機能のUI/UX改善タスクを管理するものです。

## 進捗状況

| # | タスク | ステータス | 完了日 |
|---|--------|-----------|--------|
| 1 | オートプレイ / ガイドツアーモード | ✅ 完了 | 2025-12-29 |
| 2 | SNSシェア・QRコード機能 | ✅ 完了 | 2025-12-29 |
| 3 | 情報ホットスポット（インフォスポット） | ✅ 完了 | 2025-12-29 |
| 4 | ジャイロスコープ対応 | ✅ 完了 | 2025-12-29 |
| 5 | 埋め込みコード生成 | ✅ 完了 | 2025-12-29 |
| 6 | シーン切り替えトランジション | ✅ 完了 | 2025-12-29 |
| 7 | 音声ガイド / BGM | ⏳ 未着手 | - |
| 8 | キーボード操作対応 | ✅ 完了 | 2025-12-29 |
| 9 | ホットスポットプレビュー | ⏳ 未着手 | - |
| 10 | 初期視点プリセット | ⏳ 未着手 | - |

---

## 1. オートプレイ / ガイドツアーモード ✅ 完了

### 目的
不動産内見のように自動でツアーを進行させる機能

### 実装内容
- [x] オートローテーション機能（360度自動回転）
- [x] シーン自動切り替え（設定秒数後に次のシーンへ）
- [x] 一時停止/再開コントロール
- [x] 進行バー表示（全体の何%を見たか）
- [x] オートプレイ設定パネル（回転速度、シーン滞在時間）

### 技術メモ
- photo-sphere-viewerの`autorotate`プラグインを使用
- @photo-sphere-viewer/autorotate-plugin

### 関連ファイル
- `app/frontend/components/VRTour/PanoramaViewer.jsx` - forwardRef追加、autorotateプラグイン統合
- `app/frontend/components/VRTour/VrTourViewerContent.jsx` - オートプレイロジック追加
- `app/frontend/components/VRTour/AutoplayControls.jsx` - 新規作成

---

## 2. SNSシェア・QRコード機能 ✅ 完了

### 目的
公開ページの共有を容易にし、マーケティング効果を高める

### 実装内容
- [x] SNSシェアボタン追加（LINE、Twitter/X、Facebook）
- [x] QRコード生成機能
- [x] QRコードダウンロード機能
- [x] 公開ページに共有パネル配置

### 技術メモ
- Virtual Stagingで作成した`SharePanel`コンポーネントを再利用
- `qrcode.react`ライブラリ（インストール済み）

### 関連ファイル
- `app/frontend/components/VirtualStaging/SharePanel.jsx` - 再利用
- `app/frontend/components/VRTour/VrTourViewerContent.jsx` - SharePanel統合
- `app/frontend/pages/PublicVrTour.jsx` - publicUrl渡し

---

## 3. 情報ホットスポット（インフォスポット） ✅ 完了

### 目的
シーン内で設備説明やポイントをインタラクティブに表示

### 実装内容
- [x] ホットスポットタイプに`info`を追加
- [x] クリックで情報パネル表示
- [x] 情報パネルに画像・テキスト・リンクを設定可能
- [x] HotspotEditorにinfo type用のフォームを追加

### データ構造
```javascript
{
  id: "unique-id",
  type: "info",  // "scene_link" | "info"
  text: "南向きの窓",
  yaw: 180,
  pitch: 0,
  data: {
    type: "info",
    title: "採光抜群の窓",
    description: "南向きで日当たり良好。冬でも暖かいです。",
    image_url: "https://...",  // オプション
    link_url: "https://...",   // オプション
    link_text: "詳細を見る"    // オプション
  }
}
```

### 関連ファイル
- `app/frontend/components/VRTour/HotspotEditor.jsx` - infoタイプ用フォーム追加
- `app/frontend/components/VRTour/VrTourViewerContent.jsx` - 情報パネル表示
- `app/frontend/components/VRTour/InfoHotspotPanel.jsx` - 新規作成

---

## 4. ジャイロスコープ対応（スマホVR） ✅ 完了

### 目的
スマートフォンを動かして360度見回す没入体験

### 実装内容
- [x] DeviceOrientation API対応
- [x] ジャイロON/OFFトグルボタン
- [x] 権限リクエストダイアログ（iOS 13+対応）
- [x] モバイルデバイスでのみボタン表示

### 技術メモ
- photo-sphere-viewerの`gyroscope`プラグインを使用
- @photo-sphere-viewer/gyroscope-plugin
- iOS 13+では明示的な権限リクエストが必要

### 関連ファイル
- `app/frontend/components/VRTour/PanoramaViewer.jsx` - GyroscopePlugin統合
- `app/frontend/components/VRTour/VrTourViewerContent.jsx` - ボタン配置
- `app/frontend/components/VRTour/GyroscopeButton.jsx` - 新規作成

---

## 5. 埋め込みコード生成 ✅ 完了

### 目的
外部WebサイトへのVRツアー埋め込み

### 実装内容
- [x] iframe埋め込みコード生成
- [x] レスポンシブ/固定サイズ切り替え
- [x] オートプレイオプション
- [x] 埋め込み専用軽量ページ
- [x] コピーボタン

### 出力例
```html
<div style="position: relative; width: 100%; padding-bottom: 56.25%; overflow: hidden;">
  <iframe
    src="https://example.com/embed/vr/abc123?autoplay=true"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
    title="VRツアー"
    loading="lazy"
    allowfullscreen
  ></iframe>
</div>
```

### 関連ファイル
- `app/frontend/components/VRTour/EmbedCodePanel.jsx` - 新規作成
- `app/frontend/pages/EmbedVrTour.jsx` - 新規作成
- `app/frontend/App.jsx` - ルート追加 `/embed/vr/:publicId`

---

## 6. シーン切り替えトランジション ✅ 完了

### 目的
シーン間移動の視覚的演出で没入感を向上

### 実装内容
- [x] フェードイン/アウト効果
- [x] パルスアニメーション付きローディング
- [x] シーン名表示

### 技術メモ
- MUI Fade/Zoomコンポーネントでアニメーション
- CSSアニメーションでパルス効果

### 関連ファイル
- `app/frontend/components/VRTour/VrTourViewerContent.jsx` - トランジションロジック
- `app/frontend/components/VRTour/SceneTransition.jsx` - 新規作成

---

## 7. 音声ガイド / BGM

### 目的
不動産ツアーにナレーションを追加して魅力を伝える

### 実装予定
- [ ] シーンごとに音声ファイルをアップロード
- [ ] 自動再生 / ミュート切り替え
- [ ] BGM設定（ツアー全体）
- [ ] 音量コントロール
- [ ] 音声再生プログレスバー

### データ構造案
```ruby
# vr_scenes テーブルに追加
- audio_file (ActiveStorage attachment)
- audio_autoplay (boolean, default: true)

# vr_tours テーブルに追加
- bgm_file (ActiveStorage attachment)
- bgm_volume (decimal, default: 0.3)
```

### 関連ファイル
- `app/models/vr_scene.rb`
- `app/models/vr_tour.rb`
- `app/frontend/components/VRTour/AudioPlayer.jsx`（新規）
- `db/migrate/xxx_add_audio_to_vr.rb`（新規）

---

## 8. キーボード操作対応 ✅ 完了

### 目的
デスクトップでの操作性向上

### 実装内容
- [x] 矢印キー (←→): 前後のシーンに移動
- [x] N/P キー: 次/前のシーンに移動
- [x] 数字キー (1-9): シーン直接ジャンプ
- [x] スペース: オートプレイ一時停止/再開
- [x] F: フルスクリーン切り替え
- [x] Escape: ドロワー/フッター閉じる

### 関連ファイル
- `app/frontend/components/VRTour/VrTourViewerContent.jsx` - キーボードイベントハンドラー追加

---

## 9. ホットスポットプレビュー

### 目的
移動先の確認で迷子を防止

### 実装予定
- [ ] ホットスポットホバーで移動先シーンのサムネイル表示
- [ ] シーン名と簡単な説明
- [ ] Tooltip/Popover形式で表示
- [ ] タッチデバイスではロングプレスで表示

### 関連ファイル
- `app/frontend/components/VRTour/PanoramaViewer.jsx`
- `app/frontend/components/VRTour/HotspotPreview.jsx`（新規）

---

## 10. 初期視点プリセット

### 目的
初期視点設定の簡易化

### 実装予定
- [ ] 「現在の視点を初期視点に設定」ボタン
- [ ] プリセットボタン（正面、左90°、右90°、後ろ）
- [ ] 視覚的なコンパス/方位表示
- [ ] yaw/pitch数値入力も可能

### 関連ファイル
- `app/frontend/components/VRTour/HotspotEditor.jsx`
- `app/frontend/components/VRTour/InitialViewSelector.jsx`（新規）

---

## 技術メモ

### 現在使用中のライブラリ
- `@photo-sphere-viewer/core` v5.14.0 - パノラマビューア
- `@photo-sphere-viewer/markers-plugin` v5.14.0 - マーカー表示
- `react-compare-slider` v3.1.0 - Before/After比較
- `@dnd-kit/core` v6.3.1 - ドラッグ&ドロップ
- Material-UI v7.3.4 - UIコンポーネント

### 追加予定ライブラリ
- `@photo-sphere-viewer/autorotate-plugin` - オートローテーション
- `@photo-sphere-viewer/gyroscope-plugin` - ジャイロスコープ

### 関連API
- `GET/POST /api/v1/rooms/:room_id/vr_tours` - CRUD
- `GET/POST /api/v1/vr_tours/:id/vr_scenes` - シーンCRUD
- `POST /api/v1/rooms/:room_id/vr_tours/:id/publish` - 公開
- `GET /api/v1/vr_tours/:public_id/public` - 公開ページ表示

### 関連モデル
- `VrTour` - ツアー本体
- `VrScene` - シーン（hotspots JSON含む）
- `RoomPhoto` - 360度画像
