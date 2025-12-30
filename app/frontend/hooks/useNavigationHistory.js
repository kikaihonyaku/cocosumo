/**
 * Navigation History Hook
 * Manages browser history and navigation state
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/**
 * Navigation confirmation hook (prevent accidental navigation)
 */
export function useNavigationBlock(shouldBlock, message = '変更が保存されていません。ページを離れますか？') {
  const shouldBlockRef = useRef(shouldBlock);

  // Keep ref in sync
  useEffect(() => {
    shouldBlockRef.current = shouldBlock;
  }, [shouldBlock]);

  // Handle beforeunload (browser close/refresh)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (shouldBlockRef.current) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [message]);

  // Handle popstate (back/forward buttons)
  useEffect(() => {
    const handlePopState = (e) => {
      if (shouldBlockRef.current) {
        const confirmLeave = window.confirm(message);
        if (!confirmLeave) {
          // Push current state back to prevent navigation
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    // Push initial state
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => window.removeEventListener('popstate', handlePopState);
  }, [message]);
}

/**
 * Browser history stack hook
 */
export function useHistoryStack() {
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const historyRef = useRef([]);
  const currentIndexRef = useRef(-1);

  // Initialize history tracking
  useEffect(() => {
    const initialEntry = {
      url: window.location.href,
      title: document.title,
      timestamp: Date.now()
    };

    historyRef.current = [initialEntry];
    currentIndexRef.current = 0;
  }, []);

  // Track navigation
  useEffect(() => {
    const handlePopState = () => {
      // Update current index based on navigation direction
      // This is a simplified tracking
      setCanGoBack(window.history.length > 1);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigate back
  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    }
  }, []);

  // Navigate forward
  const goForward = useCallback(() => {
    window.history.forward();
  }, []);

  // Navigate to specific delta
  const go = useCallback((delta) => {
    window.history.go(delta);
  }, []);

  // Push new entry
  const push = useCallback((url, state = {}) => {
    window.history.pushState(state, '', url);

    const entry = {
      url,
      state,
      title: document.title,
      timestamp: Date.now()
    };

    currentIndexRef.current++;
    // Remove any forward history
    historyRef.current = historyRef.current.slice(0, currentIndexRef.current);
    historyRef.current.push(entry);

    setCanGoBack(true);
    setCanGoForward(false);
  }, []);

  // Replace current entry
  const replace = useCallback((url, state = {}) => {
    window.history.replaceState(state, '', url);

    if (currentIndexRef.current >= 0) {
      historyRef.current[currentIndexRef.current] = {
        url,
        state,
        title: document.title,
        timestamp: Date.now()
      };
    }
  }, []);

  return {
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    go,
    push,
    replace,
    history: historyRef.current,
    currentIndex: currentIndexRef.current
  };
}

/**
 * URL state management hook
 */
export function useUrlState(key, defaultValue) {
  // Get initial value from URL
  const getUrlValue = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get(key);

    if (value === null) return defaultValue;

    // Try to parse JSON
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }, [key, defaultValue]);

  const [state, setState] = useState(getUrlValue);

  // Sync with URL changes
  useEffect(() => {
    const handlePopState = () => {
      setState(getUrlValue());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [getUrlValue]);

  // Update state and URL
  const setUrlState = useCallback((newValue) => {
    const value = typeof newValue === 'function' ? newValue(state) : newValue;
    setState(value);

    const params = new URLSearchParams(window.location.search);

    if (value === defaultValue || value === null || value === undefined) {
      params.delete(key);
    } else {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      params.set(key, stringValue);
    }

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    window.history.replaceState(null, '', newUrl);
  }, [key, state, defaultValue]);

  return [state, setUrlState];
}

/**
 * Query params hook
 */
export function useQueryParams() {
  const [params, setParams] = useState(() => {
    return Object.fromEntries(new URLSearchParams(window.location.search));
  });

  // Sync with URL changes
  useEffect(() => {
    const handlePopState = () => {
      setParams(Object.fromEntries(new URLSearchParams(window.location.search)));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Get single param
  const getParam = useCallback((key, defaultValue = null) => {
    return params[key] ?? defaultValue;
  }, [params]);

  // Set single param
  const setParam = useCallback((key, value) => {
    const newParams = new URLSearchParams(window.location.search);

    if (value === null || value === undefined || value === '') {
      newParams.delete(key);
    } else {
      newParams.set(key, String(value));
    }

    const newUrl = newParams.toString()
      ? `${window.location.pathname}?${newParams.toString()}`
      : window.location.pathname;

    window.history.pushState(null, '', newUrl);
    setParams(Object.fromEntries(newParams));
  }, []);

  // Set multiple params
  const setMultipleParams = useCallback((updates, replace = false) => {
    const newParams = replace
      ? new URLSearchParams()
      : new URLSearchParams(window.location.search);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
    });

    const newUrl = newParams.toString()
      ? `${window.location.pathname}?${newParams.toString()}`
      : window.location.pathname;

    window.history.pushState(null, '', newUrl);
    setParams(Object.fromEntries(newParams));
  }, []);

  // Clear all params
  const clearParams = useCallback(() => {
    window.history.pushState(null, '', window.location.pathname);
    setParams({});
  }, []);

  return {
    params,
    getParam,
    setParam,
    setMultipleParams,
    clearParams,
    hasParams: Object.keys(params).length > 0
  };
}

/**
 * Hash navigation hook
 */
export function useHashNavigation() {
  const [hash, setHash] = useState(() => window.location.hash.slice(1));

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash.slice(1));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Navigate to hash
  const navigateToHash = useCallback((newHash) => {
    window.location.hash = newHash;
  }, []);

  // Clear hash
  const clearHash = useCallback(() => {
    window.history.pushState(
      null,
      '',
      window.location.pathname + window.location.search
    );
    setHash('');
  }, []);

  return {
    hash,
    navigateToHash,
    clearHash,
    hasHash: !!hash
  };
}

/**
 * Scroll restoration hook
 */
export function useScrollRestoration(key = 'scroll-position') {
  const scrollPositionsRef = useRef(new Map());

  // Save current scroll position
  const saveScrollPosition = useCallback((id = window.location.href) => {
    scrollPositionsRef.current.set(id, {
      x: window.scrollX,
      y: window.scrollY
    });

    // Also save to sessionStorage for page refresh
    try {
      const positions = JSON.parse(sessionStorage.getItem(key) || '{}');
      positions[id] = { x: window.scrollX, y: window.scrollY };
      sessionStorage.setItem(key, JSON.stringify(positions));
    } catch {
      // Ignore storage errors
    }
  }, [key]);

  // Restore scroll position
  const restoreScrollPosition = useCallback((id = window.location.href, behavior = 'auto') => {
    let position = scrollPositionsRef.current.get(id);

    // Try sessionStorage if not in memory
    if (!position) {
      try {
        const positions = JSON.parse(sessionStorage.getItem(key) || '{}');
        position = positions[id];
      } catch {
        // Ignore storage errors
      }
    }

    if (position) {
      window.scrollTo({
        left: position.x,
        top: position.y,
        behavior
      });
    }
  }, [key]);

  // Auto-save on navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveScrollPosition]);

  return {
    saveScrollPosition,
    restoreScrollPosition
  };
}

/**
 * Navigation timing hook
 */
export function useNavigationTiming() {
  const [timing, setTiming] = useState(null);

  useEffect(() => {
    const updateTiming = () => {
      const navigation = performance.getEntriesByType('navigation')[0];

      if (navigation) {
        setTiming({
          type: navigation.type,
          redirectCount: navigation.redirectCount,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
          loadComplete: navigation.loadEventEnd - navigation.startTime,
          dns: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcp: navigation.connectEnd - navigation.connectStart,
          request: navigation.responseStart - navigation.requestStart,
          response: navigation.responseEnd - navigation.responseStart,
          domProcessing: navigation.domComplete - navigation.domInteractive
        });
      }
    };

    // Wait for page to fully load
    if (document.readyState === 'complete') {
      updateTiming();
    } else {
      window.addEventListener('load', updateTiming);
      return () => window.removeEventListener('load', updateTiming);
    }
  }, []);

  return timing;
}

export default {
  useNavigationBlock,
  useHistoryStack,
  useUrlState,
  useQueryParams,
  useHashNavigation,
  useScrollRestoration,
  useNavigationTiming
};
