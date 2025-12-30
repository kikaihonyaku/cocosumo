/**
 * Phone Formatter
 * Phone number formatting and validation for Japan
 */

// Japanese phone number patterns
export const PHONE_PATTERNS = {
  // Mobile phones
  MOBILE: /^(070|080|090)\d{8}$/,
  // Landlines (area codes vary in length)
  LANDLINE: /^0\d{9,10}$/,
  // Toll-free
  TOLL_FREE: /^0120\d{6}$/,
  // IP phones
  IP_PHONE: /^050\d{8}$/,
  // Any valid Japanese number
  ANY: /^0\d{9,10}$/
};

// Area code definitions (prefix -> length of area code)
const AREA_CODES = {
  // 2-digit area codes (Tokyo, Osaka, etc.)
  '03': 2, // Tokyo
  '06': 2, // Osaka
  '011': 3, // Sapporo
  '022': 3, // Sendai
  '052': 3, // Nagoya
  '075': 3, // Kyoto
  '078': 3, // Kobe
  '082': 3, // Hiroshima
  '092': 3, // Fukuoka
  // Mobile prefixes
  '070': 3,
  '080': 3,
  '090': 3,
  // IP phone
  '050': 3,
  // Toll-free
  '0120': 4,
  '0800': 4,
  // Default for other area codes
  'default': 4
};

/**
 * Clean phone number (remove non-digits)
 */
export function cleanPhoneNumber(phone) {
  if (!phone) return '';
  return String(phone).replace(/[^\d]/g, '');
}

/**
 * Format Japanese phone number
 */
export function formatPhone(phone, options = {}) {
  if (!phone) return '';

  const {
    format = 'hyphen', // 'hyphen', 'space', 'dots', 'parentheses', 'none'
    includeCountryCode = false
  } = options;

  let cleaned = cleanPhoneNumber(phone);

  // Remove country code if present
  if (cleaned.startsWith('81')) {
    cleaned = '0' + cleaned.slice(2);
  }
  if (cleaned.startsWith('+81')) {
    cleaned = '0' + cleaned.slice(3);
  }

  // Get separator based on format
  const separator = {
    hyphen: '-',
    space: ' ',
    dots: '.',
    parentheses: '-',
    none: ''
  }[format] || '-';

  // Determine area code length
  let areaCodeLength = AREA_CODES.default;
  for (const [prefix, length] of Object.entries(AREA_CODES)) {
    if (prefix !== 'default' && cleaned.startsWith(prefix)) {
      areaCodeLength = length;
      break;
    }
  }

  // Format based on phone type
  let formatted;

  // Mobile (070/080/090-XXXX-XXXX)
  if (/^0[789]0/.test(cleaned) && cleaned.length === 11) {
    formatted = `${cleaned.slice(0, 3)}${separator}${cleaned.slice(3, 7)}${separator}${cleaned.slice(7)}`;
  }
  // IP phone (050-XXXX-XXXX)
  else if (cleaned.startsWith('050') && cleaned.length === 11) {
    formatted = `${cleaned.slice(0, 3)}${separator}${cleaned.slice(3, 7)}${separator}${cleaned.slice(7)}`;
  }
  // Toll-free (0120-XXX-XXX)
  else if (cleaned.startsWith('0120') && cleaned.length === 10) {
    formatted = `${cleaned.slice(0, 4)}${separator}${cleaned.slice(4, 7)}${separator}${cleaned.slice(7)}`;
  }
  // Toll-free (0800-XXX-XXXX)
  else if (cleaned.startsWith('0800') && cleaned.length === 11) {
    formatted = `${cleaned.slice(0, 4)}${separator}${cleaned.slice(4, 7)}${separator}${cleaned.slice(7)}`;
  }
  // Landline with 2-digit area code (03-XXXX-XXXX, 06-XXXX-XXXX)
  else if (/^0[36]/.test(cleaned) && cleaned.length === 10) {
    formatted = `${cleaned.slice(0, 2)}${separator}${cleaned.slice(2, 6)}${separator}${cleaned.slice(6)}`;
  }
  // Landline with 3-digit area code (0XX-XXX-XXXX)
  else if (cleaned.length === 10 && areaCodeLength === 3) {
    formatted = `${cleaned.slice(0, 3)}${separator}${cleaned.slice(3, 6)}${separator}${cleaned.slice(6)}`;
  }
  // Landline with 4-digit area code (0XXX-XX-XXXX)
  else if (cleaned.length === 10) {
    formatted = `${cleaned.slice(0, 4)}${separator}${cleaned.slice(4, 6)}${separator}${cleaned.slice(6)}`;
  }
  // Unknown format, just return cleaned
  else {
    formatted = cleaned;
  }

  // Parentheses format: (03) 1234-5678
  if (format === 'parentheses' && formatted.includes('-')) {
    const parts = formatted.split('-');
    formatted = `(${parts[0]}) ${parts.slice(1).join('-')}`;
  }

  // Add country code if requested
  if (includeCountryCode && formatted.startsWith('0')) {
    formatted = '+81 ' + formatted.slice(1);
  }

  return formatted;
}

