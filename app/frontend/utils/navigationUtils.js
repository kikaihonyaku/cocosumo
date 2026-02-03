/**
 * Navigation Utilities
 * Helper functions for navigation and URL management
 */
import { getZoomFactor } from './zoomUtils';

/**
 * Build URL with query parameters
 */
export function buildUrl(baseUrl, params = {}) {
  const url = new URL(baseUrl, window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, v));
      } else if (typeof value === 'object') {
        url.searchParams.set(key, JSON.stringify(value));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  });

  return url.toString();
}

/**
 * Parse URL query parameters
 */
export function parseQueryParams(url = window.location.href) {
  const searchParams = new URL(url, window.location.origin).searchParams;
  const params = {};

  searchParams.forEach((value, key) => {
    // Try to parse JSON values
    try {
      params[key] = JSON.parse(value);
    } catch {
      // Handle multiple values for same key
      if (params[key] !== undefined) {
        if (Array.isArray(params[key])) {
          params[key].push(value);
        } else {
          params[key] = [params[key], value];
        }
      } else {
        params[key] = value;
      }
    }
  });

  return params;
}

/**
 * Get single query parameter
 */
export function getQueryParam(key, defaultValue = null, url = window.location.href) {
  const params = parseQueryParams(url);
  return params[key] ?? defaultValue;
}

/**
 * Update query parameters without navigation
 */
export function updateQueryParams(updates, options = {}) {
  const { replace = false, push = true } = options;

  const currentParams = replace
    ? {}
    : parseQueryParams();

  const newParams = { ...currentParams, ...updates };

  // Remove null/undefined values
  Object.keys(newParams).forEach((key) => {
    if (newParams[key] === null || newParams[key] === undefined || newParams[key] === '') {
      delete newParams[key];
    }
  });

  const newUrl = buildUrl(window.location.pathname, newParams);

  if (push) {
    window.history.pushState(null, '', newUrl);
  } else {
    window.history.replaceState(null, '', newUrl);
  }

  return newParams;
}

/**
 * Remove query parameters
 */
export function removeQueryParams(keys, push = true) {
  const currentParams = parseQueryParams();

  keys.forEach((key) => {
    delete currentParams[key];
  });

  const newUrl = buildUrl(window.location.pathname, currentParams);

  if (push) {
    window.history.pushState(null, '', newUrl);
  } else {
    window.history.replaceState(null, '', newUrl);
  }

  return currentParams;
}

/**
 * Clear all query parameters
 */
export function clearQueryParams(push = true) {
  if (push) {
    window.history.pushState(null, '', window.location.pathname);
  } else {
    window.history.replaceState(null, '', window.location.pathname);
  }
}

/**
 * Get hash from URL
 */
export function getHash(url = window.location.href) {
  return new URL(url, window.location.origin).hash.slice(1);
}

/**
 * Set hash
 */
export function setHash(hash) {
  window.location.hash = hash;
}

/**
 * Remove hash
 */
export function removeHash(push = true) {
  const newUrl = window.location.pathname + window.location.search;

  if (push) {
    window.history.pushState(null, '', newUrl);
  } else {
    window.history.replaceState(null, '', newUrl);
  }
}

/**
 * Check if URL is internal
 */
export function isInternalUrl(url) {
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.origin === window.location.origin;
  } catch {
    return true; // Relative URLs are internal
  }
}

/**
 * Check if URL is external
 */
export function isExternalUrl(url) {
  return !isInternalUrl(url);
}

/**
 * Get absolute URL from relative
 */
export function getAbsoluteUrl(url) {
  return new URL(url, window.location.origin).href;
}

/**
 * Get relative URL from absolute
 */
export function getRelativeUrl(url) {
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.pathname + urlObj.search + urlObj.hash;
  } catch {
    return url;
  }
}

/**
 * Navigate with data (using history state)
 */
export function navigateWithState(url, state = {}) {
  window.history.pushState(state, '', url);
  window.dispatchEvent(new PopStateEvent('popstate', { state }));
}

/**
 * Get current history state
 */
export function getHistoryState() {
  return window.history.state;
}

/**
 * Scroll to element by ID
 */
