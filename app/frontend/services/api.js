/**
 * Unified API Service
 * Centralized API communication with caching, retry, and error handling
 */

import axios from 'axios';
import { logApiRequest, logApiResponse, error as logError } from '../utils/securityLogger';

// API Configuration
const API_CONFIG = {
  baseURL: '/api/v1',
  timeout: 30000,
  retryCount: 3,
  retryDelay: 1000,
  cacheTime: 5 * 60 * 1000 // 5 minutes default cache
};

// Cache storage
const cache = new Map();
const pendingRequests = new Map();

// Create axios instance
const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add CSRF token if available
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    // Log request
    logApiRequest(config.method?.toUpperCase(), config.url, config);

    // Add request timestamp for duration tracking
    config.metadata = { startTime: Date.now() };

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Log response
    const duration = Date.now() - (response.config.metadata?.startTime || 0);
    logApiResponse(
      response.config.method?.toUpperCase(),
      response.config.url,
      response.status,
      duration
    );

    return response;
  },
  (error) => {
    // Log error
    const duration = Date.now() - (error.config?.metadata?.startTime || 0);
    logApiResponse(
      error.config?.method?.toUpperCase(),
      error.config?.url,
      error.response?.status || 0,
      duration
    );

    // Handle specific error codes
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

/**
 * Generate cache key from request config
 */
function generateCacheKey(method, url, params) {
  return `${method}:${url}:${JSON.stringify(params || {})}`;
}

/**
 * Check if response is cacheable
 */
function isCacheable(method, status) {
  return method === 'GET' && status >= 200 && status < 300;
}

/**
 * Get from cache if valid
 */
function getFromCache(key) {
  const cached = cache.get(key);
  if (!cached) return null;

  if (Date.now() > cached.expiry) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

/**
 * Set cache entry
 */
function setCache(key, data, ttl = API_CONFIG.cacheTime) {
  cache.set(key, {
    data,
    expiry: Date.now() + ttl,
    timestamp: Date.now()
  });
}

/**
 * Clear cache
 */
export function clearCache(pattern = null) {
  if (!pattern) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

/**
 * Invalidate cache by URL pattern
 */
export function invalidateCache(urlPattern) {
  clearCache(urlPattern);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error) {
  if (!error.response) {
    // Network error
    return true;
  }

  const status = error.response.status;
  // Retry on 5xx errors or 429 (rate limit)
  return status >= 500 || status === 429 || status === 408;
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make API request with retry and caching
 */
async function request(config) {
  const {
    method = 'GET',
    url,
    data,
    params,
    cache: useCache = method === 'GET',
    cacheTime = API_CONFIG.cacheTime,
    retry = method === 'GET',
    retryCount = API_CONFIG.retryCount,
    retryDelay = API_CONFIG.retryDelay,
    dedupe = true,
    ...restConfig
  } = config;

  const cacheKey = generateCacheKey(method, url, params);

  // Check cache for GET requests
  if (useCache && method === 'GET') {
    const cached = getFromCache(cacheKey);
    if (cached) {
      return { data: cached, fromCache: true };
    }
  }

  // Deduplicate concurrent identical requests
  if (dedupe && pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  // Make request with retry logic
  const makeRequest = async (attempt = 0) => {
    try {
      const response = await apiClient({
        method,
        url,
        data,
        params,
        ...restConfig
      });

      // Cache successful GET responses
      if (useCache && isCacheable(method, response.status)) {
        setCache(cacheKey, response.data, cacheTime);
      }

      return { data: response.data, status: response.status, fromCache: false };
    } catch (error) {
      // Retry on retryable errors
      if (retry && attempt < retryCount && isRetryableError(error)) {
        const delay = retryDelay * Math.pow(2, attempt);
        await sleep(delay);
        return makeRequest(attempt + 1);
      }

      throw error;
    }
  };

  const requestPromise = makeRequest();

  // Store pending request for deduplication
  if (dedupe) {
    pendingRequests.set(cacheKey, requestPromise);
    requestPromise.finally(() => {
      pendingRequests.delete(cacheKey);
    });
  }

  return requestPromise;
}

/**
 * API methods
 */
export const api = {
  // GET request
  get: (url, options = {}) => request({ method: 'GET', url, ...options }),

  // POST request
  post: (url, data, options = {}) => request({ method: 'POST', url, data, cache: false, ...options }),

  // PUT request
  put: (url, data, options = {}) => request({ method: 'PUT', url, data, cache: false, ...options }),

  // PATCH request
  patch: (url, data, options = {}) => request({ method: 'PATCH', url, data, cache: false, ...options }),

  // DELETE request
  delete: (url, options = {}) => request({ method: 'DELETE', url, cache: false, ...options }),

  // Upload file
  upload: (url, formData, onProgress) => {
    return apiClient.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      }
    });
  }
};

/**
 * Resource-based API helpers
 */
export function createResourceApi(resourceName) {
  const basePath = `/${resourceName}`;

  return {
    list: (params) => api.get(basePath, { params }),
    get: (id) => api.get(`${basePath}/${id}`),
    create: (data) => api.post(basePath, data),
    update: (id, data) => api.patch(`${basePath}/${id}`, data),
    delete: (id) => api.delete(`${basePath}/${id}`),
    invalidateCache: () => invalidateCache(basePath)
  };
}

/**
 * Pre-defined resource APIs
 */
export const buildingsApi = createResourceApi('buildings');
export const roomsApi = createResourceApi('rooms');
export const propertiesApi = createResourceApi('property_publications');

/**
 * Error helper
 */
export function getErrorMessage(error) {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.errors) {
    const errors = error.response.data.errors;
    if (Array.isArray(errors)) {
      return errors.join(', ');
    }
    return Object.values(errors).flat().join(', ');
  }
  if (error.message) {
    return error.message;
  }
  return 'エラーが発生しました';
}

export default api;
