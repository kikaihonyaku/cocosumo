# 記事38: 顧客詳細画面のレイアウトを全面リニューアル
blog_post_38 = BlogPost.find_or_create_by!(public_id: 'customer-detail-layout-redesign-2026') do |post|
  post.title = "顧客詳細画面のレイアウトを全面リニューアル — 案件ツリー＋詳細パネルで情報を俯瞰する"
  post.summary = "顧客詳細画面を3カラムレイアウトに刷新しました。左ペインに案件ツリー、中央に対応履歴、右ペインに文脈に応じた詳細パネルを配置し、画面遷移なしで必要な情報にアクセスできます。"
  post.content = <<~'MARKDOWN'
## はじめに — 「あの案件の物件、どれだっけ…」

顧客対応の現場では、こんな場面がよくあります。

> 「この顧客に何件の案件があって、それぞれ物件はどうなっていたっけ？」
> 「対応履歴を見ながら、案件の物件情報も確認したい」
> 「マイページの閲覧状況をチェックするために、別の画面を開かないといけないの？」

これまでの顧客詳細画面は、案件をフラットなリストで表示し、物件やマイページの情報はタブやモーダルで切り替える設計でした。対応件数が増えるほど、「どの案件のどの物件の話？」と迷子になりがちだったのです。

今回、画面レイアウトを根本から見直し、**案件ツリー＋3カラムレイアウト**に全面リニューアルしました。

## Before → After：何が変わったのか

### Before（旧レイアウト）

```
┌──────────────────────────────────────────────┐
│ 顧客ヘッダー                                  │
├────────────┬─────────────────────────────────┤
│ 案件リスト  │  [問い合わせ] [マイページ]  タブ  │
│ (フラット)  │                                 │
│ ├ 案件 #1  │  モーダルで詳細表示               │
│ ├ 案件 #2  │                                 │
│ └ 案件 #3  │                                 │
└────────────┴─────────────────────────────────┘
```

### After（新レイアウト）

```
┌──────────────────────────────────────────────────────────┐
│ 顧客ヘッダー（顧客情報 + メール/LINE/リッチメール）        │
├──────────┬──────────────────────┬─────────────────────────┤
│ 案件ツリー │   対応履歴           │  詳細パネル（文脈に応じて│
│           │   (タイムライン/チャット) │  内容が切り替わる)      │
│ ▼ 案件 #1 │                      │                         │
│   ├ 物件A │  📧 メール送信        │  [案件ダッシュボード]     │
│   ├ 物件B │  📞 電話対応          │   or                    │
│   └+追加  │  💬 LINE送信          │  [物件詳細パネル]        │
│ ▼ 案件 #2 │  📝 ステータス変更     │   or                    │
│   └ 物件C │  ...                  │  [対応履歴詳細]          │
│ [+案件作成]│                      │                         │
└──────────┴──────────────────────┴─────────────────────────┘
```

大きな変更点は3つです。

1. **左ペイン**：フラットリスト → 階層ツリー（案件 → 物件 → マイページ）
2. **中央**：対応履歴を常に表示（タイムライン/チャット切り替え）
3. **右ペイン**：タブ切り替え → 文脈に応じた詳細パネル

## 案件ツリー — 階層で俯瞰する

左ペインの最大の変化は、**案件を階層ツリーで表示する**ようになったことです。

案件（Inquiry）を展開すると、その案件に紐づく物件（PropertyInquiry）が子要素として表示されます。案件の状態、担当者、作成日が一目で分かり、物件ごとの商談ステータス（新規反響、内見予約、成約など）もインラインで確認できます。

```jsx
<InquiryTreePanel
  inquiries={inquiries}
  selectedInquiryId={selectedInquiryId}
  selectedPropertyInquiryId={selectedPropertyInquiryId}
  onInquirySelect={handleInquiryClick}
  onPropertyInquirySelect={handlePropertyInquiryClick}
  onCreateInquiry={() => setCreateInquiryDialogOpen(true)}
  onEditInquiry={(inquiry) => setEditingInquiry(inquiry)}
  onAddProperty={(inquiryId) => {
    setSelectedInquiryId(inquiryId);
    setAddPropertyDialogOpen(true);
  }}
/>
```

