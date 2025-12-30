/**
 * Analytics Event Hooks
 * Simplified hooks for tracking user interactions and behavior
 */

import { useEffect, useRef, useCallback } from 'react';
import { trackEvent } from '../services/analytics';
import {
  trackPropertyView,
  trackPhotoView,
  trackVRTourInteraction,
  trackScrollDepth,
  trackTimeOnPage,
  trackContactFormProgress,
  trackFormFieldInteraction,
  trackFormAbandonment
} from '../services/advancedAnalytics';

/**
 * Track component visibility (impression tracking)
 * @param {string} eventName - Event name to track
 * @param {object} metadata - Additional event metadata
 * @param {object} options - Tracking options
 */
export function useImpressionTracking(eventName, metadata = {}, options = {}) {
  const ref = useRef(null);
  const hasTracked = useRef(false);
  const { threshold = 0.5, trackOnce = true } = options;

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && (!trackOnce || !hasTracked.current)) {
            hasTracked.current = true;
            trackEvent(eventName, {
              ...metadata,
              visibility_ratio: entry.intersectionRatio
            });
          }
        });
      },
      { threshold }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [eventName, metadata, threshold, trackOnce]);

  return ref;
}

/**
 * Track time spent on a component/section
 * @param {string} sectionName - Section identifier
 * @param {object} metadata - Additional metadata
 */
export function useTimeTracking(sectionName, metadata = {}) {
  const startTime = useRef(Date.now());
  const isVisible = useRef(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisible.current = false;
      } else {
        // Reset timer when page becomes visible again
        startTime.current = Date.now();
        isVisible.current = true;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Track time on unmount
      if (isVisible.current) {
        const duration = Date.now() - startTime.current;
        trackEvent('time_on_section', {
          section_name: sectionName,
          duration_seconds: Math.round(duration / 1000),
          ...metadata
        });
      }
    };
  }, [sectionName, metadata]);
}

/**
 * Track property page view with automatic cleanup
 * @param {object} property - Property data
 * @param {string} source - Traffic source
 */
export function usePropertyViewTracking(property, source = 'direct') {
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (!property?.id) return;

    trackPropertyView(property, source);

    return () => {
      const duration = Date.now() - startTime.current;
      trackTimeOnPage(property.id, duration);
    };
  }, [property?.id, source]);
}

/**
 * Track scroll depth on a page
 * @param {string} pageId - Page identifier
 * @param {number[]} thresholds - Depth percentages to track (default: 25, 50, 75, 100)
 */
export function useScrollDepthTracking(pageId, thresholds = [25, 50, 75, 100]) {
  const trackedDepths = useRef(new Set());
  const currentSection = useRef('');

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);

      // Track threshold crossings
      thresholds.forEach((threshold) => {
        if (scrollPercent >= threshold && !trackedDepths.current.has(threshold)) {
          trackedDepths.current.add(threshold);
          trackScrollDepth(pageId, threshold, currentSection.current);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pageId, thresholds]);

  // Function to update current section
  const setCurrentSection = useCallback((sectionName) => {
    currentSection.current = sectionName;
  }, []);

  return { setCurrentSection };
}

/**
 * Track form interactions with abandonment detection
 * @param {string} formName - Form identifier
 * @param {object} options - Tracking options
 */
