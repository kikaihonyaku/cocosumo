import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

// SVGアイコンコンポーネント
const Icons = {
  Building: () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  AI: () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  VR: () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  Link: () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  Users: () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  Play: () => (
    <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
};

// FAQアイテムコンポーネント
function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200">
      <button
        className="w-full py-5 flex justify-between items-center text-left hover:text-[#1e3a5f] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-gray-900">{question}</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <Icons.ChevronDown />
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-5' : 'max-h-0'}`}>
        <p className="text-gray-600">{answer}</p>
      </div>
    </div>
  );
}

// ブログセクション
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
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1e3a5f] mb-4">
            開発者ブログ
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            CoCoスモの最新機能や更新情報をお届けします
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {posts.map((post) => (
            <Link
              key={post.public_id}
              to={`/blog/${post.public_id}`}
              className="group"
            >
              <article className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden h-full border border-gray-100">
                {post.thumbnail_url ? (
                  <img
                    src={post.thumbnail_url}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] flex items-center justify-center">
                    <span className="text-5xl text-white/30">&#128221;</span>
                  </div>
                )}
                <div className="p-6">
                  <time className="text-sm text-[#c9a227] font-medium">
                    {new Date(post.published_at).toLocaleDateString('ja-JP')}
                  </time>
                  <h3 className="text-lg font-bold text-gray-900 mt-2 mb-3 group-hover:text-[#1e3a5f] transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {post.summary}
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/blog"
            className="inline-flex items-center text-[#1e3a5f] hover:text-[#c9a227] font-medium transition-colors"
          >
            すべての記事を見る
            <span className="ml-2">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

// 機能データ
const features = [
  {
    icon: Icons.Building,
    title: "物件管理",
    description: "建物・部屋情報をGoogleマップ連携のGISシステムで一元管理。位置情報と共に効率的に物件を管理できます。"
  },
  {
    icon: Icons.AI,
    title: "AI画像生成",
    description: "Gemini AIを活用し、室内写真から「家具なし」「家具あり」の画像を自動生成。Before/After表示で効果的な訴求が可能です。"
  },
  {
    icon: Icons.VR,
    title: "VRルームツアー",
    description: "360度パノラマビューでVRルームツアーを簡単に作成・編集。遠隔地の顧客にもリアルな物件体験を提供できます。"
  },
  {
    icon: Icons.Link,
    title: "簡単埋め込み",
    description: "作成したコンテンツはiframeで簡単に外部サイトへ埋め込み可能。自社ホームページへシームレスに統合できます。"
  },
  {
    icon: Icons.Users,
    title: "マルチテナント対応",
    description: "会社ごとに独立した環境を提供。チームメンバー間で物件情報を共有し、効率的に業務を進められます。"
  },
  {
    icon: Icons.Settings,
    title: "管理者機能",
    description: "ユーザーアカウントの発行・管理を管理者画面から簡単に実行。権限管理も柔軟に設定できます。"
  },
];

// FAQデータ
const faqs = [
  {
    question: "無料トライアルの期間はどのくらいですか？",
    answer: "無料トライアル期間は30日間です。期間中はすべての機能をお試しいただけます。トライアル終了後、自動的に課金されることはありませんのでご安心ください。"
  },
  {
    question: "導入にはどのくらいの時間がかかりますか？",
    answer: "アカウント作成後、すぐにご利用いただけます。物件データのインポートについても、CSVファイルから一括登録が可能です。また、SUUMOからの自動インポート機能もご用意しています。"
  },
  {
    question: "VRツアーの作成に特別な機材は必要ですか？",
    answer: "360度カメラがあれば、より本格的なVRツアーが作成できますが、通常のスマートフォンで撮影した写真でも簡易的なツアーを作成することが可能です。"
  },
  {
    question: "セキュリティ対策はどうなっていますか？",
    answer: "すべてのデータは暗号化されて保存され、通信もSSL/TLSで保護されています。また、マルチテナント方式により、他社のデータと完全に分離されています。"
  },
  {
    question: "サポート体制について教えてください",
    answer: "メールでのサポートを提供しています。また、操作マニュアルやFAQも充実させており、ほとんどの疑問はすぐに解決できます。"
  },
];

// 実績データ
const stats = [
  { value: "500+", label: "登録物件数" },
  { value: "50%", label: "業務時間削減" },
  { value: "24/7", label: "システム稼働" },
];

export default function Landing() {
  const handleOpenHome = () => {
    window.open('/home', '_blank');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <img src="/cocosumo-logo.png" alt="CoCoスモ" className="h-8" />
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-[#1e3a5f] transition-colors">機能</a>
            <a href="#demo" className="text-gray-600 hover:text-[#1e3a5f] transition-colors">デモ</a>
            <a href="#pricing" className="text-gray-600 hover:text-[#1e3a5f] transition-colors">料金</a>
            <a href="#faq" className="text-gray-600 hover:text-[#1e3a5f] transition-colors">FAQ</a>
          </nav>
          <button
            onClick={handleOpenHome}
            className="bg-[#1e3a5f] hover:bg-[#2d5a8a] text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            ログイン
          </button>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#c9a227]/10 text-[#c9a227] px-4 py-2 rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-[#c9a227] rounded-full animate-pulse"></span>
                不動産業務をDXで変革
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-[#1e3a5f] leading-tight mb-6">
                不動産管理の
                <br />
                <span className="text-[#c9a227]">すべて</span>を、
                <br />
                ひとつに。
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                AI画像生成、VRツアー作成、物件管理を
                <br className="hidden sm:block" />
                一つのプラットフォームで。
                <br className="hidden sm:block" />
                不動産会社の業務効率を劇的に向上させます。
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleOpenHome}
                  className="bg-[#1e3a5f] hover:bg-[#2d5a8a] text-white px-8 py-4 rounded-lg text-lg font-medium transition-all shadow-lg hover:shadow-xl"
                >
                  無料で試してみる
                </button>
                <a
                  href="#demo"
                  className="inline-flex items-center justify-center border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white px-8 py-4 rounded-lg text-lg font-medium transition-all"
                >
                  デモを見る
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] rounded-2xl p-1">
                <div className="bg-gray-900 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-800">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                        <Icons.Play />
                      </div>
                      <p className="text-white/60 text-sm">デモ画面</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* 装飾 */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#c9a227]/20 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#1e3a5f]/20 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 実績セクション */}
      <section className="py-16 bg-[#1e3a5f]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-4xl lg:text-5xl font-bold text-[#c9a227] mb-2">{stat.value}</div>
                <div className="text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 機能紹介セクション */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#1e3a5f] mb-4">
              主な機能
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              不動産業務に必要なすべての機能を、一つのプラットフォームで提供します
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 rounded-xl border border-gray-200 hover:border-[#c9a227] hover:shadow-lg transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-lg bg-[#1e3a5f]/10 text-[#1e3a5f] flex items-center justify-center mb-5 group-hover:bg-[#c9a227] group-hover:text-white transition-all">
                  <feature.icon />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* デモセクション */}
      <section id="demo" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1e3a5f] mb-4">
              実際の画面をご覧ください
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              直感的な操作で、誰でも簡単に使いこなせます
            </p>
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 bg-gray-100 border-b">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="ml-4 text-sm text-gray-500">CoCoスモ - 物件管理システム</span>
              </div>
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center">
                    <svg className="w-12 h-12 text-[#1e3a5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">スクリーンショットまたはデモ動画</p>
                  <p className="text-sm text-gray-400 mt-2">準備中</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 料金セクション */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1e3a5f] mb-4">
              まずは無料でお試しください
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              30日間の無料トライアルで、すべての機能をお試しいただけます
            </p>
          </div>
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border-2 border-[#c9a227] overflow-hidden">
              <div className="bg-[#c9a227] text-white text-center py-2 text-sm font-medium">
                30日間無料トライアル
              </div>
              <div className="p-8">
                <div className="text-center mb-8">
                  <p className="text-gray-600 mb-2">すべての機能が使える</p>
                  <div className="text-5xl font-bold text-[#1e3a5f]">
                    ¥0
                    <span className="text-lg font-normal text-gray-500">/30日間</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8">
                  {[
                    "物件管理（無制限）",
                    "AI画像生成",
                    "VRツアー作成",
                    "マルチテナント対応",
                    "メールサポート",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Icons.Check />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleOpenHome}
                  className="w-full bg-[#1e3a5f] hover:bg-[#2d5a8a] text-white py-4 rounded-lg font-medium transition-colors text-lg"
                >
                  無料トライアルを始める
                </button>
                <p className="text-center text-sm text-gray-500 mt-4">
                  クレジットカード不要・自動課金なし
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQセクション */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1e3a5f] mb-4">
              よくあるご質問
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              ご不明な点がございましたら、お気軽にお問い合わせください
            </p>
          </div>
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm">
            <div className="p-6 md:p-8">
              {faqs.map((faq, index) => (
                <FAQItem key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ブログセクション */}
      <BlogSection />

      {/* お問い合わせセクション */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              お問い合わせ
            </h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              サービスについてのご質問やご相談は、お気軽にお問い合わせください。
              担当者が丁寧にご対応いたします。
            </p>
            <a
              href="mailto:support@cocosumo.space"
              className="inline-flex items-center justify-center bg-white text-[#1e3a5f] hover:bg-[#c9a227] hover:text-white px-8 py-4 rounded-lg font-medium transition-colors text-lg"
            >
              メールで問い合わせる
            </a>
            <p className="text-white/60 text-sm mt-4">
              support@cocosumo.space
            </p>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <img src="/cocosumo-logo.png" alt="CoCoスモ" className="h-8 brightness-0 invert" />
            <nav className="flex gap-8 text-sm text-gray-400">
              <a href="#features" className="hover:text-white transition-colors">機能</a>
              <a href="#pricing" className="hover:text-white transition-colors">料金</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              <Link to="/blog" className="hover:text-white transition-colors">ブログ</Link>
            </nav>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} CoCoスモ. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
