/**
 * Accessibility Utilities
 * Helper functions for accessibility features
 */

/**
 * Generate unique ID for accessibility
 */
let idCounter = 0;

export function generateA11yId(prefix = 'a11y') {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/**
 * Create ID for label/input pair
 */
export function createLabelledById(baseId) {
  return {
    inputId: `${baseId}-input`,
    labelId: `${baseId}-label`,
    descriptionId: `${baseId}-description`,
    errorId: `${baseId}-error`
  };
}

/**
 * Get contrast ratio between two colors
 */
export function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get relative luminance of a color
 */
export function getLuminance(color) {
  const rgb = parseColor(color);
  if (!rgb) return 0;

  const [r, g, b] = rgb.map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Parse color string to RGB array
 */
export function parseColor(color) {
  if (!color) return null;

  // Hex format
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    return [
      parseInt(hexMatch[1], 16),
      parseInt(hexMatch[2], 16),
      parseInt(hexMatch[3], 16)
    ];
  }

  // Short hex format
  const shortHexMatch = color.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
  if (shortHexMatch) {
    return [
      parseInt(shortHexMatch[1] + shortHexMatch[1], 16),
      parseInt(shortHexMatch[2] + shortHexMatch[2], 16),
      parseInt(shortHexMatch[3] + shortHexMatch[3], 16)
    ];
  }

  // RGB format
  const rgbMatch = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1], 10),
      parseInt(rgbMatch[2], 10),
      parseInt(rgbMatch[3], 10)
    ];
  }

  return null;
}

/**
 * Check if contrast ratio meets WCAG AA standard
 */
export function meetsContrastAA(foreground, background, isLargeText = false) {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AAA standard
 */
export function meetsContrastAAA(foreground, background, isLargeText = false) {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Get suggested foreground color for background
 */
export function getSuggestedForeground(background) {
  const luminance = getLuminance(background);
  return luminance > 0.179 ? '#000000' : '#ffffff';
}

/**
 * Check if element is visible
 */
export function isElementVisible(element) {
  if (!element) return false;

  const style = window.getComputedStyle(element);

  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0'
  ) {
    return false;
  }

  // Check if element is off-screen
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return false;
  }

  return true;
}

/**
 * Check if element is focusable
 */
export function isFocusable(element) {
  if (!element || element.disabled) return false;

  const tagName = element.tagName.toLowerCase();
  const tabIndex = element.getAttribute('tabindex');

  // Inherently focusable elements
  const focusableTags = ['a', 'button', 'input', 'select', 'textarea'];
  if (focusableTags.includes(tagName)) {
    // Check for href on anchor
    if (tagName === 'a' && !element.hasAttribute('href')) {
      return tabIndex !== null && tabIndex !== '-1';
    }
    return tabIndex !== '-1';
  }

  // Elements with tabindex
  if (tabIndex !== null && tabIndex !== '-1') {
    return true;
  }

  // Content editable
  if (element.contentEditable === 'true') {
    return true;
  }

  return false;
}

/**
 * Get element's accessible name
 */
export function getAccessibleName(element) {
  if (!element) return '';

  // aria-labelledby
  const labelledById = element.getAttribute('aria-labelledby');
  if (labelledById) {
    const labels = labelledById.split(' ')
      .map((id) => document.getElementById(id)?.textContent)
      .filter(Boolean);
    if (labels.length > 0) {
      return labels.join(' ');
    }
  }

  // aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  // For inputs, check associated label
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent.trim();
  }

  // title attribute
  const title = element.getAttribute('title');
  if (title) return title;

  // Text content (for buttons, links)
  if (['button', 'a'].includes(element.tagName.toLowerCase())) {
    return element.textContent.trim();
  }

  // Placeholder (for inputs)
  const placeholder = element.getAttribute('placeholder');
  if (placeholder) return placeholder;

  return '';
}

/**
 * Create visually hidden styles (for screen readers)
 */
export function getVisuallyHiddenStyles() {
  return {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0'
  };
}

/**
 * Create skip link styles
 */
export function getSkipLinkStyles(isVisible = false) {
  const baseStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    padding: '8px 16px',
    background: '#000',
    color: '#fff',
    textDecoration: 'none',
    zIndex: 9999,
    transform: 'translateY(-100%)',
    transition: 'transform 0.2s'
  };

  if (isVisible) {
    return {
      ...baseStyles,
      transform: 'translateY(0)'
    };
  }

  return baseStyles;
}

