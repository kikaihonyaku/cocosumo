/**
 * Debounce and Throttle Hooks
 * Performance optimization utilities for handling frequent updates
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Debounce a value - delays updating until after wait milliseconds of inactivity
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} Debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounce a callback function
 * @param {Function} callback - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {Array} deps - Dependencies for useCallback
 * @returns {Function} Debounced function
 */
export function useDebouncedCallback(callback, delay = 300, deps = []) {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay, ...deps]);
}

/**
 * Throttle a callback function - executes at most once per wait period
 * @param {Function} callback - Function to throttle
 * @param {number} limit - Minimum time between calls in milliseconds
 * @param {Array} deps - Dependencies for useCallback
 * @returns {Function} Throttled function
 */
export function useThrottledCallback(callback, limit = 300, deps = []) {
  const lastRunRef = useRef(0);
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args) => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRunRef.current;

    if (timeSinceLastRun >= limit) {
      lastRunRef.current = now;
      callbackRef.current(...args);
    } else {
      // Schedule a trailing call
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        lastRunRef.current = Date.now();
        callbackRef.current(...args);
      }, limit - timeSinceLastRun);
    }
  }, [limit, ...deps]);
}

/**
 * Throttle a value
 * @param {any} value - Value to throttle
 * @param {number} limit - Minimum time between updates in milliseconds
 * @returns {any} Throttled value
 */
export function useThrottle(value, limit = 300) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRunRef = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRunRef.current;

    if (timeSinceLastRun >= limit) {
      lastRunRef.current = now;
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastRunRef.current = Date.now();
        setThrottledValue(value);
      }, limit - timeSinceLastRun);

      return () => clearTimeout(timer);
    }
  }, [value, limit]);

  return throttledValue;
}

/**
 * Debounced search hook with loading state
 * @param {Function} searchFn - Async search function
 * @param {number} delay - Debounce delay
 * @returns {object} { search, results, isLoading, error }
 */
export function useDebouncedSearch(searchFn, delay = 300) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const debouncedQuery = useDebounce(query, delay);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    let cancelled = false;

    const performSearch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await searchFn(debouncedQuery);
        if (!cancelled) {
          setResults(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    performSearch();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, searchFn]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    debouncedQuery
  };
}

/**
 * Window resize handler with debounce
 * @param {number} delay - Debounce delay
 * @returns {object} { width, height }
 */
export function useWindowSize(delay = 100) {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  const handleResize = useDebouncedCallback(() => {
    setSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }, delay);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return size;
}

/**
 * Scroll position handler with throttle
 * @param {number} limit - Throttle limit
 * @returns {object} { scrollX, scrollY, scrollDirection }
 */
export function useScrollPosition(limit = 100) {
  const [scrollPosition, setScrollPosition] = useState({
    scrollX: typeof window !== 'undefined' ? window.scrollX : 0,
    scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
    scrollDirection: 'none'
  });

  const lastScrollY = useRef(0);

  const handleScroll = useThrottledCallback(() => {
    const currentScrollY = window.scrollY;
    const direction = currentScrollY > lastScrollY.current ? 'down' : 'up';
    lastScrollY.current = currentScrollY;

    setScrollPosition({
      scrollX: window.scrollX,
      scrollY: currentScrollY,
      scrollDirection: direction
    });
  }, limit);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return scrollPosition;
}

export default {
  useDebounce,
  useDebouncedCallback,
  useThrottledCallback,
  useThrottle,
  useDebouncedSearch,
  useWindowSize,
  useScrollPosition
};
