/**
 * Date Formatter
 * Locale-aware date and time formatting utilities
 */

// Default locale
const DEFAULT_LOCALE = 'ja-JP';

// Common date format presets
export const DATE_FORMATS = {
  // Date only
  SHORT: { year: 'numeric', month: '2-digit', day: '2-digit' },
  MEDIUM: { year: 'numeric', month: 'short', day: 'numeric' },
  LONG: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' },
  FULL: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },

  // Time only
  TIME_SHORT: { hour: '2-digit', minute: '2-digit' },
  TIME_MEDIUM: { hour: '2-digit', minute: '2-digit', second: '2-digit' },

  // Date and time
  DATETIME_SHORT: {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  },
  DATETIME_MEDIUM: {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  },
  DATETIME_LONG: {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  },

  // Japanese specific
  JP_DATE: { year: 'numeric', month: 'long', day: 'numeric' },
  JP_DATE_SHORT: { month: 'numeric', day: 'numeric' },
  JP_DATETIME: {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }
};

/**
 * Parse date from various formats
 */
export function parseDate(value) {
  if (!value) return null;

  // Already a Date object
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // Unix timestamp (seconds)
  if (typeof value === 'number') {
    // If less than year 3000 in seconds, assume seconds
    if (value < 32503680000) {
      return new Date(value * 1000);
    }
    return new Date(value);
  }

  // String parsing
  if (typeof value === 'string') {
    // ISO format
    const isoDate = new Date(value);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    // Japanese format: 2024年1月15日
    const jpMatch = value.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (jpMatch) {
      return new Date(parseInt(jpMatch[1]), parseInt(jpMatch[2]) - 1, parseInt(jpMatch[3]));
    }

    // Slash format: 2024/01/15
    const slashMatch = value.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
    if (slashMatch) {
      return new Date(parseInt(slashMatch[1]), parseInt(slashMatch[2]) - 1, parseInt(slashMatch[3]));
    }

    // Dash format: 2024-01-15
    const dashMatch = value.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (dashMatch) {
      return new Date(parseInt(dashMatch[1]), parseInt(dashMatch[2]) - 1, parseInt(dashMatch[3]));
    }
  }

  return null;
}

/**
 * Format date with Intl.DateTimeFormat
 */
export function formatDate(date, options = {}) {
  const parsedDate = parseDate(date);
  if (!parsedDate) return '';

  const {
    locale = DEFAULT_LOCALE,
    format = DATE_FORMATS.MEDIUM,
    ...restOptions
  } = options;

  const formatOptions = typeof format === 'string' ? DATE_FORMATS[format] || {} : format;

  try {
    return new Intl.DateTimeFormat(locale, { ...formatOptions, ...restOptions }).format(parsedDate);
  } catch {
    return parsedDate.toLocaleDateString(locale);
  }
}

/**
 * Format time only
 */
export function formatTime(date, options = {}) {
  return formatDate(date, {
    format: DATE_FORMATS.TIME_SHORT,
    ...options
  });
}

/**
 * Format date and time
 */
export function formatDateTime(date, options = {}) {
  return formatDate(date, {
    format: DATE_FORMATS.DATETIME_MEDIUM,
    ...options
  });
}

/**
 * Format as ISO string
 */
export function toISOString(date) {
  const parsedDate = parseDate(date);
  return parsedDate ? parsedDate.toISOString() : '';
}

/**
 * Format as ISO date (YYYY-MM-DD)
 */
export function toISODateString(date) {
  const parsedDate = parseDate(date);
  if (!parsedDate) return '';

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Format relative time (e.g., "3日前", "5分後")
 */
export function formatRelativeTime(date, options = {}) {
  const parsedDate = parseDate(date);
  if (!parsedDate) return '';

  const { locale = DEFAULT_LOCALE, style = 'long' } = options;

  const now = new Date();
  const diffMs = parsedDate.getTime() - now.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);
  const diffWeeks = Math.round(diffDays / 7);
  const diffMonths = Math.round(diffDays / 30);
  const diffYears = Math.round(diffDays / 365);

  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { style });

    if (Math.abs(diffSeconds) < 60) {
      return rtf.format(diffSeconds, 'second');
    }
    if (Math.abs(diffMinutes) < 60) {
      return rtf.format(diffMinutes, 'minute');
    }
    if (Math.abs(diffHours) < 24) {
      return rtf.format(diffHours, 'hour');
    }
    if (Math.abs(diffDays) < 7) {
      return rtf.format(diffDays, 'day');
    }
    if (Math.abs(diffWeeks) < 4) {
      return rtf.format(diffWeeks, 'week');
    }
    if (Math.abs(diffMonths) < 12) {
      return rtf.format(diffMonths, 'month');
    }
    return rtf.format(diffYears, 'year');
  } catch {
    // Fallback for browsers without RelativeTimeFormat
    if (diffDays === 0) return '今日';
    if (diffDays === 1) return '明日';
    if (diffDays === -1) return '昨日';
    if (diffDays > 0) return `${diffDays}日後`;
    return `${Math.abs(diffDays)}日前`;
  }
}

