import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

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

    return () => {
      document.title = 'CoCoスモ';
    };
  }, [publicId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-gray-600 mb-4">{error}</p>
        <Link to="/blog" className="text-blue-600 hover:underline">
          ブログ一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/">
            <img src="/cocosumo-logo.png" alt="CoCoスモ" className="h-8" />
          </Link>
          <Link to="/blog" className="text-gray-600 hover:text-gray-900">
            ブログ一覧
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <article className="max-w-3xl mx-auto">
          {/* サムネイル */}
          {post.thumbnail_url && (
            <img
              src={post.thumbnail_url}
              alt={post.title}
              className="w-full h-64 object-cover rounded-xl mb-8"
            />
          )}

          {/* メタ情報 */}
          <p className="text-gray-500 mb-4">
            {new Date(post.published_at).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>

          {/* タイトル */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            {post.title}
          </h1>

          {/* 本文（Markdown） */}
          <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* 戻るリンク */}
          <div className="mt-12 pt-8 border-t">
            <Link
              to="/blog"
              className="inline-flex items-center text-blue-600 hover:text-blue-700"
            >
              <span className="mr-2">&larr;</span>
              ブログ一覧に戻る
            </Link>
          </div>
        </article>
      </main>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} CoCoスモ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
