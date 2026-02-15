# 記事37: メール/LINE作成時のコンテンツ挿入機能を強化
blog_post_37 = BlogPost.find_or_create_by!(public_id: 'content-insertion-enhancement-2026') do |post|
  post.title = "メール・LINE作成時のコンテンツ挿入機能を強化 — VRツアーも公開ページも、ワンクリックでメッセージに挿入"
  post.summary = "メール・LINE作成画面でVRツアー・バーチャルステージング・公開ページ・顧客マイページのリンクをワンクリックで挿入できるようにしました。任意の物件検索による写真・カード挿入にも対応し、案件に紐づいていない物件も自由に紹介できます。"
  post.content = <<~'MARKDOWN'
## はじめに — 「この物件のVRツアーも送りたいんだけど…」

不動産営業で、お客様にメールやLINEを送る場面を想像してください。

> 「この物件のVRツアーのリンクを貼りたいんだけど、URLってどこだっけ…」
> 「バーチャルステージングも見せたいけど、公開ページのURLをコピーして貼るのが面倒」
> 「案件に登録していない物件の写真も送りたいのに、先に案件に紐づけないといけないの？」

CoCoスモにはVRツアー、バーチャルステージング、物件公開ページ、顧客マイページなど、お客様に見せたいコンテンツがたくさんあります。しかし、いざメールやLINEで送ろうとすると、別の画面でURLをコピーしてきて貼り付ける——そんな手間がかかっていました。

もうひとつの課題は**物件選択の制約**です。リッチメールで物件の写真やカードを挿入するには、あらかじめ案件に物件を紐づけておく必要がありました。「お客様の条件に合いそうな別の物件も紹介したい」と思っても、まず案件管理画面で紐づけ作業が必要で、営業のテンポが崩れてしまいます。

今回のアップデートで、これらの課題をまとめて解決しました。

## どんな機能？

### メール作成画面：3タブのサイドバー

メール作成画面の右サイドバーが、3つのタブに進化しました。

```
┌──────────────────────────────┐
│  [案件] [検索] [リンク]       │
├──────────────────────────────┤
│                              │
│  (タブの中身がここに表示)     │
│                              │
└──────────────────────────────┘
```

| タブ | できること |
|:---|:---|
| 案件 | 従来通り、案件に紐づいた物件の写真・カードを挿入 |
| 検索 | 任意の物件を検索し、写真・カード・公開コンテンツを挿入 |
| リンク | VRツアー・VS・公開ページ・マイページのリンクをカード形式で挿入 |

**「案件」タブ**は既存の動作そのままです。今まで通り、案件に紐づいた物件の写真やカードを挿入できます。

**「検索」タブ**が今回の目玉です。建物名や部屋番号でリアルタイム検索し、任意の物件を選択。選択すると、その物件の写真一覧・物件カード・公開コンテンツ（VRツアー、バーチャルステージング、公開ページ）がすべて表示され、クリックひとつでメール本文に挿入できます。

**「リンク」タブ**では、「物件から検索」モードと「全コンテンツ」モードを切り替えられます。テナント内のすべての公開VRツアー・バーチャルステージング・公開ページを一覧から検索でき、建物名やタイトルでフィルタリングも可能です。さらに、その顧客に発行済みのマイページリンクも一覧表示されます。

### 挿入されるHTMLカード

コンテンツをクリックすると、メール本文にスタイル付きのHTMLカードが挿入されます。コンテンツの種類ごとに色分けされたバッジとCTAボタンがつきます。

| コンテンツ | バッジ色 | ボタン |
|:---|:---|:---|
| VRツアー | 青 | 「VRツアーを見る」 |
| バーチャルステージング | 赤 | 「ステージングを見る」 |
| 物件ページ | 緑 | 「物件ページを見る」 |
| マイページ | オレンジ | 「マイページを開く」 |

サムネイル画像がある場合はカード上部に表示され、物件名・有効期限などの情報も添えられます。メールクライアントでの表示互換性を考慮し、すべてインラインCSSで構築しています。

### LINE送信ダイアログ：リンク挿入ボタン

LINEメッセージのテキストモードに「リンク挿入」ボタンが追加されました。クリックすると物件検索フィールドと公開コンテンツの一覧が展開され、コンテンツを選ぶとそのURLがテキストエリアの末尾に自動挿入されます。

