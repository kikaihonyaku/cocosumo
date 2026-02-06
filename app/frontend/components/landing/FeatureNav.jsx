import React from "react";
import { Link } from "react-router-dom";

export default function FeatureNav({ featureTitle }) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/">
            <img src="/cocosumo-logo.png" alt="CoCoスモ" className="h-8" />
          </Link>
          <nav className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
            <Link to="/#features" className="hover:text-[#1e3a5f] transition-colors">機能一覧</Link>
            <span>/</span>
            <span className="text-[#1e3a5f] font-medium">{featureTitle}</span>
          </nav>
        </div>
        <Link
          to="/login"
          className="bg-[#1e3a5f] hover:bg-[#2d5a8a] text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
          ログイン
        </Link>
      </div>
    </header>
  );
}
