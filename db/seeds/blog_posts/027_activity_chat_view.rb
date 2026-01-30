# 記事27: 対応履歴をチャット風UIで表示
blog_post_27 = BlogPost.find_or_create_by!(public_id: 'activity-chat-view-2026') do |post|
  post.title = "対応履歴にチャット風UIを追加 — 吹き出し表示でコミュニケーションの流れが一目瞭然に"
  post.summary = "顧客詳細画面の対応履歴パネルに、LINEやメールのやり取りをチャットアプリのような吹き出し形式で表示する新ビューを追加しました。ヘッダーのトグルボタンで従来のタイムライン表示と切り替えられます。"
  post.content = <<~'MARKDOWN'
## はじめに — 「このお客様と、どんなやり取りをしてきたっけ？」

顧客管理画面の中央ペインには、電話・メール・LINE・来店など、お客様とのすべてのコミュニケーション履歴がタイムライン形式で表示されています。これはこれで便利なのですが、実際に使っている中でこんな声が聞こえてきました。

> 「対応履歴は記録されているけど、会話の流れが掴みにくい」

タイムラインは情報を正確に記録するには最適ですが、「お客様から問い合わせ → スタッフが返答 → お客様から追加質問 → …」という**やり取りの流れ**を追うには、少し読みづらいのです。特にLINEやメールのような双方向のコミュニケーションでは、普段使い慣れたチャットアプリのような見た目のほうが直感的に把握できます。

そこで今回、対応履歴をチャット風の吹き出し表示で見られる新しいビューモードを追加しました。

## どんな機能？

対応履歴パネルのヘッダーに、2つのアイコンが並んだトグルボタンが追加されます。

```
[対応履歴 12件]  [📋|💬]  [+ 追加]
```

- **📋（リストアイコン）**: 従来のタイムライン表示
- **💬（チャットアイコン）**: 新しいチャット吹き出し表示

ボタンをクリックするだけで、同じデータを2つの視点で見ることができます。

### チャットビューの特徴

**吹き出しの配置で方向がわかる:**
- **右寄せ（青色背景）**: スタッフからお客様への連絡（outbound）
- **左寄せ（グレー背景）**: お客様からの連絡（inbound）
- **中央（破線ボーダー）**: 内部メモ

**コミュニケーションに集中:**
チャットビューでは、LINE・メール・電話・来店・内見・メモの6種類のみを表示します。ステータス変更や担当者変更といったシステム的な履歴は非表示になるため、**純粋なコミュニケーションの流れ**に集中できます。

**最新が下に:**
一般的なチャットアプリと同じく、古いメッセージが上、新しいメッセージが下に表示されます。画面を開くと自動的に最下部にスクロールするので、最新のやり取りからすぐ確認できます。

## 技術的な構成

今回の実装では、1,200行を超えていた `CustomerDetail.jsx` を分割・整理するリファクタリングも同時に行いました。

### ファイル構成

| ファイル | 役割 |
|---------|------|
| `activityUtils.jsx` | アイコン・色・フィルタリングなどの共通ヘルパー |
| `ActivityTimeline.jsx` | 従来のタイムライン表示（抽出） |
| `ActivityChatView.jsx` | 新しいチャット吹き出し表示 |
| `CustomerDetail.jsx` | トグル制御と表示切り替え |

### 共通ロジックの抽出

タイムラインとチャットビューで共通して使うロジックを `activityUtils.jsx` に集約しました。

```jsx
// チャットビューに表示する対応種別
export const CHAT_ACTIVITY_TYPES = [
  'line_message', 'email', 'phone_call',
  'visit', 'viewing', 'note'
];

// 案件・物件によるフィルタリング（両ビュー共通）
export const filterActivities = (
  activities, selectedInquiryId, selectedPropertyInquiryId
) => {
  if (selectedPropertyInquiryId) {
    return activities.filter(
      a => a.property_inquiry_id === selectedPropertyInquiryId
    );
  }
  if (selectedInquiryId) {
    return activities.filter(
      a => a.inquiry_id === selectedInquiryId
    );
  }
  return activities;
};
```

左ペインで案件や物件を選択すると、チャットビューでも同じフィルタリングが適用されます。タイムラインとチャットビューで挙動が異ならないよう、フィルタリングロジックを1箇所にまとめているのがポイントです。

### 吹き出しのスタイル制御

チャットの吹き出しは `direction` フィールドの値に応じて、配置・色・角丸を切り替えています。

```jsx
// 方向に応じたレイアウト
const justifyContent = isOutbound
  ? 'flex-end'    // スタッフ発信 → 右寄せ
  : isInbound
    ? 'flex-start' // 顧客発信 → 左寄せ
    : 'center';    // 内部メモ → 中央

// 吹き出しのスタイル
const bubbleSx = isOutbound
  ? {
      bgcolor: 'primary.main',
      color: 'primary.contrastText',
      borderRadius: '16px 16px 4px 16px', // 右下だけ角張る
    }
  : isInbound
    ? {
        bgcolor: 'grey.100',
        color: 'text.primary',
        borderRadius: '16px 16px 16px 4px', // 左下だけ角張る
      }
    : {
        border: '1px dashed',
        borderColor: 'grey.400',
        borderRadius: '12px',              // 均等な角丸
      };
```

