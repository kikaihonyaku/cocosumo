# 記事26: 案件に「主担当者」を追加 — PropertyInquiryからの自動連動
blog_post_26 = BlogPost.find_or_create_by!(public_id: 'inquiry-assigned-user-2026') do |post|
  post.title = "案件に「主担当者」を追加し、商談ステータス連動で自動クローズ/再開を実現しました"
  post.summary = "案件（Inquiry）に主担当者を設定できるようにし、PropertyInquiryから自動連動する仕組みを実装。全物件が成約/失注になると案件を自動クローズ、再開もスムーズにできるようになりました。"
  post.content = <<~'MARKDOWN'
## はじめに — 「この案件、誰が担当？」をすぐ答えられるように

前回・前々回の記事で、商談ステータスや優先度を **物件問い合わせ（PropertyInquiry）単位** に移し、案件（Inquiry）は「会話の箱」としてシンプルにするリファクタリングを行いました。

物件ごとの進捗管理はうまくいくようになったのですが、日々の業務で新しい課題が見えてきました。

> 「この案件って、結局誰が主担当なの？」

PropertyInquiryにはそれぞれ担当者を設定できますが、案件全体を誰が責任を持って見ているのかが一目でわからない。上長が案件一覧を見たときに、**誰に聞けばいいか** がすぐにわかる情報が欲しい——これが今回の改善の出発点です。

## 今回やったこと

大きく3つの改善を行いました。

1. **案件（Inquiry）に主担当者（assigned_user）を追加**
2. **PropertyInquiryの担当者設定が案件に自動連動**
3. **全物件の商談ステータスに応じて案件を自動クローズ/再開**

加えて、顧客詳細画面のヘッダーを整理し、不要になった情報を削除しました。

## 主担当者の追加

### マイグレーション

案件テーブルに `assigned_user_id` カラムを追加するだけのシンプルなマイグレーションです。

```ruby
class AddAssignedUserToInquiries < ActiveRecord::Migration[8.0]
  def change
    add_reference :inquiries, :assigned_user,
                  foreign_key: { to_table: :users }, null: true
  end
end
```

`null: true` にしているのは、案件作成時にはまだ担当者が決まっていないケースがあるためです。

### モデルの関連付け

Inquiryモデルに `belongs_to :assigned_user` を追加しました。

```ruby
class Inquiry < ApplicationRecord
  belongs_to :assigned_user, class_name: "User", optional: true
  # ...
end
```

`class_name: "User"` で、`assigned_user` という名前でも `users` テーブルを参照するようにしています。`optional: true` はマイグレーションの `null: true` と対応しています。

## PropertyInquiryからの自動連動

ここが今回の設計のポイントです。担当者を **PropertyInquiry側で設定したとき**、まだ案件に主担当者が設定されていなければ **自動的に案件の主担当者として反映** される仕組みにしました。

```ruby
class PropertyInquiry < ApplicationRecord
  after_save :sync_assigned_user_to_inquiry

  private

  def sync_assigned_user_to_inquiry
    if assigned_user_id.present? && inquiry.assigned_user_id.nil?
      inquiry.update_column(:assigned_user_id, assigned_user_id)
    end
  end
end
```

なぜ `update_column` を使っているかというと、コールバックの連鎖を避けるためです。通常の `update` だとInquiry側のコールバックが発火してしまい、意図しない副作用が起きる可能性があります。

### 「最初の担当者が主担当」という設計判断

「全PropertyInquiryの中で最も多い担当者を主担当にする」「最後に設定された担当者を主担当にする」などの選択肢もありましたが、シンプルに **最初に担当者を設定した人が主担当** というルールにしました。

理由は2つあります。

1. 最初に対応した人がそのまま案件全体を見ることが多い
2. 後から変えたくなったら、案件編集画面で直接変更できる

複雑なロジックを組むより、シンプルな初期値＋手動変更のほうが運用しやすいと判断しました。

## 商談ステータス連動による自動クローズ/再開

もう1つの大きな改善が、案件のステータスを **PropertyInquiryの商談ステータスに連動させる** 仕組みです。

```ruby
class PropertyInquiry < ApplicationRecord
  after_save :sync_inquiry_status

  COMPLETED_DEAL_STATUSES = %w[contracted lost].freeze

  private

  def sync_inquiry_status
    return if inquiry.on_hold?

    all_pis = inquiry.property_inquiries.reload
    all_completed = all_pis.any? &&
      all_pis.all? { |pi| COMPLETED_DEAL_STATUSES.include?(pi.deal_status) }

    if all_completed && !inquiry.closed?
      inquiry.update_column(:status, Inquiry.statuses[:closed])
    elsif !all_completed && inquiry.closed?
      inquiry.update_column(:status, Inquiry.statuses[:active])
    end
  end
end
```

