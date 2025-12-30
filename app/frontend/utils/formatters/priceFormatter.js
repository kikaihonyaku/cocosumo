/**
 * Price Formatter
 * Currency and price formatting utilities for real estate
 */

// Default settings
const DEFAULT_LOCALE = 'ja-JP';
const DEFAULT_CURRENCY = 'JPY';

// Price unit definitions
export const PRICE_UNITS = {
  YEN: { value: 1, label: '円', short: '円' },
  MAN: { value: 10000, label: '万円', short: '万' },
  OKU: { value: 100000000, label: '億円', short: '億' }
};

/**
 * Format number as currency
 */
export function formatCurrency(amount, options = {}) {
  if (amount === null || amount === undefined || isNaN(amount)) return '';

  const {
    locale = DEFAULT_LOCALE,
    currency = DEFAULT_CURRENCY,
    minimumFractionDigits,
    maximumFractionDigits,
    ...restOptions
  } = options;

  try {
    const formatOptions = {
      style: 'currency',
      currency,
      ...restOptions
    };

    // JPY doesn't use decimals
    if (currency === 'JPY') {
      formatOptions.minimumFractionDigits = minimumFractionDigits ?? 0;
      formatOptions.maximumFractionDigits = maximumFractionDigits ?? 0;
    }

    return new Intl.NumberFormat(locale, formatOptions).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

/**
 * Format price in Japanese style (万円/億円)
 */
export function formatJapanesePrice(amount, options = {}) {
  if (amount === null || amount === undefined || isNaN(amount)) return '';

  const {
    showUnit = true,
    autoUnit = true,
    unit = null,
    decimals = 1,
    omitZeroDecimals = true
  } = options;

  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  let value;
  let unitLabel;

  if (unit) {
    // Use specified unit
    const unitDef = PRICE_UNITS[unit.toUpperCase()];
    if (unitDef) {
      value = absAmount / unitDef.value;
      unitLabel = unitDef.label;
    } else {
      value = absAmount;
      unitLabel = '円';
    }
  } else if (autoUnit) {
    // Auto-select appropriate unit
    if (absAmount >= PRICE_UNITS.OKU.value) {
      value = absAmount / PRICE_UNITS.OKU.value;
      unitLabel = PRICE_UNITS.OKU.label;
    } else if (absAmount >= PRICE_UNITS.MAN.value) {
      value = absAmount / PRICE_UNITS.MAN.value;
      unitLabel = PRICE_UNITS.MAN.label;
    } else {
      value = absAmount;
      unitLabel = PRICE_UNITS.YEN.label;
    }
  } else {
    value = absAmount;
    unitLabel = '円';
  }

  // Format the value
  let formattedValue;
  if (unitLabel === '円' || (omitZeroDecimals && value === Math.floor(value))) {
    formattedValue = Math.floor(value).toLocaleString('ja-JP');
  } else {
    formattedValue = value.toLocaleString('ja-JP', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
  }

  return showUnit ? `${sign}${formattedValue}${unitLabel}` : `${sign}${formattedValue}`;
}

/**
 * Format rent price (家賃)
 */
export function formatRent(amount, options = {}) {
  if (!amount) return '';

  const { includeUnit = true, period = '月' } = options;

  const formatted = formatJapanesePrice(amount, { unit: 'MAN', ...options });

  return includeUnit ? `${formatted}/${period}` : formatted;
}

/**
 * Format property price (物件価格)
 */
export function formatPropertyPrice(amount, options = {}) {
  return formatJapanesePrice(amount, options);
}

/**
 * Format price per area (坪単価/㎡単価)
 */
export function formatPricePerArea(price, area, options = {}) {
  if (!price || !area) return '';

  const { areaUnit = 'sqm' } = options; // 'sqm' or 'tsubo'

  const pricePerUnit = price / area;

  const unitLabel = areaUnit === 'tsubo' ? '/坪' : '/㎡';

  return formatJapanesePrice(pricePerUnit, options) + unitLabel;
}

/**
 * Format price range
 */
export function formatPriceRange(minPrice, maxPrice, options = {}) {
  const { separator = '〜' } = options;

  if (!minPrice && !maxPrice) return '';
  if (!minPrice) return `${separator}${formatJapanesePrice(maxPrice, options)}`;
  if (!maxPrice) return `${formatJapanesePrice(minPrice, options)}${separator}`;

  // Use same unit for both if possible
  const minUnit = getAppropriateUnit(minPrice);
  const maxUnit = getAppropriateUnit(maxPrice);
  const unit = maxUnit; // Use larger unit

  const formattedMin = formatJapanesePrice(minPrice, { ...options, unit, showUnit: false });
  const formattedMax = formatJapanesePrice(maxPrice, { ...options, unit });

  return `${formattedMin}${separator}${formattedMax}`;
}

/**
 * Get appropriate unit for amount
 */
function getAppropriateUnit(amount) {
  if (amount >= PRICE_UNITS.OKU.value) return 'OKU';
  if (amount >= PRICE_UNITS.MAN.value) return 'MAN';
  return 'YEN';
}

/**
 * Parse price string to number
 */
export function parsePrice(priceString) {
  if (!priceString) return null;
  if (typeof priceString === 'number') return priceString;

  // Remove non-numeric characters except decimal point and minus
  let cleaned = priceString.replace(/[^\d.,-]/g, '');

  // Handle Japanese units
  if (priceString.includes('億')) {
    const match = priceString.match(/([\d,.]+)億/);
    if (match) {
      const oku = parseFloat(match[1].replace(/,/g, '')) * PRICE_UNITS.OKU.value;
      const manMatch = priceString.match(/([\d,.]+)万/);
      const man = manMatch ? parseFloat(manMatch[1].replace(/,/g, '')) * PRICE_UNITS.MAN.value : 0;
      return oku + man;
    }
  }

  if (priceString.includes('万')) {
    const match = priceString.match(/([\d,.]+)万/);
    if (match) {
      return parseFloat(match[1].replace(/,/g, '')) * PRICE_UNITS.MAN.value;
    }
  }

  // Just parse the number
  cleaned = cleaned.replace(/,/g, '');
  const parsed = parseFloat(cleaned);

  return isNaN(parsed) ? null : parsed;
}

/**
 * Format management fee (管理費)
 */
export function formatManagementFee(amount, options = {}) {
  if (!amount) return '込み';

  return formatJapanesePrice(amount, { unit: 'YEN', ...options });
}

/**
 * Format deposit (敷金)
 */
export function formatDeposit(amount, options = {}) {
  const { asMonths = false, rentAmount } = options;

  if (!amount) return 'なし';

  if (asMonths && rentAmount) {
    const months = amount / rentAmount;
    return `${months}ヶ月`;
  }

  return formatJapanesePrice(amount, options);
}

/**
 * Format key money (礼金)
 */
export function formatKeyMoney(amount, options = {}) {
  return formatDeposit(amount, options);
}

/**
 * Format common charges (共益費)
 */
export function formatCommonCharges(amount, options = {}) {
  if (!amount) return 'なし';

  return formatJapanesePrice(amount, { unit: 'YEN', ...options });
}

/**
 * Format total move-in cost
 */
export function formatTotalMoveInCost(costs, options = {}) {
  const {
    rent = 0,
    deposit = 0,
    keyMoney = 0,
    commonCharges = 0,
    other = 0
  } = costs;

  const total = rent + deposit + keyMoney + commonCharges + other;

  return formatJapanesePrice(total, options);
}

/**
 * Calculate and format yield (利回り)
 */
export function formatYield(annualIncome, propertyPrice, options = {}) {
  if (!annualIncome || !propertyPrice) return '';

  const { decimals = 2 } = options;

  const yieldRate = (annualIncome / propertyPrice) * 100;

  return `${yieldRate.toFixed(decimals)}%`;
}

/**
 * Format number with commas
 */
export function formatNumber(value, options = {}) {
  if (value === null || value === undefined || isNaN(value)) return '';

  const { locale = DEFAULT_LOCALE, decimals } = options;

  const formatOptions = {};
  if (decimals !== undefined) {
    formatOptions.minimumFractionDigits = decimals;
    formatOptions.maximumFractionDigits = decimals;
  }

  return new Intl.NumberFormat(locale, formatOptions).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value, options = {}) {
  if (value === null || value === undefined || isNaN(value)) return '';

  const { locale = DEFAULT_LOCALE, decimals = 1, multiply = false } = options;

  const percentage = multiply ? value * 100 : value;

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(multiply ? value : value / 100);
}

/**
 * Compact number formatting (1.2万, 3.5億)
 */
export function formatCompactNumber(value, options = {}) {
  if (value === null || value === undefined || isNaN(value)) return '';

  const { locale = DEFAULT_LOCALE } = options;

  try {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      compactDisplay: 'short'
    }).format(value);
  } catch {
    return formatJapanesePrice(value, { showUnit: true });
  }
}

export default {
  formatCurrency,
  formatJapanesePrice,
  formatRent,
  formatPropertyPrice,
  formatPricePerArea,
  formatPriceRange,
  parsePrice,
  formatManagementFee,
  formatDeposit,
  formatKeyMoney,
  formatCommonCharges,
  formatTotalMoveInCost,
  formatYield,
  formatNumber,
  formatPercentage,
  formatCompactNumber,
  PRICE_UNITS
};
