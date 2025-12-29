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

export default {
  initializeGA,
  trackPageView,
  trackEvent,
  PropertyAnalytics,
  UserAnalytics
};
