# ローカルLinux環境でのProduction運用ガイド

## アーキテクチャ

```
[インターネット]
      ↓
[Cloudflare] (SSL/CDN/WAF)
      ↓ (Tunnel)
[アプリサーバー Linux]
├── cloudflared (systemd)
└── Docker
      └── Rails (Puma) :8080
              ↓ (TCP/IP)
[DBサーバー Linux]
└── PostgreSQL + PostGIS
```

---

## 1. DBサーバーのセットアップ

### PostgreSQL + PostGIS のインストール (Ubuntu/Debian)

```bash
# PostgreSQL + PostGIS インストール
sudo apt update
sudo apt install postgresql postgresql-contrib postgis postgresql-16-postgis-3

# PostgreSQL 起動
sudo systemctl enable postgresql
sudo systemctl start postgresql

# ユーザーとDB作成
sudo -u postgres psql
```

```sql
-- PostgreSQL内で実行
CREATE USER cocosumo WITH PASSWORD 'your_secure_password';
CREATE DATABASE cocosumo_production OWNER cocosumo;
\c cocosumo_production
CREATE EXTENSION postgis;
GRANT ALL PRIVILEGES ON DATABASE cocosumo_production TO cocosumo;
\q
```

### 外部接続の許可

```bash
# postgresql.conf を編集
sudo nano /etc/postgresql/16/main/postgresql.conf
```

```
listen_addresses = '*'  # または特定のIP
```

```bash
# pg_hba.conf を編集
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

```
# アプリサーバーからの接続を許可（IPを適宜変更）
host    cocosumo_production    cocosumo    192.168.x.x/32    scram-sha-256
```

```bash
# 再起動
sudo systemctl restart postgresql
```

---

## 2. アプリサーバーのセットアップ

### Docker インストール (Ubuntu/Debian)

```bash
# 公式リポジトリからインストール
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# ユーザーをdockerグループに追加
sudo usermod -aG docker $USER

# Docker Compose インストール
sudo apt install docker-compose-plugin

# 確認
docker --version
docker compose version
```

### cloudflared インストール

```bash
# Cloudflare公式リポジトリ追加
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared focal main' | sudo tee /etc/apt/sources.list.d/cloudflared.list

# インストール
sudo apt update
sudo apt install cloudflared

# 確認
cloudflared --version
```

### Cloudflare Tunnel 設定

```bash
# Cloudflareにログイン（ブラウザが開く）
cloudflared tunnel login

# トンネル作成
cloudflared tunnel create cocosumo-production

# 設定ファイル作成
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

```yaml
# ~/.cloudflared/config.yml
tunnel: <TUNNEL_ID>
credentials-file: /home/<username>/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: cocosumo.space  # あなたのドメイン
    service: http://localhost:8080
  - service: http_status:404
```

```bash
# Cloudflare DNS にルーティング設定
cloudflared tunnel route dns cocosumo-production cocosumo.space

# systemd サービス化
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

# 状態確認
sudo systemctl status cloudflared
```

---

## 3. アプリケーションのデプロイ

### リポジトリ取得

```bash
cd /opt  # または任意のディレクトリ
sudo git clone https://github.com/your-repo/cocosumo.git
sudo chown -R $USER:$USER cocosumo
cd cocosumo
```

### 環境変数設定

```bash
# サンプルからコピー
cp .env.production.example .env.production

# 編集
nano .env.production
```

**必須項目:**
- `RAILS_MASTER_KEY` - config/master.key の内容
- `DATABASE_URL` - PostgreSQLへの接続URL

### Dockerイメージのビルドと起動

```bash
# ビルド
docker compose -f docker-compose.production.yml build

# 起動
docker compose -f docker-compose.production.yml up -d

# ログ確認
docker compose -f docker-compose.production.yml logs -f

# 状態確認
docker compose -f docker-compose.production.yml ps
```

### データベースマイグレーション

```bash
# マイグレーション実行
docker compose -f docker-compose.production.yml exec web bin/rails db:migrate

# 必要に応じてシード
docker compose -f docker-compose.production.yml exec web bin/rails db:seed
```

---

## 4. 運用コマンド

### 基本操作

```bash
# 起動
docker compose -f docker-compose.production.yml up -d

# 停止
docker compose -f docker-compose.production.yml down

# 再起動
docker compose -f docker-compose.production.yml restart

# ログ確認
docker compose -f docker-compose.production.yml logs -f web

# Railsコンソール
docker compose -f docker-compose.production.yml exec web bin/rails console
```

### 更新デプロイ

```bash
cd /opt/cocosumo

# コード取得
git pull origin main

# 再ビルド＆起動
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d

# マイグレーション（必要な場合）
docker compose -f docker-compose.production.yml exec web bin/rails db:migrate
```

### トラブルシューティング

```bash
# コンテナ内に入る
docker compose -f docker-compose.production.yml exec web bash

# ヘルスチェック
curl http://localhost:8080/up

# cloudflared 状態確認
sudo systemctl status cloudflared
sudo journalctl -u cloudflared -f
```

---

## 5. バックアップ

### PostgreSQL バックアップ (DBサーバーで実行)

```bash
# 日次バックアップスクリプト例
pg_dump -U cocosumo -h localhost cocosumo_production | gzip > /backup/cocosumo_$(date +%Y%m%d).sql.gz
```

### Docker ボリュームバックアップ（必要な場合）

```bash
# アップロードされたファイルなど
docker compose -f docker-compose.production.yml exec web tar czf - /rails/storage > storage_backup.tar.gz
```

---

## 6. セキュリティチェックリスト

- [ ] PostgreSQL は外部から直接アクセス不可（ファイアウォール設定）
- [ ] `.env.production` は `.gitignore` に含まれている
- [ ] `RAILS_MASTER_KEY` は安全に管理
- [ ] Cloudflare WAF ルールを設定
- [ ] SSL/TLS は Cloudflare で終端
- [ ] 定期バックアップを設定
