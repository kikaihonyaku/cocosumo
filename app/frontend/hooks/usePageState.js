/**
 * Page State Hook
 * Persists component/page state across navigation
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Storage keys prefix
const STORAGE_PREFIX = 'cocosumo_page_state_';

/**
 * Get storage key with prefix
 */
function getStorageKey(key) {
  return `${STORAGE_PREFIX}${key}`;
}

/**
 * Page state persistence hook
 */
export function usePageState(key, initialValue, options = {}) {
  const {
    storage = 'session', // 'session' | 'local' | 'memory'
    expireIn = null, // Expiration time in milliseconds
    serialize = JSON.stringify,
    deserialize = JSON.parse
  } = options;

  // Memory storage fallback
  const memoryStorageRef = useRef(new Map());

  // Get storage object
  const getStorage = useCallback(() => {
    switch (storage) {
      case 'local':
        return window.localStorage;
      case 'session':
        return window.sessionStorage;
      case 'memory':
        return {
          getItem: (k) => memoryStorageRef.current.get(k) ?? null,
          setItem: (k, v) => memoryStorageRef.current.set(k, v),
          removeItem: (k) => memoryStorageRef.current.delete(k)
        };
      default:
        return window.sessionStorage;
    }
  }, [storage]);

  // Get initial state from storage
  const getStoredValue = useCallback(() => {
    try {
      const storageObj = getStorage();
      const storedItem = storageObj.getItem(getStorageKey(key));

      if (!storedItem) return initialValue;

      const { value, expiry } = deserialize(storedItem);

      // Check expiration
      if (expiry && Date.now() > expiry) {
        storageObj.removeItem(getStorageKey(key));
        return initialValue;
      }

      return value;
    } catch {
      return initialValue;
    }
  }, [key, initialValue, getStorage, deserialize]);

  const [state, setState] = useState(getStoredValue);

  // Save to storage when state changes
  useEffect(() => {
    try {
      const storageObj = getStorage();
      const item = {
        value: state,
        expiry: expireIn ? Date.now() + expireIn : null,
        timestamp: Date.now()
      };

      storageObj.setItem(getStorageKey(key), serialize(item));
    } catch {
      // Storage might be full or disabled
    }
  }, [key, state, getStorage, serialize, expireIn]);

  // Update state
  const setPageState = useCallback((newValue) => {
    setState((prev) => {
      const value = typeof newValue === 'function' ? newValue(prev) : newValue;
      return value;
    });
  }, []);

  // Clear state
  const clearPageState = useCallback(() => {
    try {
      const storageObj = getStorage();
      storageObj.removeItem(getStorageKey(key));
    } catch {
      // Ignore errors
    }
    setState(initialValue);
  }, [key, initialValue, getStorage]);

  return [state, setPageState, clearPageState];
}

/**
 * Form state persistence hook
 */
export function useFormState(formKey, initialValues = {}) {
  const [values, setValues, clearValues] = usePageState(
    `form_${formKey}`,
    initialValues,
    { storage: 'session' }
  );

  const [isDirty, setIsDirty] = useState(false);

  // Set single field value
  const setFieldValue = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, [setValues]);

  // Set multiple field values
  const setFieldValues = useCallback((updates) => {
    setValues((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, [setValues]);

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setIsDirty(false);
  }, [initialValues, setValues]);

  // Clear form (remove from storage)
  const clearForm = useCallback(() => {
    clearValues();
    setIsDirty(false);
  }, [clearValues]);

  // Get field value
  const getFieldValue = useCallback((field, defaultValue = '') => {
    return values[field] ?? defaultValue;
  }, [values]);

  return {
    values,
    setFieldValue,
    setFieldValues,
    getFieldValue,
    resetForm,
    clearForm,
    isDirty
  };
}

/**
 * Table/List state persistence hook
 */
export function useListState(listKey, options = {}) {
  const {
    defaultPage = 1,
    defaultPageSize = 20,
    defaultSort = null,
    defaultFilters = {}
  } = options;

  const initialState = {
    page: defaultPage,
    pageSize: defaultPageSize,
    sort: defaultSort,
    filters: defaultFilters
  };

  const [state, setState, clearState] = usePageState(
    `list_${listKey}`,
    initialState,
    { storage: 'session' }
  );

  // Set page
  const setPage = useCallback((page) => {
    setState((prev) => ({ ...prev, page }));
  }, [setState]);

  // Set page size
  const setPageSize = useCallback((pageSize) => {
    setState((prev) => ({ ...prev, pageSize, page: 1 }));
  }, [setState]);

  // Set sort
  const setSort = useCallback((sort) => {
    setState((prev) => ({ ...prev, sort }));
  }, [setState]);

  // Set filters
  const setFilters = useCallback((filters) => {
    setState((prev) => ({ ...prev, filters, page: 1 }));
  }, [setState]);

  // Update single filter
  const setFilter = useCallback((key, value) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
      page: 1
    }));
  }, [setState]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setState((prev) => ({ ...prev, filters: defaultFilters, page: 1 }));
  }, [setState, defaultFilters]);

  // Reset all
  const resetList = useCallback(() => {
    setState(initialState);
  }, [setState, initialState]);

  return {
    ...state,
    setPage,
    setPageSize,
    setSort,
    setFilters,
    setFilter,
    clearFilters,
    resetList,
    clearState
  };
}

