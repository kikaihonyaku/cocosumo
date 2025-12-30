/**
 * useApi Hook
 * React hook for API calls with caching, loading states, and error handling
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { api, getErrorMessage, clearCache } from '../services/api';

/**
 * Main API hook
 * @param {string} url - API endpoint URL
 * @param {object} options - Hook options
 * @returns {object} API state and methods
 */
export function useApi(url, options = {}) {
  const {
    method = 'GET',
    params = null,
    body = null,
    immediate = true,
    cache = method === 'GET',
    cacheTime,
    onSuccess,
    onError,
    transform,
    initialData = null
  } = options;

  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(immediate);
  const [isValidating, setIsValidating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const mountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  // Execute API call
  const execute = useCallback(async (overrideOptions = {}) => {
    // Cancel previous request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const requestOptions = {
      method: overrideOptions.method || method,
      params: overrideOptions.params || params,
      data: overrideOptions.body || body,
      cache,
      cacheTime,
      signal: abortControllerRef.current.signal
    };

    // Set loading state
    if (data) {
      setIsValidating(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await api.get(url, requestOptions);

      if (!mountedRef.current) return;

      // Transform data if transformer provided
      const resultData = transform ? transform(response.data) : response.data;

      setData(resultData);
      setLastUpdated(Date.now());
      setError(null);

      onSuccess?.(resultData, response.fromCache);

      return { success: true, data: resultData };
    } catch (err) {
      if (!mountedRef.current) return;

      // Don't set error for aborted requests
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return { success: false, aborted: true };
      }

      const errorMessage = getErrorMessage(err);
      setError(errorMessage);

      onError?.(err, errorMessage);

      return { success: false, error: err, message: errorMessage };
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsValidating(false);
      }
    }
  }, [url, method, params, body, cache, cacheTime, data, transform, onSuccess, onError]);

  // Initial fetch
  useEffect(() => {
    if (immediate && url) {
      execute();
    }
  }, [url, immediate]); // Don't include execute to prevent loops

  // Refetch function
  const refetch = useCallback((options = {}) => {
    return execute(options);
  }, [execute]);

  // Mutate function (update local data without refetching)
  const mutate = useCallback((newData, revalidate = false) => {
    if (typeof newData === 'function') {
      setData((prev) => newData(prev));
    } else {
      setData(newData);
    }

    if (revalidate) {
      execute();
    }
  }, [execute]);

  // Reset to initial state
  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setIsLoading(false);
    setIsValidating(false);
    setLastUpdated(null);
  }, [initialData]);

  return {
    data,
    error,
    isLoading,
    isValidating,
    lastUpdated,
    execute,
    refetch,
    mutate,
    reset,
    isError: !!error,
    isSuccess: !!data && !error
  };
}

/**
 * Lazy API hook (doesn't fetch on mount)
 */
export function useLazyApi(url, options = {}) {
  return useApi(url, { ...options, immediate: false });
}

/**
 * Mutation hook (for POST/PUT/DELETE)
 */
export function useMutation(url, options = {}) {
  const {
    method = 'POST',
    onSuccess,
    onError,
    invalidateUrls = []
  } = options;

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const mutate = useCallback(async (body, overrideOptions = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      let response;

      switch (overrideOptions.method || method) {
        case 'POST':
          response = await api.post(url, body);
          break;
        case 'PUT':
          response = await api.put(url, body);
          break;
        case 'PATCH':
          response = await api.patch(url, body);
          break;
        case 'DELETE':
          response = await api.delete(url);
          break;
        default:
          response = await api.post(url, body);
      }

      setData(response.data);

      // Invalidate related caches
      invalidateUrls.forEach((pattern) => {
        clearCache(pattern);
      });

      onSuccess?.(response.data);

      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);

      onError?.(err, errorMessage);

      return { success: false, error: err, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [url, method, invalidateUrls, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    mutate,
    data,
    error,
    isLoading,
    reset,
    isError: !!error,
    isSuccess: !!data && !error
  };
}

/**
 * Infinite scroll / pagination hook
 */
export function useInfiniteApi(url, options = {}) {
  const {
    pageParam = 'page',
    limitParam = 'limit',
    limit = 20,
    getNextPageParam,
    transform,
    onSuccess,
    onError
  } = options;

  const [pages, setPages] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Flatten all pages data
  const data = useMemo(() => {
    return pages.flatMap((page) => page.data || page);
  }, [pages]);

  // Fetch page
  const fetchPage = useCallback(async (page) => {
    const isFirstPage = page === 1;

    if (isFirstPage) {
      setIsLoading(true);
    } else {
      setIsFetchingNextPage(true);
    }
    setError(null);

    try {
      const response = await api.get(url, {
        params: {
          [pageParam]: page,
          [limitParam]: limit
        },
        cache: false
      });

      if (!mountedRef.current) return;

      const pageData = transform ? transform(response.data) : response.data;

      setPages((prev) => {
        if (isFirstPage) {
          return [pageData];
        }
        return [...prev, pageData];
      });

      // Determine if there's a next page
      const nextPage = getNextPageParam
        ? getNextPageParam(pageData, page)
        : (Array.isArray(pageData) ? pageData.length >= limit : pageData.data?.length >= limit);

      setHasNextPage(!!nextPage);
      setCurrentPage(page);

      onSuccess?.(pageData, page);

      return { success: true, data: pageData };
    } catch (err) {
      if (!mountedRef.current) return;

      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      onError?.(err, errorMessage);

      return { success: false, error: err, message: errorMessage };
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsFetchingNextPage(false);
      }
    }
  }, [url, pageParam, limitParam, limit, transform, getNextPageParam, onSuccess, onError]);

  // Initial fetch
  useEffect(() => {
    fetchPage(1);
  }, [url]); // Don't include fetchPage

  // Fetch next page
  const fetchNextPage = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    return fetchPage(currentPage + 1);
  }, [fetchPage, currentPage, hasNextPage, isFetchingNextPage]);

  // Refresh (reset to page 1)
  const refresh = useCallback(() => {
    setPages([]);
    setCurrentPage(1);
    setHasNextPage(true);
    return fetchPage(1);
  }, [fetchPage]);

  return {
    data,
    pages,
    error,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    currentPage,
    fetchNextPage,
    refresh,
    isError: !!error
  };
}

/**
 * Polling hook
 */
export function usePolling(url, interval = 5000, options = {}) {
  const { enabled = true, ...apiOptions } = options;
  const { data, error, isLoading, refetch } = useApi(url, apiOptions);

  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      refetch();
    }, interval);

    return () => clearInterval(timer);
  }, [enabled, interval, refetch]);

  return { data, error, isLoading, refetch };
}

export default {
  useApi,
  useLazyApi,
  useMutation,
  useInfiniteApi,
  usePolling
};