/**
 * Create focus visible styles
 */
export function getFocusVisibleStyles(color = '#0066cc') {
  return {
    outline: `2px solid ${color}`,
    outlineOffset: '2px'
  };
}

/**
 * Get landmark role for element
 */
export function getLandmarkRole(element) {
  if (!element) return null;

  const role = element.getAttribute('role');
  const tagName = element.tagName.toLowerCase();

  // Explicit roles
  const landmarkRoles = [
    'banner', 'complementary', 'contentinfo', 'form',
    'main', 'navigation', 'region', 'search'
  ];

  if (role && landmarkRoles.includes(role)) {
    return role;
  }

  // Implicit roles from HTML5 elements
  const implicitRoles = {
    header: 'banner',
    footer: 'contentinfo',
    main: 'main',
    nav: 'navigation',
    aside: 'complementary',
    form: 'form',
    section: 'region'
  };

  if (implicitRoles[tagName]) {
    // header/footer only have implicit roles when not inside article/section
    if (tagName === 'header' || tagName === 'footer') {
      if (!element.closest('article, section, aside, nav')) {
        return implicitRoles[tagName];
      }
      return null;
    }

    // section only has role if it has accessible name
    if (tagName === 'section') {
      if (getAccessibleName(element)) {
        return implicitRoles[tagName];
      }
      return null;
    }

    return implicitRoles[tagName];
  }

  return null;
}

/**
 * Check for common accessibility issues
 */
export function auditAccessibility(container = document.body) {
  const issues = [];

  // Check images for alt text
  const images = container.querySelectorAll('img');
  images.forEach((img) => {
    if (!img.hasAttribute('alt')) {
      issues.push({
        type: 'error',
        rule: 'image-alt',
        element: img,
        message: '画像にalt属性がありません'
      });
    }
  });

  // Check form inputs for labels
  const inputs = container.querySelectorAll('input, select, textarea');
  inputs.forEach((input) => {
    if (input.type === 'hidden') return;

    const name = getAccessibleName(input);
    if (!name) {
      issues.push({
        type: 'error',
        rule: 'form-label',
        element: input,
        message: 'フォーム要素にラベルがありません'
      });
    }
  });

  // Check buttons for accessible names
  const buttons = container.querySelectorAll('button, [role="button"]');
  buttons.forEach((button) => {
    const name = getAccessibleName(button);
    if (!name) {
      issues.push({
        type: 'error',
        rule: 'button-name',
        element: button,
        message: 'ボタンにアクセシブルな名前がありません'
      });
    }
  });

  // Check links for accessible names
  const links = container.querySelectorAll('a[href]');
  links.forEach((link) => {
    const name = getAccessibleName(link);
    if (!name) {
      issues.push({
        type: 'error',
        rule: 'link-name',
        element: link,
        message: 'リンクにアクセシブルな名前がありません'
      });
    }
  });

  // Check for empty headings
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach((heading) => {
    if (!heading.textContent.trim()) {
      issues.push({
        type: 'error',
        rule: 'empty-heading',
        element: heading,
        message: '見出しが空です'
      });
    }
  });

  // Check heading order
  let lastHeadingLevel = 0;
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName[1], 10);
    if (level > lastHeadingLevel + 1 && lastHeadingLevel !== 0) {
      issues.push({
        type: 'warning',
        rule: 'heading-order',
        element: heading,
        message: `見出しレベルが飛んでいます (h${lastHeadingLevel} → h${level})`
      });
    }
    lastHeadingLevel = level;
  });

  return issues;
}

/**
 * Format duration for screen readers
 */
export function formatDurationForSR(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}時間`);
  if (minutes > 0) parts.push(`${minutes}分`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}秒`);

  return parts.join(' ');
}

/**
 * Format number for screen readers
 */
export function formatNumberForSR(number) {
  if (number === undefined || number === null) return '';

  // Add thousands separators for readability
  return number.toLocaleString('ja-JP');
}

export default {
  generateA11yId,
  createLabelledById,
  getContrastRatio,
  getLuminance,
  parseColor,
  meetsContrastAA,
  meetsContrastAAA,
  getSuggestedForeground,
  isElementVisible,
  isFocusable,
  getAccessibleName,
  getVisuallyHiddenStyles,
  getSkipLinkStyles,
  getFocusVisibleStyles,
  getLandmarkRole,
  auditAccessibility,
  formatDurationForSR,
  formatNumberForSR
};