export function useFormTracking(formName, options = {}) {
  const { propertyId = null } = options;
  const formState = useRef({
    startTime: null,
    lastField: null,
    filledFields: new Set(),
    submitted: false
  });

  const trackFieldFocus = useCallback((fieldName) => {
    if (!formState.current.startTime) {
      formState.current.startTime = Date.now();
      trackContactFormProgress(propertyId, 'start', {});
    }
    formState.current.lastField = fieldName;
    trackFormFieldInteraction(formName, fieldName, 'focus');
  }, [formName, propertyId]);

  const trackFieldBlur = useCallback((fieldName, hasValue) => {
    if (hasValue) {
      formState.current.filledFields.add(fieldName);
    }
    trackFormFieldInteraction(formName, fieldName, 'blur');
  }, [formName]);

  const trackFieldChange = useCallback((fieldName) => {
    trackFormFieldInteraction(formName, fieldName, 'change');
  }, [formName]);

  const trackFieldError = useCallback((fieldName, errorMessage) => {
    trackFormFieldInteraction(formName, fieldName, 'error');
    trackEvent('form_validation_error', {
      form_name: formName,
      field_name: fieldName,
      error_message: errorMessage?.substring(0, 100)
    });
  }, [formName]);

  const trackSubmit = useCallback((success = true, data = {}) => {
    formState.current.submitted = true;
    trackContactFormProgress(propertyId, success ? 'complete' : 'error', data);

    const duration = formState.current.startTime
      ? Date.now() - formState.current.startTime
      : 0;

    trackEvent('form_submit', {
      form_name: formName,
      success,
      duration_seconds: Math.round(duration / 1000),
      fields_count: formState.current.filledFields.size
    });
  }, [formName, propertyId]);

  // Track abandonment on unmount
  useEffect(() => {
    return () => {
      if (
        formState.current.startTime &&
        !formState.current.submitted &&
        formState.current.filledFields.size > 0
      ) {
        trackFormAbandonment(
          formName,
          formState.current.lastField,
          Array.from(formState.current.filledFields)
        );
      }
    };
  }, [formName]);

  return {
    trackFieldFocus,
    trackFieldBlur,
    trackFieldChange,
    trackFieldError,
    trackSubmit
  };
}

/**
 * Track click events on elements
 * @param {string} eventName - Event name
 * @param {object} metadata - Additional metadata
 */
export function useClickTracking(eventName, metadata = {}) {
  const handleClick = useCallback((event) => {
    const target = event.currentTarget;
    trackEvent(eventName, {
      ...metadata,
      element_tag: target.tagName,
      element_text: target.textContent?.substring(0, 50),
      element_id: target.id || undefined
    });
  }, [eventName, metadata]);

  return handleClick;
}

/**
 * Track photo gallery navigation
 * @param {string} propertyId - Property ID
 */
export function usePhotoGalleryTracking(propertyId) {
  const viewedPhotos = useRef(new Set());

  const trackPhotoNavigation = useCallback((index, photoType = 'room') => {
    if (!viewedPhotos.current.has(index)) {
      viewedPhotos.current.add(index);
      trackPhotoView(propertyId, index, photoType);
    }
  }, [propertyId]);

  const trackGalleryOpen = useCallback(() => {
    trackEvent('gallery_open', { property_id: propertyId });
  }, [propertyId]);

  const trackGalleryClose = useCallback(() => {
    trackEvent('gallery_close', {
      property_id: propertyId,
      photos_viewed: viewedPhotos.current.size
    });
  }, [propertyId]);

  return {
    trackPhotoNavigation,
    trackGalleryOpen,
    trackGalleryClose
  };
}

/**
 * Track VR tour engagement
 * @param {string} propertyId - Property ID
 */
export function useVRTourTracking(propertyId) {
  const startTime = useRef(null);
  const interactionCount = useRef(0);

  const trackTourStart = useCallback(() => {
    startTime.current = Date.now();
    trackVRTourInteraction(propertyId, 'start');
  }, [propertyId]);

  const trackTourInteraction = useCallback((action) => {
    interactionCount.current += 1;
    const duration = startTime.current ? Date.now() - startTime.current : 0;
    trackVRTourInteraction(propertyId, action, duration);
  }, [propertyId]);

  const trackTourEnd = useCallback(() => {
    const duration = startTime.current ? Date.now() - startTime.current : 0;
    trackVRTourInteraction(propertyId, 'exit', duration);

    trackEvent('vr_tour_summary', {
      property_id: propertyId,
      duration_seconds: Math.round(duration / 1000),
      interaction_count: interactionCount.current
    });
  }, [propertyId]);

  return {
    trackTourStart,
    trackTourInteraction,
    trackTourEnd
  };
}

export default {
  useImpressionTracking,
  useTimeTracking,
  usePropertyViewTracking,
  useScrollDepthTracking,
  useFormTracking,
  useClickTracking,
  usePhotoGalleryTracking,
  useVRTourTracking
};
