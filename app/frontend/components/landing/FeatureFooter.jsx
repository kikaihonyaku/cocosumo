import React from "react";
import { Link } from "react-router-dom";

export default function FeatureFooter() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <Link to="/">
            <img src="/cocosumo-logo.png" alt="CoCoスモ" className="h-8 brightness-0 invert" />
          </Link>
          <nav className="flex gap-8 text-sm text-gray-400">
            <Link to="/#features" className="hover:text-white transition-colors">機能</Link>
            <Link to="/#pricing" className="hover:text-white transition-colors">料金</Link>
            <Link to="/#faq" className="hover:text-white transition-colors">FAQ</Link>
            <Link to="/blog" className="hover:text-white transition-colors">ブログ</Link>
          </nav>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} CoCoスモ. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
