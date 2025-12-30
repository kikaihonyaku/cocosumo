/**
 * Security Logger
 * Production-safe logging with sensitive data redaction
 */

// Environment check
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// Log levels
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

// Current log level (configurable)
let currentLogLevel = IS_PRODUCTION ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

// Sensitive field patterns to redact
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /api_key/i,
  /apikey/i,
  /authorization/i,
  /bearer/i,
  /credit_card/i,
  /card_number/i,
  /cvv/i,
  /ssn/i,
  /social_security/i,
  /private_key/i
];

// Stack trace limit
const STACK_TRACE_LIMIT = 5;

/**
 * Set log level
 * @param {number} level - Log level from LOG_LEVELS
 */
export function setLogLevel(level) {
  currentLogLevel = level;
}

/**
 * Get current log level
 * @returns {number} Current log level
 */
export function getLogLevel() {
  return currentLogLevel;
}

/**
 * Check if key is sensitive
 * @param {string} key - Key to check
 * @returns {boolean} True if sensitive
 */
function isSensitiveKey(key) {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Redact sensitive data from object
 * @param {any} data - Data to redact
 * @param {number} depth - Current recursion depth
 * @returns {any} Redacted data
 */
function redactSensitiveData(data, depth = 0) {
  if (depth > 10) return '[max depth]';

  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Redact email-like patterns
    if (data.includes('@')) {
      return data.replace(/([^@\s]+)@([^@\s]+)/g, '***@$2');
    }
    // Redact phone numbers
    if (/^\d{10,}$/.test(data.replace(/\D/g, ''))) {
      return data.slice(0, 3) + '****' + data.slice(-3);
    }
    return data;
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item, depth + 1));
  }

  if (typeof data === 'object') {
    const result = {};
    Object.keys(data).forEach((key) => {
      if (isSensitiveKey(key)) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redactSensitiveData(data[key], depth + 1);
      }
    });
    return result;
  }

  return '[unknown type]';
}

/**
 * Format stack trace for logging
 * @param {Error} error - Error object
 * @returns {string[]} Formatted stack lines
 */
function formatStackTrace(error) {
  if (!error?.stack) return [];

  const lines = error.stack.split('\n').slice(1, STACK_TRACE_LIMIT + 1);
  return lines.map((line) => line.trim());
}

/**
 * Create log entry
 * @param {string} level - Log level name
 * @param {string} message - Log message
 * @param {object} data - Additional data
 * @returns {object} Log entry
 */
function createLogEntry(level, message, data = {}) {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    data: redactSensitiveData(data),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
  };
}

/**
 * Send log to remote logging service
 * @param {object} entry - Log entry
 */
function sendToRemote(entry) {
  // In production, send critical logs to server
  if (IS_PRODUCTION && (entry.level === 'ERROR' || entry.level === 'WARN')) {
    try {
      // Use sendBeacon for reliable delivery
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/v1/logs', JSON.stringify(entry));
      } else {
        fetch('/api/v1/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
          keepalive: true
        }).catch(() => {
          // Silently fail
        });
      }
    } catch {
      // Silently fail
    }
  }
}

/**
 * Debug level log (development only)
 * @param {string} message - Log message
 * @param {object} data - Additional data
 */
export function debug(message, data = {}) {
  if (currentLogLevel > LOG_LEVELS.DEBUG) return;

  if (IS_DEVELOPMENT) {
    console.debug(`[DEBUG] ${message}`, data);
  }
}

/**
 * Info level log
 * @param {string} message - Log message
 * @param {object} data - Additional data
 */
export function info(message, data = {}) {
  if (currentLogLevel > LOG_LEVELS.INFO) return;

  const entry = createLogEntry('INFO', message, data);

  if (IS_DEVELOPMENT) {
    console.info(`[INFO] ${message}`, entry.data);
  }
}

/**
 * Warning level log
 * @param {string} message - Log message
 * @param {object} data - Additional data
 */
