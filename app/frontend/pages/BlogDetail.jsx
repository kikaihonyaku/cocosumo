import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import LandingHeader from '../components/landing/LandingHeader';

// カスタムMarkdownコンポーネント
const MarkdownComponents = {
  // コードブロックのカスタムレンダリング（react-markdown v10対応）
  code(props) {
    const { node, className, children, ...rest } = props;
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';

    // 親要素がpreかどうかでインラインかブロックかを判定
    const isBlock = node?.position?.start?.line !== node?.position?.end?.line ||
                    String(children).includes('\n') ||
                    language;

    // インラインコードの場合
    if (!isBlock) {
      return (
        <code className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono" {...rest}>
          {children}
        </code>
      );
    }

    // コードブロックの場合
    return (
      <div className="relative group my-6">
        {language && (
          <div className="absolute top-0 right-0 px-3 py-1 text-xs text-gray-400 bg-gray-800 rounded-bl-lg rounded-tr-xl font-mono z-10">
            {language}
          </div>
        )}
        <SyntaxHighlighter
          style={oneDark}
          language={language || 'text'}
          PreTag="div"
          className="rounded-xl shadow-lg !my-0"
          showLineNumbers={language ? true : false}
          wrapLines={true}
          customStyle={{
            margin: 0,
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
            padding: '1rem',
          }}
          {...rest}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    );
  },
  // preタグをそのまま子要素として扱う（コードブロック用）
  pre({ children }) {
    return <>{children}</>;
  },
  // 見出しにアンカーリンクを追加
  h2({ children, ...props }) {
    const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    return (
      <h2 id={id} className="group" {...props}>
        <a href={`#${id}`} className="absolute -left-6 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-500">
          #
        </a>
        {children}
      </h2>
    );
  },
  h3({ children, ...props }) {
    const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    return (
      <h3 id={id} className="group" {...props}>
        <a href={`#${id}`} className="absolute -left-5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-500">
          #
        </a>
        {children}
      </h3>
    );
  },
  // テーブルのスタイリング
  table({ children }) {
    return (
      <div className="overflow-x-auto my-6">
        <table className="min-w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
          {children}
        </table>
      </div>
    );
  },
  // 画像のスタイリング
  img({ src, alt, ...props }) {
    return (
      <figure className="my-8">
        <img
          src={src}
          alt={alt}
          className="rounded-xl shadow-lg max-w-full h-auto mx-auto"
          loading="lazy"
          {...props}
        />
        {alt && (
          <figcaption className="text-center text-sm text-gray-500 mt-3">
            {alt}
          </figcaption>
        )}
      </figure>
    );
  },
  // 引用ブロック
  blockquote({ children }) {
    return (
      <blockquote className="border-l-4 border-blue-500 bg-blue-50 py-3 px-6 my-6 rounded-r-lg italic text-gray-700">
        {children}
      </blockquote>
    );
  },
  // リストアイテム
  li({ children, ...props }) {
    return (
      <li className="text-gray-700 mb-2 leading-relaxed" {...props}>
        {children}
      </li>
    );
  },
};

export default function BlogDetail() {
  const { publicId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`/api/v1/blog_posts/${publicId}/public`);
        setPost(response.data);
        document.title = `${response.data.title} | CoCoスモ 開発者ブログ`;
      } catch (err) {
        setError('記事が見つかりませんでした');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
    window.scrollTo(0, 0);

    return () => {
      document.title = 'CoCoスモ';
    };
  }, [publicId]);

  // 読了時間を計算（日本語は400文字/分で計算）
  const calculateReadingTime = (content) => {
    if (!content) return 1;
    const charCount = content.length;
    const minutes = Math.ceil(charCount / 400);
    return Math.max(1, minutes);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-gray-500 animate-pulse">記事を読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <p className="text-gray-600 mb-6 text-lg">{error}</p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors"
          >
            <span>&larr;</span>
            ブログ一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  const readingTime = calculateReadingTime(post.content);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <LandingHeader />

      <main className="container mx-auto px-4 pt-24 pb-8 md:pb-16">
        <article className="max-w-4xl mx-auto">
          {/* 戻るリンク（上部） */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors mb-8 group"
          >
            <span className="transform group-hover:-translate-x-1 transition-transform">&larr;</span>
            <span>ブログ一覧</span>
          </Link>

          {/* ヒーローセクション */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            {/* サムネイル */}
            {post.thumbnail_url ? (
              <div className="relative h-64 md:h-96 overflow-hidden">
                <img
                  src={post.thumbnail_url}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              </div>
            ) : (
              <div className="h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            )}

            {/* タイトルセクション */}
            <div className="p-6 md:p-10">
              {/* メタ情報 */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                <time className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(post.published_at).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  約{readingTime}分で読めます
                </span>
              </div>

              {/* タイトル */}
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 leading-tight">
                {post.title}
              </h1>

              {/* 要約 */}
              {post.summary && (
                <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                  {post.summary}
                </p>
              )}
            </div>
          </div>

          {/* 本文カード */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10">
            {/* 本文（Markdown） */}
            <div className="
              prose prose-lg max-w-none
              prose-headings:text-gray-900 prose-headings:font-bold prose-headings:relative
              prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-3 prose-h2:border-b prose-h2:border-gray-200
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
              prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-gray-900 prose-strong:font-semibold
              prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6
              prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6
              prose-hr:my-12 prose-hr:border-gray-200
            ">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={MarkdownComponents}
              >
                {post.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* 前後の記事リンク */}
          {(post.prev_post || post.next_post) && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 次の記事（新しい記事）- 左側 */}
              <div className="md:col-start-1">
                {post.prev_post && (
                  <Link
                    to={`/blog/${post.prev_post.public_id}`}
                    className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-5 group"
                  >
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      次の記事
                    </div>
                    <p className="text-gray-900 font-medium line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {post.prev_post.title}
                    </p>
                  </Link>
                )}
              </div>
              {/* 前の記事（古い記事）- 右側 */}
              <div className="md:col-start-2">
                {post.next_post && (
                  <Link
                    to={`/blog/${post.next_post.public_id}`}
                    className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-5 group text-right"
                  >
                    <div className="flex items-center justify-end gap-2 text-sm text-gray-500 mb-2">
                      前の記事
                      <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <p className="text-gray-900 font-medium line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {post.next_post.title}
                    </p>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* フッターナビゲーション */}
          <div className="mt-12 flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group"
            >
              <span className="transform group-hover:-translate-x-1 transition-transform">&larr;</span>
              ブログ一覧に戻る
            </Link>

            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm">この記事をシェア:</span>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 flex items-center justify-center bg-gray-100 hover:bg-blue-500 hover:text-white text-gray-600 rounded-full transition-colors"
                title="Xでシェア"
                aria-label="Xでシェア"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 flex items-center justify-center bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-600 rounded-full transition-colors"
                title="Facebookでシェア"
                aria-label="Facebookでシェア"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            </div>
          </div>
        </article>
      </main>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <img src="/cocosumo-logo.png" alt="CoCoスモ" className="h-8 brightness-0 invert" />
              <span className="text-gray-400">不動産業務を、もっとスマートに。</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <Link to="/" className="hover:text-white transition-colors">ホーム</Link>
              <Link to="/blog" className="hover:text-white transition-colors">ブログ</Link>
              <a href="mailto:info@cocosumo.com" className="hover:text-white transition-colors">お問い合わせ</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} CoCoスモ. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
