import React from "react";
import { Link } from "react-router-dom";
import featureData from "../../pages/features/featureData";

export default function FeatureCTA({ relatedSlugs }) {
  const relatedFeatures = relatedSlugs
    .map((slug) => featureData[slug])
    .filter(Boolean);

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        {/* CTA */}
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] rounded-2xl p-8 md:p-12 text-center text-white mb-20">
          <h2 className="text-3xl font-bold mb-4">
            まずは無料でお試しください
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            30日間の無料トライアルで、すべての機能をお試しいただけます。
            クレジットカード不要・自動課金なし。
          </p>
          <a
            href="mailto:support@cocosumo.space"
            className="inline-flex items-center justify-center bg-white text-[#1e3a5f] hover:bg-[#c9a227] hover:text-white px-8 py-4 rounded-lg font-medium transition-colors text-lg"
          >
            お問い合わせはこちら
          </a>
          <p className="text-white/60 text-sm mt-4">
            support@cocosumo.space
          </p>
        </div>

        {/* Related Features */}
        {relatedFeatures.length > 0 && (
          <div className="max-w-6xl mx-auto">
            <h3 className="text-2xl font-bold text-[#1e3a5f] text-center mb-10">
              他の機能を見る
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              {relatedFeatures.map((feature) => {
                const FeatureIcon = feature.icon;
                return (
                  <Link
                    key={feature.slug}
                    to={`/features/${feature.slug}`}
                    className="group p-8 rounded-xl border border-gray-200 hover:border-[#c9a227] hover:shadow-lg transition-all duration-300"
                  >
                    <div className="w-14 h-14 rounded-lg bg-[#1e3a5f]/10 text-[#1e3a5f] flex items-center justify-center mb-5 group-hover:bg-[#c9a227] group-hover:text-white transition-all">
                      <FeatureIcon />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h4>
                    <p className="text-gray-600 leading-relaxed mb-4 line-clamp-2">{feature.tagline}</p>
                    <span className="text-[#1e3a5f] font-medium group-hover:text-[#c9a227] transition-colors">
                      詳しく見る &rarr;
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
