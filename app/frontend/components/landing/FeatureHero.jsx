import React from "react";

function ScreenshotPlaceholder({ icon: Icon, gradient }) {
  return (
    <div className={`aspect-video rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
      <div className="text-white/30 scale-[3]">
        <Icon />
      </div>
    </div>
  );
}

export default function FeatureHero({ feature }) {
  const { title, tagline, description, icon: Icon, gradient, screenshot } = feature;

  return (
    <section className={`pt-24 pb-16 bg-gradient-to-br ${gradient}`}>
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div className="text-white">
            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center mb-6 backdrop-blur-sm">
              <Icon />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{title}</h1>
            <p className="text-xl md:text-2xl text-white/90 font-medium mb-6">{tagline}</p>
            <p className="text-white/80 text-lg leading-relaxed max-w-xl">{description}</p>
          </div>
          {/* Right: Screenshot */}
          <div className="relative">
            <div className="rounded-xl overflow-hidden shadow-2xl border border-white/20">
              {screenshot ? (
                <img
                  src={screenshot}
                  alt={title}
                  className="w-full h-auto object-cover"
                />
              ) : (
                <ScreenshotPlaceholder icon={Icon} gradient={gradient} />
              )}
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
