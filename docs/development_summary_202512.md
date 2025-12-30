# CoCoスモ 開発サマリー（2024年11月〜2025年12月）

## 概要

CoCoスモは不動産会社向けの物件管理・マーケティングプラットフォームです。
本ドキュメントでは、2024年11月から2025年12月までの開発内容をまとめます。

**総コミット数**: 269コミット

---

## 主要機能一覧

### 1. 物件公開ページ（Property Publication）

顧客向けに物件情報を公開するためのページを作成・管理する機能です。

#### Phase 1-8 で実装した機能

| フェーズ | 機能 | 説明 |
|---------|------|------|
| Phase 1 | 基本機能 | 物件情報・写真の公開ページ作成 |
| Phase 2 | 問い合わせ機能 | 公開ページからの問い合わせフォーム |
| Phase 3 | アナリティクス | ページビュー・スクロール深度・滞在時間の追跡 |
| Phase 4 | UX改善 | アクセシビリティ対応、パフォーマンス最適化 |
| Phase 5 | ビジネス機能 | QRコード生成、SNSシェア |
| Phase 6 | SEO対策 | メタタグ最適化、OGP、構造化データ |
| Phase 7 | 一括操作 | 複数公開ページの一括公開/非公開 |
| Phase 8 | 高度な機能 | パスワード保護、有効期限、詳細分析 |

#### 技術的特徴

- **パスワード保護**: 特定の顧客のみがアクセスできるよう保護
- **スケジュール公開**: 指定日時に自動公開/非公開
- **分析ダッシュボード**: デバイス別・時間帯別アクセス統計
- **AI ALT生成**: Gemini AIによる画像ALTテキスト自動生成

---

### 2. バーチャルステージング（Virtual Staging）

空室写真にAIで家具を配置し、Before/After比較ができる機能です。

#### 主要機能

- **AI画像生成**: Google Imagen AIによる家具配置
- **5つのスタイルプリセット**:
  - モダン
  - トラディショナル
  - ナチュラル
  - 空室クリーン
  - カスタム（自由なプロンプト）
- **Before/Afterスライダー**: ドラッグで比較表示
- **複数バリエーション対応**: 1つの写真に複数パターン
- **アノテーション機能**: 画像上にマーカー・説明を追加
- **埋め込みコード生成**: 外部サイトへのiframe埋め込み

---

### 3. VRツアー（VR Tour）

360度パノラマ写真でバーチャルルームツアーを作成する機能です。

#### 主要機能

- **シーン管理**: 複数の360度写真をシーンとして管理
- **ホットスポット**: クリックで別シーンに移動するポイント
- **情報ホットスポット**: 詳細情報を表示するポイント
- **オートプレイ**: 自動回転、シーン自動切り替え
- **ジャイロスコープ対応**: スマホの傾きで操作
- **シーン切り替えトランジション**: フェードアニメーション
- **キーボード操作**: 矢印キーでシーン移動
- **埋め込みコード生成**: 外部サイトへのiframe埋め込み
- **SNSシェア・QRコード**: LINE/X/Facebook共有

---

### 4. 地図システム（Map System）

GISベースの物件管理・検索システムです。

#### 主要機能

- **物件表示**: Google Maps上に物件ピンを表示
- **範囲検索**: 矩形・ポリゴンによる範囲指定
- **半径検索**: 指定地点からの半径検索
- **レイヤー管理**: 学区・行政区域などのGeoJSONレイヤー
- **店舗管理**: 店舗マスタと店舗別フィルタ
- **住所ポイント**: 住所から座標を取得してピン表示

#### 経路スライドショー機能

最寄り駅から物件までの経路をストリートビューで紹介する機能です。

- **Google Directions API連携**: 徒歩経路を自動計算
- **ストリートビューポイント生成**: 10m間隔で自動取得
- **曲がり角検出**: 30度以上の方向変化でポイント追加
- **スライドショー再生**: インライン・フルスクリーン対応
- **再生速度調整**: 0.5x〜3x

---

### 5. 店舗管理（Store Management）

マルチテナント対応の店舗マスタ管理機能です。

#### 主要機能

- **店舗マスタCRUD**: 店舗情報の登録・編集・削除
- **ジオコーディング**: 住所から座標を自動取得
- **建物紐付け**: 建物と店舗の関連付け
- **店舗フィルタ**: 地図・一覧画面での店舗別絞り込み

---

### 6. テスト基盤（Test Infrastructure）

品質向上のための自動テスト環境を構築しました。

#### Backend（RSpec）

- **テストフレームワーク**: RSpec 7.0
- **テストデータ**: FactoryBot
- **マッチャー**: Shoulda Matchers
- **カバレッジ**: SimpleCov
- **APIモック**: VCR/WebMock

対象:
- モデルテスト（PropertyPublication, Building, Owner, BuildingRoute）
- サービステスト（DirectionsService, VertexAiGroundingService）
- コントローラテスト（Auth API, PropertyPublications API）
- Jobテスト（ProcessScheduledPublicationsJob）

#### Frontend（Vitest）

- **ユニットテスト**: propertyFilterUtils, formValidation
- **フックテスト**: usePropertyFilter
- **React Testing Library**: コンポーネントテスト

#### CI/CD（GitHub Actions）

- **test_backend**: PostGIS 16 + RSpec実行
- **test_frontend**: Node.js 20 + Vitest実行
- **カバレッジレポート**: 自動生成・アップロード

---

### 7. ユーティリティ・フック群（Phase 9-17）

再利用可能なユーティリティ関数とReactフックを体系的に整備しました。

#### ユーティリティ関数

| ファイル | 機能 |
|----------|------|
| animationUtils.js | 20種以上のイージング関数、スプリング物理 |
| geoUtils.js | Haversine距離計算、ポリゴン判定、クラスタリング |
| searchUtils.js | 日本語トークナイザー、ファジー検索 |
| notificationUtils.js | 通知キュー管理、ブラウザ通知API |
| dateUtils.js | 日付フォーマット、相対時間表示 |
| validationUtils.js | バリデーションスキーマ |

#### Reactフック

| フック | 機能 |
|--------|------|
| useAnimation | スプリングアニメーション、パララックス |
| useGeolocation | GPS追跡、ジオフェンス、コンパス |
| useSearch | 全文検索、ファセットフィルター |
| useNotificationQueue | 通知管理、確認ダイアログ |
| useInfiniteScroll | 無限スクロール |
| useLocalStorage | ローカルストレージ同期 |

---

## 技術スタック

### Backend

- Ruby on Rails 8.0
- PostgreSQL + PostGIS（GIS拡張）
- Active Storage（ファイル保存）
- Cloudflare R2（本番ストレージ）

### Frontend

- React 19
- Vite（ビルドツール）
- MUI（Material-UI）
- Tailwind CSS
- Google Maps JavaScript API
- react-syntax-highlighter（コードハイライト）

### AI/ML

- Google Gemini AI（画像認識・テキスト生成）
- Google Imagen AI（画像生成）
- Vertex AI（グラウンディング）

### インフラ

- Google Cloud Run（本番環境）
- Docker（コンテナ化）
- GitHub Actions（CI/CD）

---

## 今後の展望

1. **モバイルアプリ対応**: PWA機能の強化
2. **AI機能拡充**: 物件説明文の自動生成
3. **外部連携**: SUUMO、HOME'Sなどとの連携
4. **分析機能強化**: 機械学習による物件価格予測
