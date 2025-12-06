# Docker開発環境セットアップガイド

## 前提条件

- Docker
- Docker Compose
- Git

## Omarchy Linux (Arch) でのDockerインストール

```bash
# Docker インストール
sudo pacman -S docker docker-compose

# Docker サービスを有効化・起動
sudo systemctl enable docker
sudo systemctl start docker

# ユーザーをdockerグループに追加（再ログイン必要）
sudo usermod -aG docker $USER

# 確認
docker --version
docker compose version
```

---

## クイックスタート

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-repo/cocosumo.git
cd cocosumo
```

### 2. 環境変数ファイルの作成

```bash
# .env ファイルを作成
cp .env.example .env

# 必要に応じて編集（Google API キーなど）
nano .env
```

### 3. Dockerコンテナの起動

```bash
# 初回ビルド＆起動
docker compose -f docker-compose.development.yml up --build

# バックグラウンドで起動する場合
docker compose -f docker-compose.development.yml up -d --build
```

### 4. データベースのセットアップ

```bash
# 別ターミナルで実行（または -d オプション使用時）
docker compose -f docker-compose.development.yml exec web bin/rails db:create
docker compose -f docker-compose.development.yml exec web bin/rails db:migrate
docker compose -f docker-compose.development.yml exec web bin/rails db:seed
```

### 5. Vite開発サーバーの起動

Railsサーバーとは別に、Vite開発サーバーを起動する必要があります：

```bash
docker compose -f docker-compose.development.yml exec web npm run dev -- --host 0.0.0.0
```

または、`bin/dev`を使う場合（Procfile.devを使用）：

```bash
docker compose -f docker-compose.development.yml exec web bin/dev
```

### 6. アクセス

- **Rails**: http://localhost:3000
- **Vite HMR**: http://localhost:5173

---

## 日常的な操作コマンド

### コンテナの起動・停止

```bash
# 起動
docker compose -f docker-compose.development.yml up -d

# 停止
docker compose -f docker-compose.development.yml down

# 再起動
docker compose -f docker-compose.development.yml restart

# ログ確認
docker compose -f docker-compose.development.yml logs -f web
docker compose -f docker-compose.development.yml logs -f db
```

### Rails コマンド

```bash
# Rails コンソール
docker compose -f docker-compose.development.yml exec web bin/rails console

# マイグレーション
docker compose -f docker-compose.development.yml exec web bin/rails db:migrate

# ルート確認
docker compose -f docker-compose.development.yml exec web bin/rails routes

# シェルに入る
docker compose -f docker-compose.development.yml exec web bash
```

### データベース操作

```bash
# PostgreSQL に接続
docker compose -f docker-compose.development.yml exec db psql -U cocosumo -d cocosumo_development

# データベースリセット
docker compose -f docker-compose.development.yml exec web bin/rails db:reset
```

---

## ホットリロード設定

ソースコードの変更はボリュームマウントにより自動反映されます。ただし、以下の場合はコンテナ再起動が必要：

- Gemfile の変更 → `docker compose -f docker-compose.development.yml exec web bundle install`
- package.json の変更 → `docker compose -f docker-compose.development.yml exec web npm install`

---

## トラブルシューティング

### ポートが使用中

```bash
# 使用中のポートを確認
lsof -i :3000
lsof -i :5432

# 必要に応じてプロセスを終了
kill -9 <PID>
```

### データベース接続エラー

```bash
# DBコンテナの状態確認
docker compose -f docker-compose.development.yml ps db
docker compose -f docker-compose.development.yml logs db

# DBコンテナを再起動
docker compose -f docker-compose.development.yml restart db
```

### ボリュームのクリア（完全リセット）

```bash
# すべてのコンテナとボリュームを削除
docker compose -f docker-compose.development.yml down -v

# 再ビルド
docker compose -f docker-compose.development.yml up --build
```

### 権限エラー（Linux）

```bash
# ファイルの所有者を変更
sudo chown -R $USER:$USER .
```

---

## VS Code との連携

VS Code の Remote - Containers 拡張機能を使うと、コンテナ内で直接開発できます：

1. VS Code に「Dev Containers」拡張機能をインストール
2. コマンドパレット → "Dev Containers: Attach to Running Container"
3. `cocosumo_web` を選択

---

## 開発のヒント

### エイリアス設定（~/.bashrc または ~/.zshrc）

```bash
alias dc='docker compose -f docker-compose.development.yml'
alias dcr='docker compose -f docker-compose.development.yml exec web bin/rails'
```

使用例：
```bash
dc up -d           # 起動
dc down            # 停止
dcr console        # Rails コンソール
dcr db:migrate     # マイグレーション
```
