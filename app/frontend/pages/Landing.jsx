import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function BlogSection() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('/api/v1/blog_posts/recent');
        setPosts(response.data);
      } catch (error) {
        console.error('Failed to fetch blog posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (loading || posts.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
        開発者ブログ
      </h2>
      <p className="text-center text-gray-600 mb-12">
        CoCoスモの最新機能や更新情報をお届けします
      </p>

      <div className="grid md:grid-cols-3 gap-8">
        {posts.map((post) => (
          <Link
            key={post.public_id}
            to={`/blog/${post.public_id}`}
            className="block"
          >
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden">
              {post.thumbnail_url ? (
                <img
                  src={post.thumbnail_url}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <span className="text-5xl">&#128221;</span>
                </div>
              )}
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-2">
                  {new Date(post.published_at).toLocaleDateString('ja-JP')}
                </p>
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-3">
                  {post.summary}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="text-center mt-10">
        <Link
          to="/blog"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          すべての記事を見る
          <span className="ml-2">&rarr;</span>
        </Link>
      </div>
    </section>
  );
}

export default function Landing() {
  const handleOpenHome = () => {
    window.open('/home', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <img src="/cocosumo-logo.png" alt="CoCoスモ" className="h-8" />
          <button
            onClick={handleOpenHome}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            ログイン
          </button>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="flex justify-center items-center mb-8 w-full">
          <img src="/cocosumo_logo_top.png" alt="CoCoスモ" className="h-32 sm:h-48 mx-auto object-contain max-w-full" />
        </div>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          AI画像生成、VRツアー作成、物件管理を一つのプラットフォームで。
          <br />
          不動産会社の業務効率を劇的に向上させます。
        </p>
        <button
          onClick={handleOpenHome}
          className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-lg text-lg font-medium transition-colors shadow-lg"
        >
          今すぐ始める
        </button>
      </section>

      {/* 機能紹介セクション */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          主な機能
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* 機能1: 物件管理 */}
          <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🏢</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">物件管理</h3>
            <p className="text-gray-600">
              建物・部屋情報をGoogleマップ連携のGISシステムで一元管理。位置情報と共に効率的に物件を管理できます。
            </p>
          </div>

          {/* 機能2: AI画像生成 */}
          <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">AI画像生成</h3>
            <p className="text-gray-600">
              Gemini NanoBananaを活用し、室内写真から「家具なし」「家具あり」の画像を自動生成。Before/After表示で効果的な訴求が可能です。
            </p>
          </div>

          {/* 機能3: VRツアー */}
          <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🥽</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">VRルームツアー</h3>
            <p className="text-gray-600">
              360度パノラマビューでVRルームツアーを簡単に作成・編集。遠隔地の顧客にもリアルな物件体験を提供できます。
            </p>
          </div>

          {/* 機能4: 埋め込み機能 */}
          <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">簡単埋め込み</h3>
            <p className="text-gray-600">
              作成したコンテンツはiframeで簡単に外部サイトへ埋め込み可能。自社ホームページへシームレスに統合できます。
            </p>
          </div>

          {/* 機能5: マルチテナント */}
          <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">マルチテナント対応</h3>
            <p className="text-gray-600">
              会社ごとに独立した環境を提供。チームメンバー間で物件情報を共有し、効率的に業務を進められます。
            </p>
          </div>

          {/* 機能6: 管理機能 */}
          <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">⚙️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">管理者機能</h3>
            <p className="text-gray-600">
              ユーザーアカウントの発行・管理を管理者画面から簡単に実行。権限管理も柔軟に設定できます。
            </p>
          </div>
        </div>
      </section>

      {/* ブログセクション */}
      <BlogSection />

      {/* お問い合わせセクション */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-white rounded-xl p-8 shadow-lg max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            お問い合わせ
          </h2>
          <p className="text-gray-600 mb-6">
            サービスについてのご質問やご相談は、お気軽にお問い合わせください。
          </p>
          <div className="flex flex-col items-center gap-4">
            <a
              href="mailto:support@cocosumo.space"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              <span className="mr-2">✉️</span>
              メールで問い合わせる
            </a>
            <div className="flex items-center gap-2 text-gray-700">
              <span className="text-sm text-gray-500">メールアドレス:</span>
              <span className="font-mono text-base select-all">support@cocosumo.space</span>
            </div>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} CoCoスモ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