/**
 * Tab state persistence hook
 */
export function useTabState(tabKey, defaultTab = 0) {
  const [activeTab, setActiveTab, clearTabState] = usePageState(
    `tab_${tabKey}`,
    defaultTab,
    { storage: 'session' }
  );

  return {
    activeTab,
    setActiveTab,
    clearTabState
  };
}

/**
 * Accordion/Expansion state persistence hook
 */
export function useExpansionState(key, defaultExpanded = []) {
  const [expanded, setExpanded, clearExpanded] = usePageState(
    `expansion_${key}`,
    defaultExpanded,
    { storage: 'session' }
  );

  // Toggle single item
  const toggleExpanded = useCallback((id) => {
    setExpanded((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  }, [setExpanded]);

  // Expand item
  const expand = useCallback((id) => {
    setExpanded((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  }, [setExpanded]);

  // Collapse item
  const collapse = useCallback((id) => {
    setExpanded((prev) => prev.filter((item) => item !== id));
  }, [setExpanded]);

  // Expand all
  const expandAll = useCallback((ids) => {
    setExpanded(ids);
  }, [setExpanded]);

  // Collapse all
  const collapseAll = useCallback(() => {
    setExpanded([]);
  }, [setExpanded]);

  // Check if expanded
  const isExpanded = useCallback((id) => {
    return expanded.includes(id);
  }, [expanded]);

  return {
    expanded,
    toggleExpanded,
    expand,
    collapse,
    expandAll,
    collapseAll,
    isExpanded,
    clearExpanded
  };
}

/**
 * Scroll position persistence hook
 */
export function useScrollState(key) {
  const [scrollPosition, setScrollPosition] = usePageState(
    `scroll_${key}`,
    { x: 0, y: 0 },
    { storage: 'session' }
  );

  const containerRef = useRef(null);

  // Save current scroll position
  const saveScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollPosition({
        x: containerRef.current.scrollLeft,
        y: containerRef.current.scrollTop
      });
    } else {
      setScrollPosition({
        x: window.scrollX,
        y: window.scrollY
      });
    }
  }, [setScrollPosition]);

  // Restore scroll position
  const restoreScroll = useCallback((behavior = 'auto') => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        left: scrollPosition.x,
        top: scrollPosition.y,
        behavior
      });
    } else {
      window.scrollTo({
        left: scrollPosition.x,
        top: scrollPosition.y,
        behavior
      });
    }
  }, [scrollPosition]);

  // Auto-restore on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      restoreScroll();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return {
    scrollPosition,
    containerRef,
    saveScroll,
    restoreScroll
  };
}

/**
 * Search state persistence hook
 */
export function useSearchState(key, defaultQuery = '') {
  const [searchState, setSearchState, clearSearchState] = usePageState(
    `search_${key}`,
    { query: defaultQuery, history: [] },
    { storage: 'session' }
  );

  // Set search query
  const setQuery = useCallback((query) => {
    setSearchState((prev) => ({ ...prev, query }));
  }, [setSearchState]);

  // Add to search history
  const addToHistory = useCallback((query) => {
    if (!query.trim()) return;

    setSearchState((prev) => {
      const history = prev.history.filter((h) => h !== query);
      return {
        ...prev,
        history: [query, ...history].slice(0, 10) // Keep last 10
      };
    });
  }, [setSearchState]);

  // Clear history
  const clearHistory = useCallback(() => {
    setSearchState((prev) => ({ ...prev, history: [] }));
  }, [setSearchState]);

  return {
    query: searchState.query,
    history: searchState.history,
    setQuery,
    addToHistory,
    clearHistory,
    clearSearchState
  };
}

/**
 * Clear all page states
 */
export function clearAllPageStates(storage = 'session') {
  const storageObj = storage === 'local' ? localStorage : sessionStorage;

  Object.keys(storageObj).forEach((key) => {
    if (key.startsWith(STORAGE_PREFIX)) {
      storageObj.removeItem(key);
    }
  });
}

export default {
  usePageState,
  useFormState,
  useListState,
  useTabState,
  useExpansionState,
  useScrollState,
  useSearchState,
  clearAllPageStates
};
