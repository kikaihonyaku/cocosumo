/**
 * Google Analytics 4 (GA4) Integration Service
 *
 * Environment variable required:
 * - VITE_GA_MEASUREMENT_ID: GA4 Measurement ID (e.g., 'G-XXXXXXXXXX')
 */

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Track if GA has been initialized
let isInitialized = false;

/**
 * Initialize Google Analytics
 * Should be called once when the app loads
 */
export const initializeGA = () => {
  if (isInitialized || !GA_MEASUREMENT_ID) {
    if (!GA_MEASUREMENT_ID) {
      console.log('[Analytics] GA Measurement ID not configured, analytics disabled');
    }
    return;
  }

  // Load gtag.js script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false // We'll manually track page views
  });

  isInitialized = true;
  console.log('[Analytics] GA4 initialized with ID:', GA_MEASUREMENT_ID);
};

/**
 * Track page view
 * @param {string} path - Page path
 * @param {string} title - Page title
 * @param {object} additionalParams - Additional parameters
 */
export const trackPageView = (path, title, additionalParams = {}) => {
  if (!isInitialized || !window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title,
    page_location: window.location.href,
    ...additionalParams
  });
};

/**
 * Track custom event
 * @param {string} eventName - Event name
 * @param {object} params - Event parameters
 */
export const trackEvent = (eventName, params = {}) => {
  if (!isInitialized || !window.gtag) return;

  window.gtag('event', eventName, params);
};

/**
 * Property Publication specific events
 */
export const PropertyAnalytics = {
  // Track property page view
  viewProperty: (publicationId, propertyTitle, templateType) => {
    trackEvent('view_property', {
      publication_id: publicationId,
      property_title: propertyTitle,
      template_type: templateType
    });
  },

  // Track photo gallery interaction
  viewPhoto: (publicationId, photoIndex, totalPhotos) => {
    trackEvent('view_photo', {
      publication_id: publicationId,
      photo_index: photoIndex,
      total_photos: totalPhotos
    });
  },

  // Track lightbox open
  openLightbox: (publicationId) => {
    trackEvent('open_lightbox', {
      publication_id: publicationId
    });
  },

  // Track VR tour start
  startVrTour: (publicationId, vrTourId, vrTourTitle) => {
    trackEvent('start_vr_tour', {
      publication_id: publicationId,
      vr_tour_id: vrTourId,
      vr_tour_title: vrTourTitle
    });
  },

  // Track virtual staging view
  viewVirtualStaging: (publicationId, stagingId, stagingTitle) => {
    trackEvent('view_virtual_staging', {
      publication_id: publicationId,
      staging_id: stagingId,
      staging_title: stagingTitle
    });
  },

  // Track share button click
  shareProperty: (publicationId, platform) => {
    trackEvent('share', {
      method: platform,
      content_type: 'property',
      item_id: publicationId
    });
  },

  // Track inquiry form start (when user focuses on first field)
  startInquiry: (publicationId) => {
    trackEvent('begin_checkout', { // Using ecommerce event for funnel tracking
      publication_id: publicationId,
      step: 'form_start'
    });
  },

  // Track inquiry form submission
  submitInquiry: (publicationId, source) => {
    trackEvent('generate_lead', {
      publication_id: publicationId,
      lead_source: source
    });
  },

  // Track QR code view
  viewQrCode: (publicationId) => {
    trackEvent('view_qr_code', {
      publication_id: publicationId
    });
  },

  // Track URL copy
  copyUrl: (publicationId) => {
    trackEvent('copy_url', {
      publication_id: publicationId
    });
  },

  // Track print action
  printProperty: (publicationId) => {
    trackEvent('print_property', {
      publication_id: publicationId
    });
  }
};

/**
 * User behavior tracking
 */
export const UserAnalytics = {
  // Track scroll depth
  trackScrollDepth: (depth) => {
    trackEvent('scroll', {
      percent_scrolled: depth
    });
  },

  // Track time on page
  trackTimeOnPage: (seconds) => {
    trackEvent('timing_complete', {
      name: 'time_on_page',
      value: seconds
    });
  }
};

/**
 * Conversion Funnel Tracking
 * Tracks user progress through the property viewing funnel:
 * 1. Page View -> 2. Scroll 50% -> 3. Photo/Gallery View -> 4. Inquiry Start -> 5. Inquiry Submit
 */
export const FunnelAnalytics = {
  // Funnel step names for consistency
  STEPS: {
    PAGE_VIEW: 'funnel_page_view',
    SCROLL_50: 'funnel_scroll_50',
    SCROLL_100: 'funnel_scroll_100',
    GALLERY_VIEW: 'funnel_gallery_view',
    INQUIRY_START: 'funnel_inquiry_start',
    INQUIRY_SUBMIT: 'funnel_inquiry_submit'
  },

  // Track funnel step
  trackStep: (step, publicationId, additionalParams = {}) => {
    trackEvent(step, {
      publication_id: publicationId,
      funnel_step: step,
      ...additionalParams
    });
  },

  // Create scroll observer for a property page
  createScrollObserver: (publicationId) => {
    const scrollMilestones = { 50: false, 100: false };

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      if (scrollPercent >= 50 && !scrollMilestones[50]) {
        scrollMilestones[50] = true;
        FunnelAnalytics.trackStep(FunnelAnalytics.STEPS.SCROLL_50, publicationId, {
          scroll_percent: 50
        });
      }

      if (scrollPercent >= 100 && !scrollMilestones[100]) {
        scrollMilestones[100] = true;
        FunnelAnalytics.trackStep(FunnelAnalytics.STEPS.SCROLL_100, publicationId, {
          scroll_percent: 100
        });
      }
    };

    // Debounce scroll handler
    let scrollTimeout;
    const debouncedScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 100);
    };

    window.addEventListener('scroll', debouncedScroll, { passive: true });

    // Return cleanup function
    return () => {
      window.removeEventListener('scroll', debouncedScroll);
      clearTimeout(scrollTimeout);
    };
  },

  // Track page view as first funnel step
  trackPageView: (publicationId, templateType) => {
    FunnelAnalytics.trackStep(FunnelAnalytics.STEPS.PAGE_VIEW, publicationId, {
      template_type: templateType
    });
  },

  // Track gallery view (when user opens photo gallery or clicks on photos)
  trackGalleryView: (publicationId) => {
    FunnelAnalytics.trackStep(FunnelAnalytics.STEPS.GALLERY_VIEW, publicationId);
  },

  // Track inquiry start
  trackInquiryStart: (publicationId) => {
    FunnelAnalytics.trackStep(FunnelAnalytics.STEPS.INQUIRY_START, publicationId);
  },

  // Track inquiry submit
  trackInquirySubmit: (publicationId, source) => {
    FunnelAnalytics.trackStep(FunnelAnalytics.STEPS.INQUIRY_SUBMIT, publicationId, {
      lead_source: source
    });
  }
};

export default {
  initializeGA,
  trackPageView,
  trackEvent,
  PropertyAnalytics,
  UserAnalytics,
  FunnelAnalytics
};