```
┌─────────────────────────────────┐
│ LINEメッセージを送信             │
│                                 │
│ [テキスト] [画像] [物件カード]    │
│                                 │
│   [リンク挿入] [テンプレート]     │
│   ┌───────────────────────┐     │
│   │ 🔍 建物名で検索...     │     │
│   │ ├ VRツアー 301号室  VR │     │
│   │ ├ VS 301号室       VS │     │
│   │ └ 物件ページ      公開 │     │
│   │ ─── マイページリンク ──│     │
│   │ └ マイページ 301号室   │     │
│   └───────────────────────┘     │
│                                 │
│  ┌───────────────────────┐      │
│  │ メッセージ本文...       │      │
│  │ https://example.com/...│      │
│  └───────────────────────┘      │
└─────────────────────────────────┘
```

LINEはHTMLが使えないため、URLそのものが挿入されます。お客様がタップすれば直接コンテンツが開くシンプルな体験です。

## 使い方ガイド

### メールでVRツアーのリンクを送る

1. メール作成画面を開く
2. サイドバーの「検索」タブをクリック
3. 建物名や部屋番号を入力して物件を選択
4. 公開コンテンツ一覧からVRツアーをクリック
5. メール本文にVRツアーカードが挿入される

### テナント内の全公開コンテンツから選ぶ

1. サイドバーの「リンク」タブをクリック
2. 「全コンテンツ」タブに切り替え
3. 検索フィールドで建物名やタイトルを入力
4. 目的のコンテンツをクリックして挿入

### LINEでマイページリンクを送る

1. LINE送信ダイアログを開く
2. テキストモードで「リンク挿入」ボタンをクリック
3. マイページリンク一覧から対象のリンクをクリック
4. URLがメッセージ末尾に挿入される

## 技術的な詳細

### 物件の公開コンテンツを一括取得するAPI

新たに `GET /api/v1/rooms/:id/published_content` エンドポイントを追加しました。指定した部屋の写真と公開中のコンテンツ（VRツアー、バーチャルステージング、物件公開ページ）を一括で返します。

```ruby
# RoomsController
def published_content
  vr_tours = @room.vr_tours.where(published: true).map do |vt|
    {
      id: vt.id,
      title: vt.title,
      public_id: vt.public_id,
      public_url: vt.public_url,
      thumbnail_url: vt.thumbnail_url,
      scenes_count: vt.scenes_count
    }
  end

  virtual_stagings = @room.virtual_stagings.where(published: true).map { ... }
  property_publications = @room.property_publications.where(status: :published).map { ... }
  room_photos = @room.room_photos.ordered.filter_map { ... }
  building_photos = (building&.building_photos || []).filter_map { ... }

  render json: {
    room: { id: @room.id, room_number: @room.room_number, ... },
    vr_tours: vr_tours,
    virtual_stagings: virtual_stagings,
    property_publications: property_publications,
    room_photos: room_photos,
    building_photos: building_photos
  }
end
```

既存の `set_room` before_action を再利用しているため、テナント権限チェックも自動的に適用されます。

### テナント横断の公開コンテンツ検索API

`GET /api/v1/published_contents?q=検索ワード` で、テナント内の全公開コンテンツを横断検索できます。

```ruby
class Api::V1::PublishedContentsController < ApplicationController
  def index
    query = params[:q].to_s.strip

    vr_tours = VrTour.joins(room: :building)
                     .where(buildings: { tenant_id: current_tenant.id })
                     .where(published: true)

    if query.present?
      like_query = "%#{query}%"
      vr_tours = vr_tours.where(
        "vr_tours.title ILIKE :q OR buildings.name ILIKE :q OR rooms.room_number ILIKE :q",
        q: like_query
      )
    end

    render json: {
      vr_tours: vr_tours.limit(50).map { |vt| vr_tour_json(vt) },
      virtual_stagings: ...,
      property_publications: ...
    }
  end
end
```

VRツアー・バーチャルステージング・物件公開ページの3種類を、タイトル・建物名・部屋番号で横断的にILIKE検索します。`includes` で N+1 を防ぎ、`limit(50)` で結果セットを制限しています。

### デバウンス付き物件検索コンポーネント

物件検索フィールドは300msのデバウンスで、キー入力のたびにAPIを叩かないように制御しています。

```jsx
export default function RoomSearchField({ value, onChange }) {
  const debounceRef = useRef(null);

  const searchRooms = useCallback((query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const res = await axios.get('/api/v1/rooms/search', {
        params: { q: query }
      });
      setOptions(res.data.rooms || []);
    }, 300);
  }, []);

  return (
    <Autocomplete
      onInputChange={(_, newInput) => {
        setInputValue(newInput);
        searchRooms(newInput);
      }}
      // ...
    />
  );
}
```

既存の `GET /api/v1/rooms/search` を再利用しているため、バックエンド側の新規実装は不要でした。MUI の `Autocomplete` コンポーネントと組み合わせることで、ドロップダウンに候補が表示され、選択すると部屋のコンテンツが読み込まれます。

### HTMLカードテンプレートの設計