ツリーの各ノードからは、編集・履歴追加・物件追加がワンクリックで行えます。物件名の横にある外部リンクアイコンをクリックすると、部屋の詳細ページが別タブで開きます。案件ツリーの操作中に画面遷移が発生しないため、対応の流れが途切れません。

## 右ペイン — 選択に応じて変わる3段階パネル

右ペインは、左ペインでの選択に応じて**3種類のパネルが自動で切り替わります**。

| 選択した要素 | 表示されるパネル | 内容 |
|:---|:---|:---|
| 案件 | InquiryDashboardPanel | 物件パイプライン、マイページ集計、直近の対応履歴 |
| 物件 | PropertyInquiryDetailPanel | 商談ステータス、物件情報、マイページ発行・URL |
| 対応履歴 | ActivityDetailPanel | メール本文、送信ステータス、配信トラッキング |

```jsx
{selectedActivity ? (
  <ActivityDetailPanel
    activity={selectedActivity}
    onClose={() => setSelectedActivity(null)}
  />
) : selectedPropertyInquiry ? (
  <PropertyInquiryDetailPanel
    propertyInquiry={selectedPropertyInquiry}
    accesses={accesses}
    customer={customer}
    onAccessCreated={() => { loadAccesses(); loadActivities(); }}
    onClose={() => setSelectedPropertyInquiryId(null)}
  />
) : (
  <InquiryDashboardPanel
    inquiry={selectedInquiry}
    accesses={accesses}
    activities={activities}
    onClose={() => setSelectedInquiryId(null)}
  />
)}
```

この設計のポイントは、**モーダルを使わずにインラインパネルで表示する**ことです。モーダルを閉じて別の情報を開いて…という操作が不要になり、左ペインでクリックするだけで右ペインの表示がシームレスに切り替わります。

### 案件ダッシュボード

案件を選択すると表示されるダッシュボードでは、その案件の全体像を一目で把握できます。

- **物件パイプライン** — 商談ステータスごとの件数をチップで表示（「新規反響 ×2」「内見予約 ×1」）
- **マイページ集計** — 発行数・有効数・総閲覧数を数値で表示
- **直近の対応履歴** — 最新5件をコンパクトに表示し、残件数を表示

### 物件詳細パネル

物件を選択すると、建物名・部屋番号、商談ステータス、担当者、媒体、チャネルなどの詳細情報に加え、マイページの発行状態まで確認できます。マイページが未発行の場合は、パネル内から直接発行できます。

## リサイズ可能な3カラム

3カラムの幅は、スプリッター（区切りバー）をドラッグして自由に調整できます。

```jsx
const [leftPaneWidth, setLeftPaneWidth] = useState(300);
const [rightPaneWidth, setRightPaneWidth] = useState(380);

// マウスドラッグでリサイズ
useEffect(() => {
  const handleMouseMove = (e) => {
    if (isResizingLeft) {
      const newWidth = (e.clientX - containerRect.left) / zoom - 8;
      setLeftPaneWidth(Math.max(250, Math.min(450, newWidth)));
    }
    if (isResizingRight) {
      const newWidth = (containerRect.right - e.clientX) / zoom - 8;
      setRightPaneWidth(Math.max(300, Math.min(550, newWidth)));
    }
  };
  // ...
}, [isResizingLeft, isResizingRight]);
```

案件が少ない顧客なら左ペインを狭くして対応履歴を広く、逆に案件の多い顧客なら左ペインを広げて全体を俯瞰——そんな使い分けが自然にできます。CSS `zoom` 対応も組み込んでおり、ブラウザのズーム設定を変更しても正しいドラッグ位置で動作します。

## モバイル対応 — タブ切り替えで同じ情報に

モバイル（md未満）では、3カラムの代わりに**タブ切り替え方式**を採用しています。

```
[案件] [履歴] [詳細]
```

