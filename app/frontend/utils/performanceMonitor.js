/**
 * Performance Monitor
 * Tracks Core Web Vitals and custom performance metrics
 */

// Performance thresholds (Google's recommendations)
const THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needsImprovement: 300 },   // First Input Delay
  CLS: { good: 0.1, needsImprovement: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
  INP: { good: 200, needsImprovement: 500 }    // Interaction to Next Paint
};

// Storage for collected metrics
const metricsStore = {
  webVitals: {},
  customMetrics: {},
  resourceTimings: [],
  longTasks: []
};

// Callbacks for metric updates
const listeners = new Set();

/**
 * Get rating for a metric value
 */
function getRating(metricName, value) {
  const threshold = THRESHOLDS[metricName];
  if (!threshold) return 'unknown';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Notify listeners of metric updates
 */
function notifyListeners(metric) {
  listeners.forEach(callback => {
    try {
      callback(metric);
    } catch (e) {
      console.error('Performance listener error:', e);
    }
  });
}

/**
 * Track Largest Contentful Paint (LCP)
 */
function trackLCP() {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      const metric = {
        name: 'LCP',
        value: lastEntry.startTime,
        rating: getRating('LCP', lastEntry.startTime),
        element: lastEntry.element?.tagName || 'unknown'
      };

      metricsStore.webVitals.LCP = metric;
      notifyListeners(metric);
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
    return observer;
  } catch (e) {
    // LCP not supported
  }
}

/**
 * Track First Input Delay (FID)
 */
function trackFID() {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstEntry = entries[0];

      const metric = {
        name: 'FID',
        value: firstEntry.processingStart - firstEntry.startTime,
        rating: getRating('FID', firstEntry.processingStart - firstEntry.startTime)
      };

      metricsStore.webVitals.FID = metric;
      notifyListeners(metric);
    });

    observer.observe({ type: 'first-input', buffered: true });
    return observer;
  } catch (e) {
    // FID not supported
  }
}

/**
 * Track Cumulative Layout Shift (CLS)
 */
function trackCLS() {
  if (!('PerformanceObserver' in window)) return;

  let clsValue = 0;
  let sessionValue = 0;
  let sessionEntries = [];

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          const firstSessionEntry = sessionEntries[0];
          const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

          if (
            sessionValue &&
            entry.startTime - lastSessionEntry.startTime < 1000 &&
            entry.startTime - firstSessionEntry.startTime < 5000
          ) {
            sessionValue += entry.value;
            sessionEntries.push(entry);
          } else {
            sessionValue = entry.value;
            sessionEntries = [entry];
          }

          if (sessionValue > clsValue) {
            clsValue = sessionValue;

            const metric = {
              name: 'CLS',
              value: clsValue,
              rating: getRating('CLS', clsValue)
            };

            metricsStore.webVitals.CLS = metric;
            notifyListeners(metric);
          }
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });
    return observer;
  } catch (e) {
    // CLS not supported
  }
}

/**
 * Track First Contentful Paint (FCP)
 */
function trackFCP() {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(e => e.name === 'first-contentful-paint');

      if (fcpEntry) {
        const metric = {
          name: 'FCP',
          value: fcpEntry.startTime,
          rating: getRating('FCP', fcpEntry.startTime)
        };

        metricsStore.webVitals.FCP = metric;
        notifyListeners(metric);
      }
    });

    observer.observe({ type: 'paint', buffered: true });
    return observer;
  } catch (e) {
    // Paint timing not supported
  }
}

/**
 * Track Time to First Byte (TTFB)
 */
function trackTTFB() {
  if (!('performance' in window)) return;

  try {
    const navigationEntry = performance.getEntriesByType('navigation')[0];
    if (navigationEntry) {
      const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;

      const metric = {
        name: 'TTFB',
        value: ttfb,
        rating: getRating('TTFB', ttfb)
      };

      metricsStore.webVitals.TTFB = metric;
      notifyListeners(metric);
    }
  } catch (e) {
    // Navigation timing not supported
  }
}

/**
 * Track Long Tasks (> 50ms)
 */
function trackLongTasks() {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const task = {
          duration: entry.duration,
          startTime: entry.startTime,
          attribution: entry.attribution?.[0]?.name || 'unknown'
        };

        metricsStore.longTasks.push(task);

        // Keep only last 100 long tasks
        if (metricsStore.longTasks.length > 100) {
          metricsStore.longTasks.shift();
        }

        notifyListeners({ name: 'long-task', ...task });
      }
    });

    observer.observe({ type: 'longtask', buffered: true });
    return observer;
  } catch (e) {
    // Long tasks not supported
  }
}

/**
 * Track resource loading times
 */