メールに挿入するHTMLカードは、コンテンツ種別ごとに専用のビルダー関数で生成しています。

```javascript
export function buildVrTourCardHtml({
  title, public_url, thumbnail_url, building_name, room_number, scenes_count
}) {
  const imgHtml = thumbnail_url
    ? `<img src="${thumbnail_url}" alt="${title}" ... />`
    : '';

  return `
<div style="border: 1px solid #ddd; border-radius: 8px; max-width: 480px; ...">
  ${imgHtml}
  <div style="padding: 12px 16px;">
    <span style="background: #e3f2fd; color: #1565c0; ...">VRツアー</span>
    <h3 style="...">${title}</h3>
    <a href="${public_url}" style="background: #1976d2; color: #fff; ...">
      VRツアーを見る
    </a>
  </div>
</div>`;
}
```

すべてインラインCSSを使い、メールクライアントの互換性を確保しています。このパターンは既存の `PropertyCardInserter` の `buildPropertyCardHtml` 関数と同じ設計です。既存のパターンに合わせることで、メンテナンス性を保っています。

### 既存コンポーネントの再利用

「検索」タブでは、既存の `PropertyImagePicker` と `PropertyCardInserter` をそのまま再利用しています。APIから取得したデータを、これらのコンポーネントが期待する形式に変換して渡すだけです。

```jsx
// APIレスポンスを既存コンポーネントのデータ形式に変換
const searchedPropertyPhotos = roomContent ? [{
  property_inquiry_id: `search-${roomContent.room?.id}`,
  property_title: `${roomContent.room?.building_name} ${roomContent.room?.room_number}`,
  building_photos: roomContent.building_photos || [],
  room_photos: roomContent.room_photos || [],
  // ...
}] : [];

// 既存コンポーネントをそのまま利用
<PropertyImagePicker
  propertyPhotos={searchedPropertyPhotos}
  editor={editor}
/>
```

新しいコンポーネントを作るのではなく、データの形を合わせることで既存コードを活かす——変更量を最小限に抑えながら機能を拡張するアプローチです。

## 活用シーン

### 初回物件紹介メールにVRツアーを添える

お客様に物件情報をメールで送る際、テキストだけでは伝わりにくい室内の雰囲気を、VRツアーカードで補完できます。「検索」タブから物件を選び、VRツアーカードをワンクリックで挿入。お客様は届いたメールの「VRツアーを見る」ボタンをタップするだけで、360度のバーチャル内見が始まります。

### 案件外の物件もさっと紹介

お客様との会話の中で「こんな物件もありますよ」と提案したくなったとき、案件に紐づけていない物件も「検索」タブからすぐに見つけて写真やカードを挿入できます。案件管理画面への行き来が不要になり、営業のリズムを崩さずに提案できます。

### LINEでマイページを案内

顧客マイページを発行した後、「マイページのURLって何だっけ」と探す手間がなくなります。LINE送信画面の「リンク挿入」から顧客のマイページリンクがすぐ見つかり、タップひとつでメッセージに挿入。お客様はリンクをタップするだけで、自分専用の物件ページにアクセスできます。

### バーチャルステージング画像でイメージを膨らませる

空室の写真だけでは想像しにくい「家具を置いた暮らし」を、バーチャルステージングのカードで伝えられます。メールにステージングカードを挿入すれば、お客様はビフォー・アフターの比較を見て入居後のイメージを膨らませることができます。

## まとめ

今回のアップデートのテーマは**「コンテンツとメッセージをつなぐ」**です。

CoCoスモにはVRツアー、バーチャルステージング、物件公開ページ、顧客マイページなど、お客様に見せたいリッチコンテンツがたくさんあります。しかし、それらをメールやLINEに「挿入する」動作が手間だったために、活用しきれていない場面がありました。

こだわったのは3つです。

1. **既存機能を壊さない** — 「案件」タブは従来通り。タブを追加する形で拡張したため、既存の操作感はそのまま
2. **既存コンポーネントの再利用** — `PropertyImagePicker` や `PropertyCardInserter` を新しいタブでもそのまま活用。コードの重複を避け、一貫した操作感を実現
3. **メールとLINEの両方に対応** — メールではHTMLカード、LINEではURL。チャネルに合わせた最適な形式で挿入

せっかく作ったVRツアーや公開ページが、お客様の目に届かなければ意味がありません。「作る」と「届ける」の距離を縮めること——それが、不動産DXの次のステップだと考えています。
  MARKDOWN
  post.status = :published
  post.published_at = Time.zone.parse('2026-02-15 12:00:00')
  post.commit_hash = '7e647f26'
end

puts "✓ 記事作成: #{blog_post_37.title}"