- **案件タブ**: 案件ツリーを表示。案件や物件をタップすると「詳細」タブに自動遷移
- **履歴タブ**: 対応履歴のタイムライン/チャットビューを表示
- **詳細タブ**: 選択状態に応じてダッシュボード/物件詳細/対応履歴詳細を表示

```jsx
const handleInquiryClick = (inquiryId) => {
  setSelectedInquiryId(prev => prev === inquiryId ? null : inquiryId);
  setSelectedPropertyInquiryId(null);
  setSelectedActivity(null);
  if (isMobile) setMobilePanelIndex(2); // 詳細タブへ自動遷移
};
```

デスクトップとモバイルで同じデータと同じコンポーネントを使いつつ、レイアウトだけを切り替えています。

## メール・LINE送信時の案件外物件登録

レイアウト変更と合わせて、もうひとつ便利な機能を追加しました。メールやLINEの作成画面で、案件に登録されていない物件を選択した際に、**案件への追加を確認するダイアログ**が表示されるようになりました。

```jsx
// useConfirmAddProperty フック
const checkAndPrompt = useCallback((room) => {
  const inquiry = inquiries.find(inq => String(inq.id) === String(selectedInquiryId));
  const alreadyExists = (inquiry.property_inquiries || []).some(
    pi => pi.room?.id === room.id
  );
  if (alreadyExists) return;  // 登録済みならスキップ

  setPendingRoom(room);       // ダイアログを表示
  setDialogOpen(true);
}, [inquiries, selectedInquiryId]);
```

「検索タブで見つけた物件の写真を挿入 → 案件にも自動追加」という一連の流れがスムーズに行えます。メール作成（EmailComposer）とLINE送信（LineComposeDialog）の両方で同じフック（`useConfirmAddProperty`）を共有しているため、動作も一貫しています。

## 活用シーン

### 案件の全体像をサッと把握

朝の業務開始時、顧客詳細画面を開くだけで「この顧客には案件が3件、それぞれの物件がどのステータスか」がツリーで一覧できます。案件をクリックすれば、右ペインにパイプラインと直近の対応履歴が表示され、どの案件から手をつけるか判断できます。

### 対応履歴を見ながら物件情報を確認

中央の対応履歴で「お客様にメールを送った内容」を確認しつつ、左ペインの物件をクリックすれば右ペインに商談ステータスやマイページ閲覧状況が切り替わります。画面遷移なしで「送ったメール」と「物件の反応」を並べて見られるのは、フォローアップの精度を上げるポイントです。

### マイページのURLをすぐにコピー

物件を選択すると、右ペインにマイページの発行状態とURLがそのまま表示されます。URLをコピーしてメールやLINEに貼り付ける操作が、ワンクリックで完了します。未発行の場合は、パネル内の「マイページを発行」ボタンから即座に発行でき、別画面への移動は不要です。

### 外出先でもモバイルから確認

移動中にスマートフォンで顧客情報を確認する場面でも、タブ切り替えで同じ情報にアクセスできます。案件タブで物件をタップすれば自動で詳細タブに遷移するので、画面の狭いモバイルでもストレスなく操作できます。

## まとめ

今回のリニューアルのテーマは**「画面遷移なしで、必要な情報にたどり着く」**です。

不動産営業の顧客対応では、案件・物件・対応履歴・マイページなど、関連する情報が多岐にわたります。これらの情報を見るために画面を行き来するのは、対応のテンポを崩し、見落としの原因にもなります。

こだわったのは3つです。

1. **階層ツリー** — 案件→物件の親子関係を視覚的に表現し、情報の構造をそのまま画面に反映
2. **文脈パネル** — 選択した要素に応じて右ペインが自動切り替え。モーダルを排除して一覧性を確保
3. **リサイズ自由** — スプリッターで3カラムの幅を調整でき、操作者の好みに合わせられる

「あの案件の物件、どれだっけ」と迷うことがなくなる——そんな画面を目指しました。日々の顧客対応が、少しでもスムーズになれば嬉しいです。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2026-02-15 20:00:00')
  post.commit_hash = '0b2fa6b5'
end

puts "✓ 記事作成: #{blog_post_38.title}"
