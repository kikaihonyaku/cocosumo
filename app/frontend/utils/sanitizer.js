/**
 * Security Sanitizer
 * XSS prevention and input sanitization utilities
 */

// HTML entities for escaping
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

// Dangerous patterns
const DANGEROUS_PATTERNS = [
  /javascript:/gi,
  /vbscript:/gi,
  /data:/gi,
  /on\w+\s*=/gi,
  /<script/gi,
  /<\/script/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<form/gi,
  /expression\s*\(/gi,
  /url\s*\(/gi
];

// Allowed HTML tags for rich text
const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
  'span', 'div', 'table', 'tr', 'td', 'th', 'thead', 'tbody'
]);

// Allowed attributes
const ALLOWED_ATTRIBUTES = new Set([
  'href', 'title', 'class', 'id', 'target', 'rel'
]);

/**
 * Escape HTML entities in a string
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') {
    return String(str);
  }

  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Unescape HTML entities
 * @param {string} str - String to unescape
 * @returns {string} Unescaped string
 */
export function unescapeHtml(str) {
  if (typeof str !== 'string') return str;

  const element = document.createElement('textarea');
  element.innerHTML = str;
  return element.value;
}

/**
 * Remove dangerous patterns from string
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
export function removeDangerousPatterns(str) {
  if (typeof str !== 'string') return str;

  let result = str;
  DANGEROUS_PATTERNS.forEach((pattern) => {
    result = result.replace(pattern, '');
  });

  return result;
}

/**
 * Sanitize URL to prevent javascript: and data: URLs
 * @param {string} url - URL to sanitize
 * @returns {string|null} Sanitized URL or null if dangerous
 */
export function sanitizeUrl(url) {
  if (typeof url !== 'string') return null;

  const trimmedUrl = url.trim().toLowerCase();

  // Block dangerous protocols
  if (
    trimmedUrl.startsWith('javascript:') ||
    trimmedUrl.startsWith('vbscript:') ||
    trimmedUrl.startsWith('data:')
  ) {
    return null;
  }

  // Allow relative URLs and safe protocols
  if (
    trimmedUrl.startsWith('/') ||
    trimmedUrl.startsWith('#') ||
    trimmedUrl.startsWith('http://') ||
    trimmedUrl.startsWith('https://') ||
    trimmedUrl.startsWith('mailto:') ||
    trimmedUrl.startsWith('tel:')
  ) {
    return url;
  }

  // Prepend https:// for other URLs
  return `https://${url}`;
}

/**
 * Sanitize HTML content allowing only safe tags
 * @param {string} html - HTML string to sanitize
 * @param {object} options - Sanitization options
 * @returns {string} Sanitized HTML
 */
export function sanitizeHtml(html, options = {}) {
  if (typeof html !== 'string') return '';

  const {
    allowedTags = ALLOWED_TAGS,
    allowedAttributes = ALLOWED_ATTRIBUTES,
    allowLinks = true
  } = options;

  // Create a DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  function sanitizeNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();

      // Remove disallowed tags
      if (!allowedTags.has(tagName)) {
        // Keep text content but remove the tag
        const textContent = node.textContent;
        node.replaceWith(document.createTextNode(textContent));
        return;
      }

      // Remove disallowed attributes
      Array.from(node.attributes).forEach((attr) => {
        const attrName = attr.name.toLowerCase();

        if (!allowedAttributes.has(attrName)) {
          node.removeAttribute(attr.name);
          return;
        }

        // Special handling for href
        if (attrName === 'href') {
          const sanitizedUrl = sanitizeUrl(attr.value);
          if (sanitizedUrl === null) {
            node.removeAttribute(attr.name);
          } else {
            node.setAttribute(attr.name, sanitizedUrl);
          }

          // Add security attributes to links
          if (allowLinks && tagName === 'a') {
            node.setAttribute('rel', 'noopener noreferrer');
            if (node.getAttribute('target') === '_blank') {
              // Keep target="_blank" but ensure rel is set
            }
          }
        }

        // Remove event handlers
        if (attrName.startsWith('on')) {
          node.removeAttribute(attr.name);
        }
      });

      // Recursively sanitize children
      Array.from(node.childNodes).forEach(sanitizeNode);
    }
  }

  sanitizeNode(doc.body);

  return doc.body.innerHTML;
}

