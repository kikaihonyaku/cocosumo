/**
 * Responsive Utilities
 * Helper functions for responsive design
 */

// Default breakpoints
export const BREAKPOINTS = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536
};

/**
 * Create media query string
 */
export function createMediaQuery(minWidth, maxWidth) {
  if (minWidth && maxWidth) {
    return `@media (min-width: ${minWidth}px) and (max-width: ${maxWidth - 0.02}px)`;
  }
  if (minWidth) {
    return `@media (min-width: ${minWidth}px)`;
  }
  if (maxWidth) {
    return `@media (max-width: ${maxWidth - 0.02}px)`;
  }
  return '';
}

/**
 * Media query helpers
 */
export const mediaQueries = {
  up: (breakpoint) => {
    const minWidth = BREAKPOINTS[breakpoint] || breakpoint;
    return `@media (min-width: ${minWidth}px)`;
  },

  down: (breakpoint) => {
    const breakpointKeys = Object.keys(BREAKPOINTS);
    const index = breakpointKeys.indexOf(breakpoint);
    if (index === -1 || index === breakpointKeys.length - 1) {
      return '@media (min-width: 0px)'; // Always matches
    }
    const maxWidth = BREAKPOINTS[breakpointKeys[index + 1]];
    return `@media (max-width: ${maxWidth - 0.02}px)`;
  },

  only: (breakpoint) => {
    const breakpointKeys = Object.keys(BREAKPOINTS);
    const index = breakpointKeys.indexOf(breakpoint);
    const minWidth = BREAKPOINTS[breakpoint];

    if (index === breakpointKeys.length - 1) {
      return `@media (min-width: ${minWidth}px)`;
    }

    const maxWidth = BREAKPOINTS[breakpointKeys[index + 1]];
    return createMediaQuery(minWidth, maxWidth);
  },

  between: (start, end) => {
    const minWidth = BREAKPOINTS[start] || start;
    const maxWidth = BREAKPOINTS[end] || end;
    return createMediaQuery(minWidth, maxWidth);
  }
};

/**
 * Get current breakpoint
 */
export function getCurrentBreakpoint() {
  if (typeof window === 'undefined') return 'xs';

  const width = window.innerWidth;
  const sortedBreakpoints = Object.entries(BREAKPOINTS)
    .sort(([, a], [, b]) => b - a);

  for (const [name, minWidth] of sortedBreakpoints) {
    if (width >= minWidth) {
      return name;
    }
  }

  return 'xs';
}

/**
 * Check if viewport matches breakpoint
 */
export function matchesBreakpoint(breakpoint, direction = 'up') {
  if (typeof window === 'undefined') return false;

  const width = window.innerWidth;
  const breakpointValue = BREAKPOINTS[breakpoint] || 0;

  switch (direction) {
    case 'up':
      return width >= breakpointValue;
    case 'down': {
      const breakpointKeys = Object.keys(BREAKPOINTS);
      const index = breakpointKeys.indexOf(breakpoint);
      if (index === breakpointKeys.length - 1) return true;
      const nextBreakpoint = BREAKPOINTS[breakpointKeys[index + 1]];
      return width < nextBreakpoint;
    }
    case 'only':
      return getCurrentBreakpoint() === breakpoint;
    default:
      return false;
  }
}

/**
 * Get responsive value from object
 */
export function getResponsiveValue(values, breakpoint = null) {
  const bp = breakpoint || getCurrentBreakpoint();

  if (!values || typeof values !== 'object') {
    return values;
  }

  // Check breakpoints from current to smallest
  const breakpointOrder = ['xl', 'lg', 'md', 'sm', 'xs'];
  const startIndex = breakpointOrder.indexOf(bp);

  for (let i = startIndex; i < breakpointOrder.length; i++) {
    const key = breakpointOrder[i];
    if (values[key] !== undefined) {
      return values[key];
    }
  }

  // Also check numeric/string values
  if (values.default !== undefined) return values.default;

  return null;
}

/**
 * Create responsive styles object
 */
export function createResponsiveStyles(property, values) {
  const styles = {};

  Object.entries(values).forEach(([breakpoint, value]) => {
    if (breakpoint === 'xs') {
      styles[property] = value;
    } else {
      const mediaQuery = mediaQueries.up(breakpoint);
      if (!styles[mediaQuery]) {
        styles[mediaQuery] = {};
      }
      styles[mediaQuery][property] = value;
    }
  });

  return styles;
}

