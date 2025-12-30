/**
 * Internationalization (i18n) Module
 * Provides translation functionality for the application
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

// Import locale files
import jaLocale from './locales/ja.json';
import enLocale from './locales/en.json';

// Available locales
export const LOCALES = {
  ja: { name: '日本語', code: 'ja', translations: jaLocale },
  en: { name: 'English', code: 'en', translations: enLocale }
};

// Default locale
export const DEFAULT_LOCALE = 'ja';

// Storage key for persisting locale
const LOCALE_STORAGE_KEY = 'cocosumo_locale';

// Get saved locale from localStorage
function getSavedLocale() {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved && LOCALES[saved]) {
      return saved;
    }
  } catch (e) {
    // localStorage not available
  }
  return DEFAULT_LOCALE;
}

// Save locale to localStorage
function saveLocale(locale) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch (e) {
    // localStorage not available
  }
}

// Get nested value from object using dot notation
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

// Replace placeholders in string
function interpolate(str, params) {
  if (!params || typeof str !== 'string') return str;

  return str.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? params[key] : match;
  });
}

// Create i18n context
const I18nContext = createContext(null);

/**
 * I18n Provider Component
 * Wraps the application to provide translation context
 */
export function I18nProvider({ children, defaultLocale = DEFAULT_LOCALE }) {
  const [locale, setLocaleState] = useState(() => getSavedLocale() || defaultLocale);

  const setLocale = useCallback((newLocale) => {
    if (LOCALES[newLocale]) {
      setLocaleState(newLocale);
      saveLocale(newLocale);
      // Update HTML lang attribute
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLocale;
      }
    } else {
      console.warn(`Locale "${newLocale}" is not supported`);
    }
  }, []);

  const translations = useMemo(() => {
    return LOCALES[locale]?.translations || LOCALES[DEFAULT_LOCALE].translations;
  }, [locale]);

  // Translation function
  const t = useCallback((key, params = {}) => {
    const value = getNestedValue(translations, key);

    if (value === undefined) {
      // In development, warn about missing translations
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation: ${key}`);
      }
      // Return key as fallback
      return key;
    }

    return interpolate(value, params);
  }, [translations]);

  // Check if translation exists
  const hasTranslation = useCallback((key) => {
    return getNestedValue(translations, key) !== undefined;
  }, [translations]);

  // Format number according to locale
  const formatNumber = useCallback((value, options = {}) => {
    try {
      return new Intl.NumberFormat(locale, options).format(value);
    } catch (e) {
      return String(value);
    }
  }, [locale]);

  // Format currency
  const formatCurrency = useCallback((value, currency = 'JPY') => {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    } catch (e) {
      return `¥${value}`;
    }
  }, [locale]);

  // Format date
  const formatDate = useCallback((date, options = {}) => {
    try {
      const d = date instanceof Date ? date : new Date(date);
      return new Intl.DateTimeFormat(locale, options).format(d);
    } catch (e) {
      return String(date);
    }
  }, [locale]);

  // Format relative time
  const formatRelativeTime = useCallback((date) => {
    const d = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMins < 1) return t('time.now');
    if (diffMins < 60) return t('time.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('time.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('time.daysAgo', { count: diffDays });
    if (diffWeeks < 4) return t('time.weeksAgo', { count: diffWeeks });
    return t('time.monthsAgo', { count: diffMonths });
  }, [t]);

  const contextValue = useMemo(() => ({
    locale,
    setLocale,
    t,
    hasTranslation,
    formatNumber,
    formatCurrency,
    formatDate,
    formatRelativeTime,
    availableLocales: Object.keys(LOCALES).map(code => ({
      code,
      name: LOCALES[code].name
    }))
  }), [locale, setLocale, t, hasTranslation, formatNumber, formatCurrency, formatDate, formatRelativeTime]);

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook to use i18n functionality
 * @returns {object} i18n utilities
 */
export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }

  return context;
}

/**
 * Hook for simple translation
 * @returns {Function} Translation function
 */
export function useTranslation() {
  const { t } = useI18n();
  return t;
}

/**
 * Higher-order component for injecting i18n
 */
export function withI18n(WrappedComponent) {
  return function WithI18n(props) {
    const i18n = useI18n();
    return <WrappedComponent {...props} i18n={i18n} />;
  };
}

/**
 * Trans component for inline translations with React elements
 */
export function Trans({ i18nKey, components = {}, values = {} }) {
  const { t } = useI18n();
  const text = t(i18nKey, values);

  // If no components, just return the text
  if (Object.keys(components).length === 0) {
    return <>{text}</>;
  }

  // Split text by component markers and rebuild with React elements
  const regex = /<(\w+)>(.*?)<\/\1>/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add the component
    const componentName = match[1];
    const content = match[2];
    const Component = components[componentName];

    if (Component) {
      parts.push(React.cloneElement(Component, { key: match.index }, content));
    } else {
      parts.push(content);
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}

export default {
  I18nProvider,
  useI18n,
  useTranslation,
  withI18n,
  Trans,
  LOCALES,
  DEFAULT_LOCALE
};
