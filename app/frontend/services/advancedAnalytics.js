/**
 * Advanced Analytics Service
 * Provides enhanced tracking for user behavior, conversions, and business metrics
 */

import { trackEvent, setUserProperties } from './analytics';

// Conversion funnel stages
export const FUNNEL_STAGES = {
  PROPERTY_VIEW: 'property_view',
  PHOTO_VIEW: 'photo_view',
  VR_TOUR_START: 'vr_tour_start',
  CONTACT_FORM_START: 'contact_form_start',
  CONTACT_FORM_COMPLETE: 'contact_form_complete',
  PHONE_CLICK: 'phone_click',
  SCHEDULE_VIEW: 'schedule_view'
};

// Session storage key
const SESSION_KEY = 'cocosumo_analytics_session';

/**
 * Get or create session ID
 */
function getSessionId() {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Get stored funnel data
 */
function getFunnelData() {
  try {
    const data = sessionStorage.getItem('cocosumo_funnel_data');
    return data ? JSON.parse(data) : { stages: [], properties: [] };
  } catch {
    return { stages: [], properties: [] };
  }
}

/**
 * Store funnel data
 */
function setFunnelData(data) {
  try {
    sessionStorage.setItem('cocosumo_funnel_data', JSON.stringify(data));
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Track funnel stage
 */
export function trackFunnelStage(stage, metadata = {}) {
  const funnelData = getFunnelData();
  const timestamp = Date.now();

  funnelData.stages.push({
    stage,
    timestamp,
    ...metadata
  });

  setFunnelData(funnelData);

  // Also send to GA4
  trackEvent('funnel_progress', {
    funnel_stage: stage,
    session_id: getSessionId(),
    stage_sequence: funnelData.stages.length,
    ...metadata
  });

  return funnelData;
}

/**
 * Track property interaction
 */
export function trackPropertyInteraction(propertyId, interactionType, metadata = {}) {
  const funnelData = getFunnelData();

  if (!funnelData.properties.includes(propertyId)) {
    funnelData.properties.push(propertyId);
    setFunnelData(funnelData);
  }

  trackEvent('property_interaction', {
    property_id: propertyId,
    interaction_type: interactionType,
    properties_viewed: funnelData.properties.length,
    session_id: getSessionId(),
    ...metadata
  });
}

/**
 * Enhanced property view tracking
 */
export function trackPropertyView(property, source = 'direct') {
  trackFunnelStage(FUNNEL_STAGES.PROPERTY_VIEW, {
    property_id: property.id,
    property_title: property.title,
    property_rent: property.room?.rent,
    property_area: property.room?.area,
    property_type: property.room?.room_type,
    source
  });

  trackPropertyInteraction(property.id, 'view', {
    source,
    template_type: property.template_type
  });
}

/**
 * Track photo gallery interaction
 */
export function trackPhotoView(propertyId, photoIndex, photoType = 'room') {
  if (photoIndex === 0) {
    trackFunnelStage(FUNNEL_STAGES.PHOTO_VIEW, { property_id: propertyId });
  }

  trackEvent('photo_view', {
    property_id: propertyId,
    photo_index: photoIndex,
    photo_type: photoType,
    session_id: getSessionId()
  });
}

/**
 * Track VR tour interaction
 */
export function trackVRTourInteraction(propertyId, action, duration = 0) {
  if (action === 'start') {
    trackFunnelStage(FUNNEL_STAGES.VR_TOUR_START, { property_id: propertyId });
  }

  trackEvent('vr_tour_interaction', {
    property_id: propertyId,
    action, // start, rotate, zoom, exit
    duration_seconds: Math.round(duration / 1000),
    session_id: getSessionId()
  });
}

/**
 * Track virtual staging interaction
 */
export function trackVirtualStagingInteraction(propertyId, action, beforeAfterRatio = null) {
  trackEvent('virtual_staging_interaction', {
    property_id: propertyId,
    action, // view, compare, toggle
    before_after_ratio: beforeAfterRatio,
    session_id: getSessionId()
  });
}

/**
 * Track contact form progress
 */
export function trackContactFormProgress(propertyId, step, formData = {}) {
  const stepLabels = {
    start: FUNNEL_STAGES.CONTACT_FORM_START,
    complete: FUNNEL_STAGES.CONTACT_FORM_COMPLETE
  };

  if (stepLabels[step]) {
    trackFunnelStage(stepLabels[step], { property_id: propertyId });
  }

  trackEvent('contact_form_progress', {
    property_id: propertyId,
    form_step: step,
    fields_filled: Object.keys(formData).filter(k => formData[k]).length,
    session_id: getSessionId()
  });
}

/**
 * Track form field interaction
 */
export function trackFormFieldInteraction(formName, fieldName, action) {
  trackEvent('form_field_interaction', {
    form_name: formName,
    field_name: fieldName,
    action, // focus, blur, change, error
    session_id: getSessionId()
  });
}

/**
 * Track form abandonment
 */
export function trackFormAbandonment(formName, lastField, filledFields) {
  trackEvent('form_abandonment', {
    form_name: formName,
    last_field: lastField,
    filled_fields: filledFields,
    session_id: getSessionId()
  });
}

/**
 * Track phone click
 */
export function trackPhoneClick(propertyId, phoneNumber) {
  trackFunnelStage(FUNNEL_STAGES.PHONE_CLICK, { property_id: propertyId });

  trackEvent('phone_click', {
    property_id: propertyId,
    phone_masked: phoneNumber.slice(-4),
    session_id: getSessionId()
  });
}

/**
 * Track scroll depth
 */
export function trackScrollDepth(propertyId, depth, sectionReached) {
  trackEvent('scroll_depth', {
    property_id: propertyId,
    depth_percent: depth,
    section_reached: sectionReached,
    session_id: getSessionId()
  });
}

/**
 * Track time on page
 */
export function trackTimeOnPage(propertyId, duration) {
  trackEvent('time_on_page', {
    property_id: propertyId,
    duration_seconds: Math.round(duration / 1000),
    session_id: getSessionId()
  });
}

/**
 * Track share action
 */
export function trackShare(propertyId, method, success = true) {
  trackEvent('property_share', {
    property_id: propertyId,
    share_method: method, // copy_url, line, twitter, facebook, email
    success,
    session_id: getSessionId()
  });
}

/**
 * Track comparison action
 */
export function trackComparison(propertyIds, action) {
  trackEvent('property_comparison', {
    property_ids: propertyIds.join(','),
    property_count: propertyIds.length,
    action, // add, remove, view, clear
    session_id: getSessionId()
  });
}

/**
 * Track PDF export
 */
export function trackPdfExport(propertyId, success = true) {
  trackEvent('pdf_export', {
    property_id: propertyId,
    success,
    session_id: getSessionId()
  });
}

/**
 * Track search behavior
 */
export function trackSearch(query, filters, resultCount) {
  trackEvent('property_search', {
    query: query.substring(0, 100),
    filter_count: Object.keys(filters).filter(k => filters[k]).length,
    result_count: resultCount,
    session_id: getSessionId()
  });
}

/**
 * Track user engagement score
 */
export function calculateEngagementScore() {
  const funnelData = getFunnelData();
  let score = 0;

  // Base score from stages reached
  const stageWeights = {
    [FUNNEL_STAGES.PROPERTY_VIEW]: 10,
    [FUNNEL_STAGES.PHOTO_VIEW]: 15,
    [FUNNEL_STAGES.VR_TOUR_START]: 25,
    [FUNNEL_STAGES.CONTACT_FORM_START]: 30,
    [FUNNEL_STAGES.CONTACT_FORM_COMPLETE]: 50,
    [FUNNEL_STAGES.PHONE_CLICK]: 40
  };

  const reachedStages = new Set(funnelData.stages.map(s => s.stage));
  reachedStages.forEach(stage => {
    score += stageWeights[stage] || 0;
  });

  // Bonus for multiple properties viewed
  score += Math.min(funnelData.properties.length * 5, 25);

  return Math.min(score, 100);
}

/**
 * Get conversion funnel analysis
 */
export function getFunnelAnalysis() {
  const funnelData = getFunnelData();
  const stages = funnelData.stages;

  if (stages.length === 0) {
    return { stages: [], dropOff: null, timeToConvert: null };
  }

  // Calculate time between stages
  const stageTimings = [];
  for (let i = 1; i < stages.length; i++) {
    stageTimings.push({
      from: stages[i - 1].stage,
      to: stages[i].stage,
      duration: stages[i].timestamp - stages[i - 1].timestamp
    });
  }

  // Find last stage reached
  const lastStage = stages[stages.length - 1].stage;

  // Check if converted (reached contact form complete)
  const converted = stages.some(s => s.stage === FUNNEL_STAGES.CONTACT_FORM_COMPLETE);

  return {
    stagesReached: [...new Set(stages.map(s => s.stage))],
    totalStages: stages.length,
    lastStage,
    converted,
    stageTimings,
    propertiesViewed: funnelData.properties.length,
    engagementScore: calculateEngagementScore()
  };
}

/**
 * Send funnel analysis to analytics on session end
 */
export function reportFunnelOnUnload() {
  const analysis = getFunnelAnalysis();

  if (analysis.totalStages > 0) {
    // Use sendBeacon for reliable delivery on page unload
    const data = {
      event: 'session_funnel_summary',
      ...analysis,
      session_id: getSessionId()
    };

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/v1/analytics/funnel', JSON.stringify(data));
    }
  }
}

/**
 * Initialize advanced analytics
 */
export function initAdvancedAnalytics() {
  // Report funnel on page unload
  window.addEventListener('beforeunload', reportFunnelOnUnload);

  // Set user properties
  setUserProperties({
    session_id: getSessionId(),
    user_agent_type: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
  });

  return () => {
    window.removeEventListener('beforeunload', reportFunnelOnUnload);
  };
}

export default {
  FUNNEL_STAGES,
  trackFunnelStage,
  trackPropertyInteraction,
  trackPropertyView,
  trackPhotoView,
  trackVRTourInteraction,
  trackVirtualStagingInteraction,
  trackContactFormProgress,
  trackFormFieldInteraction,
  trackFormAbandonment,
  trackPhoneClick,
  trackScrollDepth,
  trackTimeOnPage,
  trackShare,
  trackComparison,
  trackPdfExport,
  trackSearch,
  calculateEngagementScore,
  getFunnelAnalysis,
  initAdvancedAnalytics
};