/**
 * Format as "time ago" style
 */
export function formatTimeAgo(date, locale = DEFAULT_LOCALE) {
  return formatRelativeTime(date, { locale, style: 'narrow' });
}

/**
 * Get day of week name
 */
export function getDayOfWeekName(date, options = {}) {
  const parsedDate = parseDate(date);
  if (!parsedDate) return '';

  const { locale = DEFAULT_LOCALE, format = 'long' } = options;

  return new Intl.DateTimeFormat(locale, { weekday: format }).format(parsedDate);
}

/**
 * Get month name
 */
export function getMonthName(date, options = {}) {
  const parsedDate = parseDate(date);
  if (!parsedDate) return '';

  const { locale = DEFAULT_LOCALE, format = 'long' } = options;

  return new Intl.DateTimeFormat(locale, { month: format }).format(parsedDate);
}

/**
 * Format duration in milliseconds
 */
export function formatDuration(ms, options = {}) {
  const { format = 'auto', locale = DEFAULT_LOCALE } = options;

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;

  if (format === 'clock') {
    // HH:MM:SS format
    if (days > 0) {
      return `${days}:${String(remainingHours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }
    if (hours > 0) {
      return `${hours}:${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  // Human readable format
  const parts = [];

  if (days > 0) parts.push(`${days}日`);
  if (remainingHours > 0) parts.push(`${remainingHours}時間`);
  if (remainingMinutes > 0) parts.push(`${remainingMinutes}分`);
  if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}秒`);

  return parts.join(' ');
}

/**
 * Format date range
 */
export function formatDateRange(startDate, endDate, options = {}) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (!start || !end) return '';

  const { locale = DEFAULT_LOCALE, format = DATE_FORMATS.MEDIUM } = options;

  const startFormatted = formatDate(start, { locale, format });
  const endFormatted = formatDate(end, { locale, format });

  // Same day
  if (toISODateString(start) === toISODateString(end)) {
    return startFormatted;
  }

  return `${startFormatted} 〜 ${endFormatted}`;
}

/**
 * Check if date is today
 */
export function isToday(date) {
  const parsedDate = parseDate(date);
  if (!parsedDate) return false;

  const today = new Date();
  return toISODateString(parsedDate) === toISODateString(today);
}

/**
 * Check if date is in the past
 */
export function isPast(date) {
  const parsedDate = parseDate(date);
  if (!parsedDate) return false;

  return parsedDate.getTime() < Date.now();
}

/**
 * Check if date is in the future
 */
export function isFuture(date) {
  const parsedDate = parseDate(date);
  if (!parsedDate) return false;

  return parsedDate.getTime() > Date.now();
}

/**
 * Get start of day
 */
export function startOfDay(date) {
  const parsedDate = parseDate(date);
  if (!parsedDate) return null;

  const result = new Date(parsedDate);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of day
 */
export function endOfDay(date) {
  const parsedDate = parseDate(date);
  if (!parsedDate) return null;

  const result = new Date(parsedDate);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Add days to date
 */
export function addDays(date, days) {
  const parsedDate = parseDate(date);
  if (!parsedDate) return null;

  const result = new Date(parsedDate);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Difference in days between two dates
 */
export function diffInDays(date1, date2) {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);

  if (!d1 || !d2) return null;

  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export default {
  parseDate,
  formatDate,
  formatTime,
  formatDateTime,
  toISOString,
  toISODateString,
  formatRelativeTime,
  formatTimeAgo,
  getDayOfWeekName,
  getMonthName,
  formatDuration,
  formatDateRange,
  isToday,
  isPast,
  isFuture,
  startOfDay,
  endOfDay,
  addDays,
  diffInDays,
  DATE_FORMATS
};
