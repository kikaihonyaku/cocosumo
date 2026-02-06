import React, { useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import featureData from "./featureData";
import FeatureDetailLayout from "../../components/landing/FeatureDetailLayout";

export default function FeatureDetailPage() {
  const { featureSlug } = useParams();
  const feature = featureData[featureSlug];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [featureSlug]);

  if (!feature) {
    return <Navigate to="/" replace />;
  }

  return <FeatureDetailLayout feature={feature} />;
}