角丸（`borderRadius`）を1箇所だけ小さくすることで、吹き出しの「しっぽ」のような効果を出しています。LINEやiMessageなどのチャットアプリでおなじみのデザインパターンです。

### 自動スクロールと編集ボタン

```jsx
const scrollRef = useRef(null);

// 履歴が増えたら自動で最下部にスクロール
useEffect(() => {
  if (scrollRef.current) {
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }
}, [chatActivities.length]);
```

また、各吹き出しにマウスを乗せると編集ボタンが浮かび上がるようになっています。普段は邪魔にならず、必要なときだけ使える控えめなUIです。

### トグルの実装

`CustomerDetail.jsx` 側では、MUIの `ToggleButtonGroup` でビューの切り替えを制御しています。

```jsx
const [activityViewMode, setActivityViewMode] = useState('timeline');

// ヘッダー部分
<ToggleButtonGroup
  value={activityViewMode}
  exclusive
  onChange={(e, v) => { if (v) setActivityViewMode(v); }}
  size="small"
>
  <ToggleButton value="timeline">
    <ViewListIcon />
  </ToggleButton>
  <ToggleButton value="chat">
    <ChatBubbleOutlineIcon />
  </ToggleButton>
</ToggleButtonGroup>

// 本体の描画
{activityViewMode === 'chat'
  ? <ActivityChatView {...props} />
  : <ActivityTimeline {...props} />
}
```

`exclusive` 属性により必ずどちらか一方が選択された状態になります。`onChange` で `null` が返るケース（同じボタンを再クリック）をガードすることで、ボタンが何も選ばれていない状態を防いでいます。

## ソート順の違い

タイムラインとチャットビューでは、同じデータを**逆順**で表示しています。

| ビュー | ソート順 | 理由 |
|--------|---------|------|
| タイムライン | 新しい順（DESC） | 最新の対応をすぐ確認したい |
| チャット | 古い順（ASC） | 会話の流れを上から下に追いたい |

APIは `created_at DESC` でデータを返すので、チャットビューではフロント側で `.reverse()` して表示しています。

```jsx
const chatActivities = filtered
  .filter(a => CHAT_ACTIVITY_TYPES.includes(a.activity_type))
  .slice()     // 元の配列を変更しないようコピー
  .reverse();  // 古い順に並べ替え
```

`.slice()` を挟んでいるのは、`.reverse()` が破壊的メソッド（元の配列を変更する）だからです。Reactの状態管理では元データを変更しないことが重要なので、必ずコピーしてから反転しています。

## 実際の使われ方

### 引き継ぎ時の状況把握

新しい担当者がお客様を引き継ぐとき、チャットビューで過去のやり取りの流れをざっと追えます。「どんなトーンでやり取りしていたか」「どこで話が止まっているか」が一目でわかります。

### 電話対応中のリアルタイム確認

お客様から電話がかかってきたとき、チャットビューを開けば直近のやり取りがすぐ目に入ります。「前回メールでお送りした件ですが…」と言われても、すぐに文脈を把握できます。

### 上長によるコミュニケーション品質チェック

タイムライン表示では対応の「量」が見えますが、チャットビュー表示ではやり取りの「質」が見えます。レスポンスの速さ、対応の丁寧さなど、会話の流れから読み取れる情報は多いです。

### 内部メモの活用

チャットビューでは内部メモ（direction なし）が中央に破線ボーダーで表示されます。顧客とのやり取りの間に「ここで上長に相談した」「審査書類を確認した」などのメモが挟まることで、対応の経緯がより立体的に見えます。

## リファクタリング効果

今回の実装に合わせて、`CustomerDetail.jsx` からタイムライン描画部分（約130行）を `ActivityTimeline.jsx` に抽出しました。

**Before:** `CustomerDetail.jsx` 1,292行（巨大な単一ファイル）
**After:** `CustomerDetail.jsx` 1,179行 ＋ 分割された3ファイル

新機能の追加と同時にファイルを分割することで、今後の保守性も向上しています。タイムライン表示とチャット表示がそれぞれ独立したコンポーネントなので、片方を修正しても他方に影響しません。

## まとめ

今回の改善で、対応履歴の見方が2通りになりました。

- **タイムライン**: すべての履歴を時系列で正確に記録・確認
- **チャットビュー**: コミュニケーションの流れを直感的に把握

同じデータを「記録」と「会話」の2つの視点で見られることで、顧客対応の質がさらに向上すると期待しています。バックエンドの変更は一切なく、既存のデータとAPIをそのまま活用してフロントエンドの表示を追加しただけという点も、今回の実装の手軽さを示しています。

今後は、チャットビューからの直接返信機能や、未読メッセージのハイライトなど、よりインタラクティブな方向への拡張も検討していきたいと思います。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2026-02-01 12:00:00')
  post.commit_hash = 'dbbfbbc'
end

puts "✓ 記事作成: #{blog_post_27.title}"