### どういうときにクローズされる？

案件に紐付くすべてのPropertyInquiryが **「成約」または「失注」** になったとき、案件は自動的に「クローズ」になります。

```
案件「Aさんの引越し相談」
├── 〇〇マンション301号 → 成約 ✓
├── △△ハイツ205号     → 失注 ✓
└── □□コーポ102号     → 失注 ✓
→ 全物件が完了 → 案件を自動クローズ
```

### 再開もスムーズに

もしクローズ後に新しいPropertyInquiryが追加されたり、既存の商談ステータスが「対応中」に戻されたりした場合は、**自動的にアクティブに再開** されます。

ただし、**「保留中」の案件は連動対象外** にしています。意図的に保留にしているケースを壊さないためです。

## 案件編集画面の改善

EditInquiryDialogにも手を入れ、主担当者とステータスを直接編集できるようにしました。

```jsx
export default function EditInquiryDialog({
  open, onClose, inquiry, users = [], onUpdated
}) {
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('active');
  const [assignedUserId, setAssignedUserId] = useState('');

  // ...

  // 担当者変更とノート更新
  await axios.patch(`/api/v1/inquiries/${inquiry.id}`, {
    inquiry: {
      notes,
      assigned_user_id: assignedUserId || null
    }
  });

  // ステータス変更（別エンドポイント）
  if (statusChanged) {
    await axios.post(
      `/api/v1/inquiries/${inquiry.id}/change_status`,
      { status }
    );
  }
}
```

担当者の選択肢は、そのテナントに所属するユーザー一覧をドロップダウンで表示します。

## 顧客詳細ヘッダーの整理

前回のリファクタリングで商談ステータスをPropertyInquiryに移動したことで、顧客詳細画面のヘッダーに表示していた `deal_status` や `priority` のChipが不要になりました。今回これらを削除し、ヘッダーをすっきりさせました。

**Before:**
- 顧客名 ＋ 状態 ＋ 商談ステータス ＋ 優先度 ＋ ステータス更新日...
- 情報が多すぎて、どれが重要か分かりにくい

**After:**
- 顧客名 ＋ 状態 ＋ 連絡先
- シンプルで見やすく、商談の詳細は案件/物件単位で確認する導線に

また、案件一覧をCardコンポーネントからListコンポーネントに変更し、よりコンパクトな表示にしました。

## 技術的なポイントまとめ

| 項目 | 詳細 |
|------|------|
| マイグレーション | `add_reference` で外部キー制約付き |
| 担当者連動 | PIのafter_saveでInquiryに自動反映 |
| 自動クローズ | 全PIが成約/失注→案件をclosed |
| 自動再開 | 未完了PIが存在→案件をactive |
| 保留中の保護 | `on_hold?` の案件は連動対象外 |
| APIレスポンス | `assigned_user` をネストして返却 |

## 実際の使われ方

### 新規案件の対応フロー

1. 反響が入り、PropertyInquiryが作成される
2. スタッフがPropertyInquiryに担当者を設定
3. → 案件の主担当者に自動反映
4. 上長が案件一覧で「誰が対応中か」をすぐ確認できる

### 案件のクローズ

1. 複数物件を検討中のお客様
2. 1つの物件で成約、他は失注に
3. → 全PropertyInquiryが完了状態になり、案件が自動クローズ
4. → 案件一覧から自動的にフィルタリング、対応中の案件に集中できる

### 再検討が入った場合

1. クローズ済みの案件で、お客様から再度連絡
2. 新しいPropertyInquiryを追加、または既存のステータスを戻す
3. → 案件が自動的にアクティブに再開
4. → 担当者にすぐ見える状態になる

## まとめ

今回の改善で、案件管理がより実務に即したものになりました。

- **主担当者が一目でわかる**: 案件一覧で「誰に聞けばいいか」が明確
- **担当者設定が楽**: PropertyInquiryで担当者を設定するだけで案件にも反映
- **クローズ/再開が自動**: 手動でステータスを変える手間が不要
- **保留中は安全に保護**: 意図的な保留は連動の影響を受けない

前回のドメインリファクタリングで「物件単位の商談管理」という基盤ができたからこそ、今回の自動連動がスムーズに実装できました。設計を段階的に改善していくことの大切さを改めて実感しています。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2026-01-31 12:00:00')
  post.commit_hash = '6942b4b'
end

puts "✓ 記事作成: #{blog_post_26.title}"