/**
 * Calculate fluid value (responsive between min and max)
 */
export function fluidValue(minValue, maxValue, minViewport = 320, maxViewport = 1200) {
  const slope = (maxValue - minValue) / (maxViewport - minViewport);
  const yIntersection = -minViewport * slope + minValue;

  return `clamp(${minValue}px, ${yIntersection}px + ${slope * 100}vw, ${maxValue}px)`;
}

/**
 * Calculate columns for grid
 */
export function calculateColumns(containerWidth, minColumnWidth, gap = 0) {
  const availableWidth = containerWidth - gap;
  const columns = Math.floor((availableWidth + gap) / (minColumnWidth + gap));
  return Math.max(1, columns);
}

/**
 * Get device pixel ratio
 */
export function getDevicePixelRatio() {
  if (typeof window === 'undefined') return 1;
  return window.devicePixelRatio || 1;
}

/**
 * Check if high DPI display
 */
export function isHighDPI() {
  return getDevicePixelRatio() > 1;
}

/**
 * Check if retina display
 */
export function isRetina() {
  return getDevicePixelRatio() >= 2;
}

/**
 * Get optimal image size for display
 */
export function getOptimalImageSize(displayWidth, displayHeight = null) {
  const dpr = getDevicePixelRatio();
  return {
    width: Math.round(displayWidth * dpr),
    height: displayHeight ? Math.round(displayHeight * dpr) : null
  };
}

/**
 * Create srcset for responsive images
 */
export function createSrcSet(baseUrl, widths = [320, 640, 960, 1280, 1920]) {
  return widths
    .map((width) => {
      const url = baseUrl.replace('{width}', width);
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Calculate aspect ratio
 */
export function calculateAspectRatio(width, height) {
  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

/**
 * Get aspect ratio as number
 */
export function getAspectRatioNumber(ratio) {
  if (typeof ratio === 'number') return ratio;

  const [width, height] = ratio.split(':').map(Number);
  return width / height;
}

/**
 * Calculate height from width and aspect ratio
 */
export function calculateHeight(width, aspectRatio) {
  const ratio = getAspectRatioNumber(aspectRatio);
  return Math.round(width / ratio);
}

/**
 * Calculate width from height and aspect ratio
 */
export function calculateWidth(height, aspectRatio) {
  const ratio = getAspectRatioNumber(aspectRatio);
  return Math.round(height * ratio);
}

/**
 * Check if viewport is in portrait mode
 */
export function isPortrait() {
  if (typeof window === 'undefined') return true;
  return window.innerHeight > window.innerWidth;
}

/**
 * Check if viewport is in landscape mode
 */
export function isLandscape() {
  return !isPortrait();
}

/**
 * Get safe area insets (for notched devices)
 */
export function getSafeAreaInsets() {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const style = getComputedStyle(document.documentElement);

  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0', 10),
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0', 10),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0', 10),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0', 10)
  };
}

/**
 * CSS-in-JS helper for responsive values
 */
export function responsive(property, values) {
  const styles = {};

  if (typeof values !== 'object') {
    return { [property]: values };
  }

  Object.entries(values).forEach(([breakpoint, value]) => {
    if (breakpoint === 'xs' || breakpoint === 'base') {
      styles[property] = value;
    } else {
      const query = mediaQueries.up(breakpoint);
      styles[query] = { [property]: value };
    }
  });

  return styles;
}

/**
 * Generate responsive spacing scale
 */
export function createResponsiveSpacing(baseUnit = 8) {
  return {
    0: 0,
    1: baseUnit * 0.5,
    2: baseUnit,
    3: baseUnit * 1.5,
    4: baseUnit * 2,
    5: baseUnit * 2.5,
    6: baseUnit * 3,
    8: baseUnit * 4,
    10: baseUnit * 5,
    12: baseUnit * 6,
    16: baseUnit * 8
  };
}

export default {
  BREAKPOINTS,
  createMediaQuery,
  mediaQueries,
  getCurrentBreakpoint,
  matchesBreakpoint,
  getResponsiveValue,
  createResponsiveStyles,
  fluidValue,
  calculateColumns,
  getDevicePixelRatio,
  isHighDPI,
  isRetina,
  getOptimalImageSize,
  createSrcSet,
  calculateAspectRatio,
  getAspectRatioNumber,
  calculateHeight,
  calculateWidth,
  isPortrait,
  isLandscape,
  getSafeAreaInsets,
  responsive,
  createResponsiveSpacing
};