/**
 * Sanitize object for JSON serialization
 * @param {object} obj - Object to sanitize
 * @param {object} options - Sanitization options
 * @returns {object} Sanitized object
 */
export function sanitizeObject(obj, options = {}) {
  const { maxDepth = 10, maxStringLength = 10000, sensitiveKeys = [] } = options;

  function sanitize(value, depth = 0) {
    if (depth > maxDepth) {
      return '[max depth exceeded]';
    }

    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      const sanitized = escapeHtml(value);
      return sanitized.length > maxStringLength
        ? sanitized.substring(0, maxStringLength) + '...'
        : sanitized;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => sanitize(item, depth + 1));
    }

    if (typeof value === 'object') {
      const result = {};
      Object.keys(value).forEach((key) => {
        // Redact sensitive keys
        if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk.toLowerCase()))) {
          result[key] = '[REDACTED]';
        } else {
          result[key] = sanitize(value[key], depth + 1);
        }
      });
      return result;
    }

    return '[unsupported type]';
  }

  return sanitize(obj);
}

/**
 * Sanitize user input for database/API
 * @param {string} input - User input
 * @param {object} options - Sanitization options
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input, options = {}) {
  if (typeof input !== 'string') return '';

  const { trim = true, maxLength = 1000, allowNewlines = false } = options;

  let result = input;

  // Trim whitespace
  if (trim) {
    result = result.trim();
  }

  // Remove newlines if not allowed
  if (!allowNewlines) {
    result = result.replace(/[\r\n]/g, ' ');
  }

  // Remove null bytes
  result = result.replace(/\0/g, '');

  // Remove dangerous patterns
  result = removeDangerousPatterns(result);

  // Limit length
  if (result.length > maxLength) {
    result = result.substring(0, maxLength);
  }

  return result;
}

/**
 * Validate and sanitize email
 * @param {string} email - Email to validate
 * @returns {string|null} Sanitized email or null if invalid
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') return null;

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return null;
  }

  // Additional check for dangerous characters
  if (DANGEROUS_PATTERNS.some((p) => p.test(trimmed))) {
    return null;
  }

  return trimmed;
}

/**
 * Validate and sanitize phone number
 * @param {string} phone - Phone number to validate
 * @returns {string|null} Sanitized phone or null if invalid
 */
export function sanitizePhone(phone) {
  if (typeof phone !== 'string') return null;

  // Remove all non-digit characters except + and -
  const cleaned = phone.replace(/[^\d+\-]/g, '');

  // Check length (Japanese phone numbers)
  if (cleaned.replace(/\D/g, '').length < 10) {
    return null;
  }

  return cleaned;
}

/**
 * Create safe HTML from template
 * @param {string} template - Template string
 * @param {object} values - Values to insert
 * @returns {string} Safe HTML string
 */
export function safeTemplate(template, values) {
  let result = template;

  Object.keys(values).forEach((key) => {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    const value = escapeHtml(String(values[key] ?? ''));
    result = result.replace(placeholder, value);
  });

  return result;
}

/**
 * Check if content contains potential XSS
 * @param {string} content - Content to check
 * @returns {boolean} True if potentially dangerous
 */
export function containsXss(content) {
  if (typeof content !== 'string') return false;

  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(content));
}

export default {
  escapeHtml,
  unescapeHtml,
  removeDangerousPatterns,
  sanitizeUrl,
  sanitizeHtml,
  sanitizeObject,
  sanitizeInput,
  sanitizeEmail,
  sanitizePhone,
  safeTemplate,
  containsXss
};