function trackResources() {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resource = {
          name: entry.name,
          type: entry.initiatorType,
          duration: entry.duration,
          size: entry.transferSize,
          startTime: entry.startTime
        };

        metricsStore.resourceTimings.push(resource);

        // Keep only last 200 resources
        if (metricsStore.resourceTimings.length > 200) {
          metricsStore.resourceTimings.shift();
        }
      }
    });

    observer.observe({ type: 'resource', buffered: true });
    return observer;
  } catch (e) {
    // Resource timing not supported
  }
}

/**
 * Initialize all performance monitoring
 */
export function initPerformanceMonitoring() {
  const observers = [];

  observers.push(trackLCP());
  observers.push(trackFID());
  observers.push(trackCLS());
  observers.push(trackFCP());
  observers.push(trackLongTasks());
  observers.push(trackResources());

  // TTFB can be measured immediately
  trackTTFB();

  return () => {
    observers.forEach(observer => observer?.disconnect());
  };
}

/**
 * Subscribe to metric updates
 */
export function subscribeToMetrics(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Get current metrics snapshot
 */
export function getMetrics() {
  return {
    webVitals: { ...metricsStore.webVitals },
    customMetrics: { ...metricsStore.customMetrics },
    longTasksCount: metricsStore.longTasks.length,
    avgLongTaskDuration: metricsStore.longTasks.length > 0
      ? metricsStore.longTasks.reduce((sum, t) => sum + t.duration, 0) / metricsStore.longTasks.length
      : 0,
    resourceCount: metricsStore.resourceTimings.length,
    totalResourceSize: metricsStore.resourceTimings.reduce((sum, r) => sum + (r.size || 0), 0)
  };
}

/**
 * Track custom metric
 */
export function trackCustomMetric(name, value, metadata = {}) {
  const metric = {
    name,
    value,
    timestamp: Date.now(),
    ...metadata
  };

  metricsStore.customMetrics[name] = metric;
  notifyListeners(metric);
}

/**
 * Measure function execution time
 */
export function measureExecutionTime(fn, metricName) {
  return async (...args) => {
    const start = performance.now();
    try {
      const result = await fn(...args);
      const duration = performance.now() - start;
      trackCustomMetric(metricName, duration, { success: true });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      trackCustomMetric(metricName, duration, { success: false, error: error.message });
      throw error;
    }
  };
}

/**
 * Create a performance mark
 */
export function mark(name) {
  if ('performance' in window) {
    performance.mark(name);
  }
}

/**
 * Measure between two marks
 */
export function measure(name, startMark, endMark) {
  if ('performance' in window) {
    try {
      performance.measure(name, startMark, endMark);
      const entries = performance.getEntriesByName(name, 'measure');
      const lastEntry = entries[entries.length - 1];

      if (lastEntry) {
        trackCustomMetric(name, lastEntry.duration);
      }
    } catch (e) {
      // Marks might not exist
    }
  }
}

/**
 * Get performance score (0-100)
 */
export function getPerformanceScore() {
  const metrics = getMetrics();
  let score = 100;
  let factors = 0;

  // LCP (25% weight)
  if (metrics.webVitals.LCP) {
    factors++;
    if (metrics.webVitals.LCP.rating === 'poor') score -= 25;
    else if (metrics.webVitals.LCP.rating === 'needs-improvement') score -= 12;
  }

  // FID (25% weight)
  if (metrics.webVitals.FID) {
    factors++;
    if (metrics.webVitals.FID.rating === 'poor') score -= 25;
    else if (metrics.webVitals.FID.rating === 'needs-improvement') score -= 12;
  }

  // CLS (25% weight)
  if (metrics.webVitals.CLS) {
    factors++;
    if (metrics.webVitals.CLS.rating === 'poor') score -= 25;
    else if (metrics.webVitals.CLS.rating === 'needs-improvement') score -= 12;
  }

  // Long tasks penalty
  if (metrics.longTasksCount > 10) score -= 10;
  else if (metrics.longTasksCount > 5) score -= 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Send metrics to analytics
 */
export function reportToAnalytics(analyticsCallback) {
  const metrics = getMetrics();

  // Report Web Vitals
  Object.values(metrics.webVitals).forEach(metric => {
    analyticsCallback('web_vital', {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_rating: metric.rating
    });
  });

  // Report performance score
  analyticsCallback('performance_score', {
    score: getPerformanceScore(),
    long_tasks: metrics.longTasksCount,
    resource_count: metrics.resourceCount
  });
}

export default {
  initPerformanceMonitoring,
  subscribeToMetrics,
  getMetrics,
  trackCustomMetric,
  measureExecutionTime,
  mark,
  measure,
  getPerformanceScore,
  reportToAnalytics
};