/**
 * Format as international format
 */
export function formatInternational(phone) {
  return formatPhone(phone, { includeCountryCode: true, format: 'space' });
}

/**
 * Format for tel: link
 */
export function formatTelLink(phone) {
  const cleaned = cleanPhoneNumber(phone);
  if (!cleaned) return '';

  // Convert to international format for tel: links
  if (cleaned.startsWith('0')) {
    return `tel:+81${cleaned.slice(1)}`;
  }
  return `tel:${cleaned}`;
}

/**
 * Validate Japanese phone number
 */
export function isValidPhone(phone, options = {}) {
  const { type = 'any' } = options;
  const cleaned = cleanPhoneNumber(phone);

  if (!cleaned) return false;

  // Check length
  if (cleaned.length < 10 || cleaned.length > 11) {
    return false;
  }

  // Check by type
  switch (type) {
    case 'mobile':
      return PHONE_PATTERNS.MOBILE.test(cleaned);
    case 'landline':
      return PHONE_PATTERNS.LANDLINE.test(cleaned) && !PHONE_PATTERNS.MOBILE.test(cleaned);
    case 'toll_free':
      return PHONE_PATTERNS.TOLL_FREE.test(cleaned);
    case 'ip':
      return PHONE_PATTERNS.IP_PHONE.test(cleaned);
    default:
      return PHONE_PATTERNS.ANY.test(cleaned);
  }
}

/**
 * Get phone type
 */
export function getPhoneType(phone) {
  const cleaned = cleanPhoneNumber(phone);

  if (!cleaned) return null;

  if (PHONE_PATTERNS.MOBILE.test(cleaned)) return 'mobile';
  if (PHONE_PATTERNS.TOLL_FREE.test(cleaned)) return 'toll_free';
  if (PHONE_PATTERNS.IP_PHONE.test(cleaned)) return 'ip';
  if (PHONE_PATTERNS.LANDLINE.test(cleaned)) return 'landline';

  return 'unknown';
}

/**
 * Get phone type label
 */
export function getPhoneTypeLabel(phone) {
  const type = getPhoneType(phone);

  const labels = {
    mobile: '携帯電話',
    landline: '固定電話',
    toll_free: 'フリーダイヤル',
    ip: 'IP電話',
    unknown: '電話'
  };

  return labels[type] || labels.unknown;
}

/**
 * Parse phone input (handle various input formats)
 */
export function parsePhoneInput(input) {
  if (!input) return '';

  let cleaned = String(input);

  // Remove common formatting characters
  cleaned = cleaned.replace(/[\s\-\.\(\)]/g, '');

  // Handle full-width numbers
  cleaned = cleaned.replace(/[０-９]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xFEE0)
  );

  // Handle country code variations
  cleaned = cleaned.replace(/^\+81/, '0');
  cleaned = cleaned.replace(/^81/, '0');
  cleaned = cleaned.replace(/^0081/, '0');

  // Remove any remaining non-digits
  cleaned = cleaned.replace(/[^\d]/g, '');

  return cleaned;
}

/**
 * Mask phone number for privacy
 */
export function maskPhone(phone, options = {}) {
  const {
    showFirst = 3,
    showLast = 4,
    maskChar = '*'
  } = options;

  const cleaned = cleanPhoneNumber(phone);
  if (!cleaned) return '';

  if (cleaned.length <= showFirst + showLast) {
    return cleaned;
  }

  const first = cleaned.slice(0, showFirst);
  const last = cleaned.slice(-showLast);
  const middle = maskChar.repeat(cleaned.length - showFirst - showLast);

  return `${first}${middle}${last}`;
}

/**
 * Format phone with label
 */
export function formatPhoneWithLabel(phone, label = null) {
  if (!phone) return '';

  const formatted = formatPhone(phone);
  const typeLabel = label || getPhoneTypeLabel(phone);

  return `${typeLabel}: ${formatted}`;
}

/**
 * Extract phone numbers from text
 */
export function extractPhoneNumbers(text) {
  if (!text) return [];

  // Pattern to match various phone number formats
  const phoneRegex = /(?:\+81|0081|81)?[\s\-]?0?[789]0[\s\-]?\d{4}[\s\-]?\d{4}|(?:\+81|0081|81)?[\s\-]?0\d{1,4}[\s\-]?\d{1,4}[\s\-]?\d{4}/g;

  const matches = text.match(phoneRegex) || [];

  return matches
    .map((match) => parsePhoneInput(match))
    .filter((phone) => isValidPhone(phone));
}

/**
 * Compare two phone numbers (ignoring formatting)
 */
export function isSamePhone(phone1, phone2) {
  return cleanPhoneNumber(phone1) === cleanPhoneNumber(phone2);
}

export default {
  cleanPhoneNumber,
  formatPhone,
  formatInternational,
  formatTelLink,
  isValidPhone,
  getPhoneType,
  getPhoneTypeLabel,
  parsePhoneInput,
  maskPhone,
  formatPhoneWithLabel,
  extractPhoneNumbers,
  isSamePhone,
  PHONE_PATTERNS
};
