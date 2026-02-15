import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function LandingHeader() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  const handleLogin = () => {
    const hostname = window.location.hostname;
    if (hostname === 'cocosumo.space' || hostname === 'www.cocosumo.space') {
      window.location.href = 'https://demo.cocosumo.space/home';
    } else {
      window.open('/home', '_blank');
    }
  };

  // ランディングページではアンカーリンク、他ページでは /{path}#anchor 形式
  const navHref = (anchor) => isLandingPage ? `#${anchor}` : `/#${anchor}`;

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <img src="/cocosumo-logo.png" alt="CoCoスモ" className="h-8" />
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <a href={navHref('features')} className="text-gray-600 hover:text-[#1e3a5f] transition-colors">機能</a>
          <a href={navHref('demo')} className="text-gray-600 hover:text-[#1e3a5f] transition-colors">デモ</a>
          <a href={navHref('pricing')} className="text-gray-600 hover:text-[#1e3a5f] transition-colors">料金</a>
          <a href={navHref('faq')} className="text-gray-600 hover:text-[#1e3a5f] transition-colors">FAQ</a>
          <Link to="/blog" className="text-gray-600 hover:text-[#1e3a5f] transition-colors">開発者ブログ</Link>
        </nav>
        <button
          onClick={handleLogin}
          className="bg-[#1e3a5f] hover:bg-[#2d5a8a] text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
          ログイン
        </button>
      </div>
    </header>
  );
}
