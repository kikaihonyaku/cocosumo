# CoCoSumo

不動産業務を革新するWebサービス

## 主な機能

- **物件管理**: 建物・部屋情報をGoogleマップ連携のGISシステムで一元管理
- **AI画像生成**: Gemini NanaBananaを活用し、室内写真から「家具なし」「家具あり」の画像を自動生成
- **VRルームツアー**: 360度パノラマビューでVRルームツアーを簡単に作成・編集
- **簡単埋め込み**: 作成したコンテンツはiframeで簡単に外部サイトへ埋め込み可能
- **マルチテナント対応**: 会社ごとに独立した環境を提供
- **管理者機能**: ユーザーアカウントの発行・管理

## 技術スタック

- **Backend**: Ruby on Rails 8.0
- **Frontend**: React 19 + Vite
- **UI**: Material-UI (MUI) v7 + Tailwind CSS v4
- **Database**: SQLite (開発環境)
- **Maps**: Google Maps API

## セットアップ

### 必要な環境

- Ruby 3.3以上
- Node.js 20以上
- SQLite3

### インストール

1. リポジトリをクローン

```bash
git clone <repository-url>
cd cocosumo
```

2. 依存関係をインストール

```bash
# Rubyの依存関係
bundle install

# Node.jsの依存関係
npm install
```

3. データベースをセットアップ

```bash
rails db:create
rails db:migrate
rails db:seed
```

4. 環境変数を設定

`.env.example`をコピーして`.env`ファイルを作成し、必要な環境変数を設定します。

```bash
cp .env.example .env
```

`.env`ファイルを編集して、Google Maps APIキーを設定してください：

```
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

#### Google Maps APIキーの取得方法

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを作成または選択
3. 「APIとサービス」→「認証情報」に移動
4. 「認証情報を作成」→「APIキー」を選択
5. 作成されたAPIキーをコピー
6. 「Maps JavaScript API」を有効化
7. 必要に応じてAPIキーに制限を設定（推奨）

### 開発サーバーの起動

```bash
bin/dev
```

ブラウザで http://localhost:3000 にアクセスしてください。

### テストアカウント

```
管理者:
Email: admin@example.com
Password: password123

一般ユーザー:
Email: member@example.com
Password: password123
```

## プロジェクト構造

```
cocosumo/
├── app/
│   ├── controllers/        # Railsコントローラー
│   ├── models/            # データモデル
│   └── frontend/          # Reactフロントエンド
│       └── cocosumo/
│           ├── pages/     # ページコンポーネント
│           ├── components/# 共有コンポーネント
│           ├── contexts/  # Reactコンテキスト
│           └── theme/     # MUIテーマ設定
├── config/                # Rails設定
├── db/                    # データベース関連
└── public/               # 静的ファイル
```

## ライセンス

All rights reserved.
