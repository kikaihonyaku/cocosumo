import React from "react";

export default function FeatureWorkflow({ workflow }) {
  return (
    <section className="py-20 bg-[#1e3a5f]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">使い方</h2>
          <p className="text-white/70">シンプルなステップで、すぐに始められます</p>
        </div>
        <div className={`grid ${workflow.length === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-8 max-w-5xl mx-auto`}>
          {workflow.map((step) => (
            <div key={step.step} className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#c9a227] text-white flex items-center justify-center text-xl font-bold mx-auto mb-5">
                {step.step}
              </div>
              <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
              <p className="text-white/70 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
