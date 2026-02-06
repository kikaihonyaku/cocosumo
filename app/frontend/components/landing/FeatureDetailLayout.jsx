import React from "react";
import FeatureNav from "./FeatureNav";
import FeatureHero from "./FeatureHero";
import FeatureProblemSolution from "./FeatureProblemSolution";
import FeatureBenefits from "./FeatureBenefits";
import FeatureHighlights from "./FeatureHighlights";
import FeatureWorkflow from "./FeatureWorkflow";
import FeatureCTA from "./FeatureCTA";
import FeatureFooter from "./FeatureFooter";

export default function FeatureDetailLayout({ feature }) {
  return (
    <div className="min-h-screen bg-white">
      <FeatureNav featureTitle={feature.title} />
      <FeatureHero feature={feature} />
      <FeatureProblemSolution problems={feature.problems} solutions={feature.solutions} />
      <FeatureBenefits benefits={feature.benefits} />
      <FeatureHighlights highlights={feature.highlights} gradient={feature.gradient} />
      <FeatureWorkflow workflow={feature.workflow} />
      <FeatureCTA relatedSlugs={feature.relatedSlugs} />
      <FeatureFooter />
    </div>
  );
}
