import React from "react";

function HighlightPlaceholder({ gradient }) {
  return (
    <div className={`aspect-video rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
      <span className="text-white/20 text-6xl">Coming Soon</span>
    </div>
  );
}

export default function FeatureHighlights({ highlights, gradient }) {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-[#1e3a5f] mb-4">機能ハイライト</h2>
        </div>
        <div className="max-w-6xl mx-auto space-y-20">
          {highlights.map((highlight, index) => {
            const isReversed = index % 2 === 1;
            return (
              <div
                key={index}
                className={`flex flex-col ${isReversed ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 md:gap-12`}
              >
                {/* Text */}
                <div className="w-full md:w-1/2">
                  <span className="inline-block text-[#c9a227] text-sm font-medium tracking-wider uppercase mb-3">
                    {highlight.label}
                  </span>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{highlight.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{highlight.description}</p>
                </div>
                {/* Image */}
                <div className="w-full md:w-1/2">
                  <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
                    {highlight.screenshot ? (
                      <img
                        src={highlight.screenshot}
                        alt={highlight.title}
                        className="w-full h-auto object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <HighlightPlaceholder gradient={gradient} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