export function warn(message, data = {}) {
  if (currentLogLevel > LOG_LEVELS.WARN) return;

  const entry = createLogEntry('WARN', message, data);

  if (IS_DEVELOPMENT) {
    console.warn(`[WARN] ${message}`, entry.data);
  }

  sendToRemote(entry);
}

/**
 * Error level log
 * @param {string} message - Log message
 * @param {Error|object} error - Error object or additional data
 */
export function error(message, error = {}) {
  if (currentLogLevel > LOG_LEVELS.ERROR) return;

  const data = error instanceof Error
    ? {
        errorMessage: error.message,
        errorName: error.name,
        stack: formatStackTrace(error)
      }
    : error;

  const entry = createLogEntry('ERROR', message, data);

  if (IS_DEVELOPMENT) {
    console.error(`[ERROR] ${message}`, entry.data);
  }

  sendToRemote(entry);
}

/**
 * Log security event
 * @param {string} eventType - Type of security event
 * @param {object} details - Event details
 */
export function securityEvent(eventType, details = {}) {
  const entry = createLogEntry('SECURITY', eventType, {
    ...details,
    eventType
  });

  if (IS_DEVELOPMENT) {
    console.warn(`[SECURITY] ${eventType}`, entry.data);
  }

  // Always send security events to remote in production
  if (IS_PRODUCTION) {
    sendToRemote(entry);
  }
}

/**
 * Log API request (with redaction)
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {object} options - Request options
 */
export function logApiRequest(method, url, options = {}) {
  debug(`API Request: ${method} ${url}`, {
    method,
    url,
    headers: redactSensitiveData(options.headers || {}),
    bodySize: options.body ? JSON.stringify(options.body).length : 0
  });
}

/**
 * Log API response
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {number} status - Response status
 * @param {number} duration - Request duration in ms
 */
export function logApiResponse(method, url, status, duration) {
  const level = status >= 400 ? 'warn' : 'debug';
  const logger = level === 'warn' ? warn : debug;

  logger(`API Response: ${method} ${url}`, {
    status,
    duration: `${duration}ms`,
    url
  });
}

/**
 * Create a scoped logger
 * @param {string} scope - Logger scope/module name
 * @returns {object} Scoped logger
 */
export function createLogger(scope) {
  return {
    debug: (message, data) => debug(`[${scope}] ${message}`, data),
    info: (message, data) => info(`[${scope}] ${message}`, data),
    warn: (message, data) => warn(`[${scope}] ${message}`, data),
    error: (message, err) => error(`[${scope}] ${message}`, err),
    security: (eventType, details) => securityEvent(`[${scope}] ${eventType}`, details)
  };
}

/**
 * Wrap console methods in production
 * Call this once at app initialization
 */
export function wrapConsoleMethods() {
  if (!IS_PRODUCTION) return;

  const noop = () => {};

  // In production, disable console.log and console.debug
  console.log = noop;
  console.debug = noop;

  // Keep console.warn and console.error but redact sensitive data
  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = (...args) => {
    originalWarn.apply(console, args.map((arg) =>
      typeof arg === 'object' ? redactSensitiveData(arg) : arg
    ));
  };

  console.error = (...args) => {
    originalError.apply(console, args.map((arg) =>
      typeof arg === 'object' ? redactSensitiveData(arg) : arg
    ));
  };
}

/**
 * Performance logging helper
 * @param {string} operationName - Name of the operation
 * @returns {Function} End function to log duration
 */
export function startPerformanceLog(operationName) {
  const start = performance.now();

  return (additionalData = {}) => {
    const duration = performance.now() - start;
    debug(`Performance: ${operationName}`, {
      duration: `${duration.toFixed(2)}ms`,
      ...additionalData
    });
  };
}

export default {
  LOG_LEVELS,
  setLogLevel,
  getLogLevel,
  debug,
  info,
  warn,
  error,
  securityEvent,
  logApiRequest,
  logApiResponse,
  createLogger,
  wrapConsoleMethods,
  startPerformanceLog
};
