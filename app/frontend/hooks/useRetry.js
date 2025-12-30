import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook for retry logic with exponential backoff
 * @param {Function} asyncFn - Async function to retry
 * @param {object} options - Retry options
 * @returns {object} { execute, data, error, isLoading, retryCount, reset }
 */
export function useRetry(asyncFn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = () => true, // Function to determine if retry should happen
    onRetry = () => {},
    onSuccess = () => {},
    onError = () => {}
  } = options;

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const calculateDelay = useCallback(
    (attempt) => {
      const delay = initialDelay * Math.pow(backoffFactor, attempt);
      // Add jitter (random variance up to 20%)
      const jitter = delay * 0.2 * Math.random();
      return Math.min(delay + jitter, maxDelay);
    },
    [initialDelay, backoffFactor, maxDelay]
  );

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const execute = useCallback(
    async (...args) => {
      // Cancel any pending request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);
      setRetryCount(0);

      let lastError = null;
      let attempt = 0;

      while (attempt <= maxRetries) {
        try {
          const result = await asyncFn(...args, {
            signal: abortControllerRef.current.signal
          });

          if (!isMountedRef.current) return;

          setData(result);
          setIsLoading(false);
          onSuccess(result);
          return result;
        } catch (err) {
          lastError = err;

          // Don't retry if aborted
          if (err.name === 'AbortError') {
            if (isMountedRef.current) {
              setIsLoading(false);
            }
            return;
          }

          // Check if we should retry
          const shouldRetry =
            attempt < maxRetries &&
            retryCondition(err, attempt) &&
            isMountedRef.current;

          if (shouldRetry) {
            const delay = calculateDelay(attempt);
            onRetry(err, attempt + 1, delay);

            if (isMountedRef.current) {
              setRetryCount(attempt + 1);
            }

            await sleep(delay);
            attempt++;
          } else {
            break;
          }
        }
      }

      // All retries failed
      if (isMountedRef.current) {
        setError(lastError);
        setIsLoading(false);
        onError(lastError);
      }

      throw lastError;
    },
    [asyncFn, maxRetries, calculateDelay, retryCondition, onRetry, onSuccess, onError]
  );

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setData(null);
    setError(null);
    setIsLoading(false);
    setRetryCount(0);
  }, []);

  const retry = useCallback(
    (...args) => {
      return execute(...args);
    },
    [execute]
  );

  return {
    execute,
    retry,
    data,
    error,
    isLoading,
    retryCount,
    reset
  };
}

/**
 * Hook for online/offline status detection
 * @returns {object} { isOnline, wasOffline }
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (!isOnline) {
        setWasOffline(true);
        // Reset wasOffline after 5 seconds
        setTimeout(() => setWasOffline(false), 5000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  return { isOnline, wasOffline };
}

/**
 * Determines if an error is retryable
 * @param {Error} error - The error to check
 * @returns {boolean} Whether the error is retryable
 */
export function isRetryableError(error) {
  // Network errors
  if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
    return true;
  }

  // Axios errors with specific status codes
  if (error.response) {
    const status = error.response.status;
    // Retry on server errors (500+) and rate limiting (429)
    // Don't retry on client errors (4xx) except 429
    return status >= 500 || status === 429 || status === 408;
  }

  // Fetch API errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }

  return false;
}

/**
 * Hook for fetch with automatic retry
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch and retry options
 * @returns {object} { data, error, isLoading, refetch }
 */
export function useFetchWithRetry(url, options = {}) {
  const { fetchOptions = {}, retryOptions = {}, immediate = true } = options;

  const fetchFn = useCallback(
    async (_, opts = {}) => {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: opts.signal
      });

      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.response = { status: response.status };
        throw error;
      }

      return response.json();
    },
    [url, fetchOptions]
  );

  const { execute, data, error, isLoading, retryCount, reset } = useRetry(fetchFn, {
    retryCondition: isRetryableError,
    ...retryOptions
  });

  useEffect(() => {
    if (immediate && url) {
      execute();
    }
  }, [url, immediate, execute]);

  return {
    data,
    error,
    isLoading,
    retryCount,
    refetch: execute,
    reset
  };
}

export default {
  useRetry,
  useOnlineStatus,
  isRetryableError,
  useFetchWithRetry
};
