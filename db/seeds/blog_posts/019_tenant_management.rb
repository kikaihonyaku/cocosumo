# 記事19: テナント管理機能
blog_post_19 = BlogPost.find_or_create_by!(public_id: 'tenant-management-2026') do |post|
  post.title = "マルチテナント管理機能を実装！サブドメインで複数組織を運用できるようになりました"
  post.summary = "サブドメイン方式によるテナント識別、代理ログイン機能、監査ログなど、マルチテナントSaaSとしての管理基盤を整備しました。"
  post.content = <<~'MARKDOWN'
## なぜこの機能を作ったのか

CoCoスモは、複数の不動産会社が利用できるマルチテナントSaaSとして設計されています。

しかし、これまでは**テナントを管理する画面がなく**、データベースに直接アクセスして操作する必要がありました。

> 「新しい不動産会社を追加したいんだけど...」
> 「この会社のデータを確認したいな」
> 「ユーザーが増えてきたけど、管理が大変」

こうした運用上の課題を解決するため、**テナント管理機能**を実装しました。

## どんな機能？

### 1. サブドメイン方式によるテナント識別

各テナントは専用のサブドメインでアクセスします。

```
# テナントAの場合
https://tenant-a.cocosumo.space

# テナントBの場合
https://tenant-b.cocosumo.space
```

URLを見るだけでどのテナントにアクセスしているかが明確になり、ブックマークやリンク共有もしやすくなります。

### 2. テナント管理画面（スーパー管理者向け）

スーパー管理者は、すべてのテナントを一元管理できます。

**ダッシュボード**
- 全テナント数、全ユーザー数、全物件数の統計
- テナントごとの利用状況グラフ

**テナント操作**
- 新規テナント作成
- テナント情報の編集
- テナントの停止/再有効化
- テナントの削除

### 3. 代理ログイン機能（インパーソネーション）

スーパー管理者は、任意のテナントに「代理ログイン」できます。

代理ログイン中は画面上部に警告バナーが表示され、そのテナントのデータを確認・操作できます。サポート対応やデバッグに便利です。

```jsx
// 代理ログイン中のバナー表示
<Alert severity="warning">
  <strong>{currentTenant?.name}</strong> として代理ログイン中
  <Button onClick={handleStopImpersonation}>
    代理ログイン終了
  </Button>
</Alert>
```

### 4. ユーザー管理画面（管理者向け）

各テナントの管理者は、自テナント内のユーザーを管理できます。

- ユーザーの追加/編集/削除
- 権限の付与（一般ユーザー/管理者）
- ユーザー数の上限管理

### 5. 監査ログ

管理操作はすべて記録されます。誰が、いつ、何をしたかを追跡できます。

```ruby
# 監査ログの記録例
AdminAuditLog.log_action(
  current_user,
  'impersonate_start',
  tenant,
  { metadata: '代理ログイン開始' }
)
```

## 技術的なこだわり

### TenantResolverによるサブドメイン解決

コントローラの共通処理として、リクエストのサブドメインからテナントを特定します。

```ruby
module TenantResolver
  extend ActiveSupport::Concern

  included do
    before_action :resolve_tenant_from_subdomain
  end

  private

  def resolve_tenant_from_subdomain
    subdomain = request.subdomain.presence
    return if subdomain.blank? || reserved_subdomain?(subdomain)

    @resolved_tenant = Tenant.active.find_by(subdomain: subdomain)
  end

  def reserved_subdomain?(subdomain)
    %w[www admin api app mail ftp ssh assets].include?(subdomain)
  end
end
```

### テナント解決の優先順位

テナントは以下の優先順位で決定されます：

| 優先度 | 方法 | ユースケース |
|--------|------|--------------|
| 1 | 代理ログインセッション | スーパー管理者のサポート対応 |
| 2 | サブドメインから解決 | 通常のアクセス |
| 3 | セッションからのフォールバック | 開発環境など |

### 権限管理の多層化

```ruby
# ユーザーの権限レベル
enum :role, {
  member: 0,      # 一般ユーザー
  admin: 1,       # テナント管理者
  super_admin: 2  # システム全体の管理者
}
```

各権限で利用できる機能を明確に分離：

- **member**: 物件・部屋の閲覧/編集
- **admin**: 上記 + 自テナントのユーザー管理
- **super_admin**: 上記 + テナント管理、代理ログイン

### React Contextによるテナント状態管理

フロントエンドでは、テナント情報をContextで管理し、どのコンポーネントからも参照できるようにしています。

```jsx
const TenantContext = createContext();

export function TenantProvider({ children }) {
  const [currentTenant, setCurrentTenant] = useState(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalTenant, setOriginalTenant] = useState(null);

  // ...

  return (
    <TenantContext.Provider value={{
      currentTenant,
      isImpersonating,
      originalTenant,
      startImpersonation,
      stopImpersonation
    }}>
      {children}
    </TenantContext.Provider>
  );
}
```

## 開発環境でのテスト方法

開発環境では `lvh.me` ドメインを使用します。このドメインは常に `127.0.0.1` に解決されるため、特別な設定なしでサブドメインをテストできます。

```bash
# テナント「sample」としてアクセス
http://sample.lvh.me:3000

# 別のテナントとしてアクセス
http://another.lvh.me:3000
```

## 実際の使われ方

### 新規顧客のオンボーディング

営業担当が新しい不動産会社と契約したら、スーパー管理者がテナント管理画面から新規テナントを作成。即座にサブドメインでアクセス可能になります。

### カスタマーサポート

お客様から「画面が表示されない」などの問い合わせがあった場合、代理ログインでその会社の環境を確認。状況を再現してトラブルシューティングできます。

### 利用状況の把握

ダッシュボードで各テナントの利用状況を確認。活発に使っているテナント、サポートが必要そうなテナントを把握できます。

### コンプライアンス対応

監査ログにより、誰がいつ何をしたかを証跡として残せます。セキュリティ監査やインシデント調査に活用できます。

## 今後の展望

### 請求・課金システムとの連携

テナントのプラン（ベーシック/プロ/エンタープライズ）に応じて機能制限や課金を自動化。

### テナント別のカスタマイズ

ロゴやテーマカラーなど、テナントごとのブランディングカスタマイズ機能。

### セルフサインアップ

現在はスーパー管理者が手動でテナント作成していますが、将来的にはオンラインでの申し込み・自動作成も検討中。

## まとめ

マルチテナントSaaSとしての管理基盤が整いました。

- **サブドメイン方式**で直感的なテナント識別
- **代理ログイン**でスムーズなサポート対応
- **監査ログ**でセキュリティとコンプライアンス対応
- **権限管理**で安全なマルチユーザー運用

複数の不動産会社にCoCoスモを提供する準備が整いました。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2026-01-08 18:00:00')
  post.commit_hash = nil
end

puts "✓ 記事作成: #{blog_post_19.title}"