export function scrollToElement(elementId, options = {}) {
  const {
    behavior = 'smooth',
    block = 'start',
    inline = 'nearest',
    offset = 0
  } = options;

  const element = document.getElementById(elementId);

  if (element) {
    if (offset) {
      const y = element.getBoundingClientRect().top / getZoomFactor() + window.pageYOffset + offset;
      window.scrollTo({ top: y, behavior });
    } else {
      element.scrollIntoView({ behavior, block, inline });
    }
    return true;
  }

  return false;
}

/**
 * Scroll to top
 */
export function scrollToTop(behavior = 'smooth') {
  window.scrollTo({ top: 0, behavior });
}

/**
 * Scroll to bottom
 */
export function scrollToBottom(behavior = 'smooth') {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior
  });
}

/**
 * Open URL in new tab
 */
export function openInNewTab(url, features = '') {
  const newWindow = window.open(url, '_blank', features);

  // Security: prevent reverse tabnabbing
  if (newWindow) {
    newWindow.opener = null;
  }

  return newWindow;
}

/**
 * Download file from URL
 */
export function downloadFile(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || url.split('/').pop() || 'download';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Reload page
 */
export function reloadPage(force = false) {
  if (force) {
    window.location.reload();
  } else {
    window.location.href = window.location.href;
  }
}

/**
 * Go back in history
 */
export function goBack(fallbackUrl = '/') {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = fallbackUrl;
  }
}

/**
 * Go forward in history
 */
export function goForward() {
  window.history.forward();
}

/**
 * Navigate to URL
 */
export function navigateTo(url, options = {}) {
  const { replace = false, newTab = false } = options;

  if (newTab) {
    openInNewTab(url);
  } else if (replace) {
    window.location.replace(url);
  } else {
    window.location.href = url;
  }
}

/**
 * Create breadcrumb data from URL path
 */
export function createBreadcrumbs(path = window.location.pathname, labels = {}) {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs = [{ label: 'ホーム', path: '/' }];

  let currentPath = '';

  segments.forEach((segment) => {
    currentPath += `/${segment}`;
    const label = labels[segment] || labels[currentPath] || decodeURIComponent(segment);

    breadcrumbs.push({
      label,
      path: currentPath
    });
  });

  return breadcrumbs;
}

/**
 * Check if current URL matches pattern
 */
export function matchesPattern(pattern, url = window.location.pathname) {
  // Convert pattern to regex
  const regexPattern = pattern
    .replace(/\*/g, '.*')
    .replace(/\//g, '\\/')
    .replace(/:(\w+)/g, '([^/]+)');

  return new RegExp(`^${regexPattern}$`).test(url);
}

/**
 * Extract params from URL pattern
 */
export function extractParams(pattern, url = window.location.pathname) {
  const paramNames = [];
  const regexPattern = pattern
    .replace(/\//g, '\\/')
    .replace(/:(\w+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });

  const match = new RegExp(`^${regexPattern}$`).exec(url);

  if (!match) return null;

  const params = {};
  paramNames.forEach((name, index) => {
    params[name] = decodeURIComponent(match[index + 1]);
  });

  return params;
}

/**
 * Preserve scroll position for navigation
 */
export function preserveScrollPosition() {
  const scrollPositions = JSON.parse(
    sessionStorage.getItem('scroll_positions') || '{}'
  );

  scrollPositions[window.location.href] = {
    x: window.scrollX,
    y: window.scrollY
  };

  sessionStorage.setItem('scroll_positions', JSON.stringify(scrollPositions));
}

/**
 * Restore scroll position after navigation
 */
export function restoreScrollPosition(url = window.location.href) {
  const scrollPositions = JSON.parse(
    sessionStorage.getItem('scroll_positions') || '{}'
  );

  const position = scrollPositions[url];

  if (position) {
    setTimeout(() => {
      window.scrollTo(position.x, position.y);
    }, 0);
    return true;
  }

  return false;
}

export default {
  buildUrl,
  parseQueryParams,
  getQueryParam,
  updateQueryParams,
  removeQueryParams,
  clearQueryParams,
  getHash,
  setHash,
  removeHash,
  isInternalUrl,
  isExternalUrl,
  getAbsoluteUrl,
  getRelativeUrl,
  navigateWithState,
  getHistoryState,
  scrollToElement,
  scrollToTop,
  scrollToBottom,
  openInNewTab,
  downloadFile,
  reloadPage,
  goBack,
  goForward,
  navigateTo,
  createBreadcrumbs,
  matchesPattern,
  extractParams,
  preserveScrollPosition,
  restoreScrollPosition
};
