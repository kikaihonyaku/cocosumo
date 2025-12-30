/**
 * Search Hooks
 * Advanced search and filtering hooks
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  buildSearchIndex,
  searchIndex,
  fuzzyMatch,
  highlightMatches,
  getSuggestions,
  createSearchHistory
} from '../utils/searchUtils';

/**
 * Full-text search hook
 */
export function useSearch(items, fields, options = {}) {
  const {
    weights = {},
    fuzzy = false,
    fuzzyThreshold = 0.6,
    debounce = 300,
    minQueryLength = 1,
    limit = 50
  } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const indexRef = useRef(null);
  const debounceRef = useRef(null);

  // Build index when items change
  useEffect(() => {
    if (items && items.length > 0) {
      indexRef.current = buildSearchIndex(items, fields, { weights });
    }
  }, [items, fields, weights]);

  // Perform search with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query || query.length < minQueryLength) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    debounceRef.current = setTimeout(() => {
      if (indexRef.current) {
        const searchResults = searchIndex(indexRef.current, query, {
          fuzzy,
          fuzzyThreshold,
          limit
        });
        setResults(searchResults);
      }
      setIsSearching(false);
    }, debounce);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, debounce, minQueryLength, fuzzy, fuzzyThreshold, limit]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

  // Get highlighted text
  const getHighlightedText = useCallback((text) => {
    return highlightMatches(text, query);
  }, [query]);

  return {
    query,
    setQuery,
    results,
    isSearching,
    clearSearch,
    getHighlightedText,
    hasResults: results.length > 0,
    resultCount: results.length
  };
}

/**
 * Faceted filter hook
 */
export function useFacetedFilter(items, facetConfigs) {
  const [selections, setSelections] = useState({});

  // Calculate facet options and counts
  const facets = useMemo(() => {
    const result = {};

    facetConfigs.forEach((config) => {
      const { field, label, type = 'checkbox' } = config;
      const counts = new Map();

      // Count occurrences for each value
      items.forEach((item) => {
        let value = getFieldValue(item, field);

        if (Array.isArray(value)) {
          value.forEach((v) => {
            counts.set(v, (counts.get(v) || 0) + 1);
          });
        } else if (value !== null && value !== undefined) {
          counts.set(value, (counts.get(value) || 0) + 1);
        }
      });

      // Convert to array and sort
      const options = Array.from(counts.entries())
        .map(([value, count]) => ({ value, count, label: String(value) }))
        .sort((a, b) => b.count - a.count);

      result[field] = {
        field,
        label,
        type,
        options,
        selected: selections[field] || []
      };
    });

    return result;
  }, [items, facetConfigs, selections]);

  // Filter items based on selections
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      return Object.entries(selections).every(([field, selected]) => {
        if (!selected || selected.length === 0) return true;

        const value = getFieldValue(item, field);

        if (Array.isArray(value)) {
          return selected.some((s) => value.includes(s));
        }

        return selected.includes(value);
      });
    });
  }, [items, selections]);

  // Toggle facet value
  const toggleFacet = useCallback((field, value) => {
    setSelections((prev) => {
      const current = prev[field] || [];
      const isSelected = current.includes(value);

      return {
        ...prev,
        [field]: isSelected
          ? current.filter((v) => v !== value)
          : [...current, value]
      };
    });
  }, []);

  // Set facet values
  const setFacet = useCallback((field, values) => {
    setSelections((prev) => ({
      ...prev,
      [field]: Array.isArray(values) ? values : [values]
    }));
  }, []);

  // Clear single facet
  const clearFacet = useCallback((field) => {
    setSelections((prev) => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // Clear all facets
  const clearAllFacets = useCallback(() => {
    setSelections({});
  }, []);

  // Check if facet value is selected
  const isFacetSelected = useCallback((field, value) => {
    return (selections[field] || []).includes(value);
  }, [selections]);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    return Object.values(selections).reduce(
      (count, selected) => count + (selected?.length || 0),
      0
    );
  }, [selections]);

  return {
    facets,
    filteredItems,
    selections,
    toggleFacet,
    setFacet,
    clearFacet,
    clearAllFacets,
    isFacetSelected,
    activeFilterCount,
    hasActiveFilters: activeFilterCount > 0
  };
}

/**
 * Range filter hook
 */
export function useRangeFilter(items, field, options = {}) {
  const { min: customMin, max: customMax, step = 1 } = options;

  const [range, setRange] = useState([null, null]);

  // Calculate min/max from items
  const { min, max } = useMemo(() => {
    if (customMin !== undefined && customMax !== undefined) {
      return { min: customMin, max: customMax };
    }

    let minVal = Infinity;
    let maxVal = -Infinity;

    items.forEach((item) => {
      const value = getFieldValue(item, field);
      if (typeof value === 'number') {
        if (value < minVal) minVal = value;
        if (value > maxVal) maxVal = value;
      }
    });

    return {
      min: customMin ?? (minVal === Infinity ? 0 : minVal),
      max: customMax ?? (maxVal === -Infinity ? 100 : maxVal)
    };
  }, [items, field, customMin, customMax]);

  // Filter items
  const filteredItems = useMemo(() => {
    const [rangeMin, rangeMax] = range;

    if (rangeMin === null && rangeMax === null) {
      return items;
    }

    return items.filter((item) => {
      const value = getFieldValue(item, field);
      if (typeof value !== 'number') return true;

      if (rangeMin !== null && value < rangeMin) return false;
      if (rangeMax !== null && value > rangeMax) return false;

      return true;
    });
  }, [items, field, range]);

  // Set range
  const setRangeValue = useCallback((minVal, maxVal) => {
    setRange([minVal, maxVal]);
  }, []);

  // Clear range
  const clearRange = useCallback(() => {
    setRange([null, null]);
  }, []);

  return {
    range,
    min,
    max,
    step,
    filteredItems,
    setRange: setRangeValue,
    clearRange,
    hasRange: range[0] !== null || range[1] !== null
  };
}

/**
 * Sort hook
 */
export function useSort(items, options = {}) {
  const { defaultField = null, defaultDirection = 'asc' } = options;

  const [sortField, setSortField] = useState(defaultField);
  const [sortDirection, setSortDirection] = useState(defaultDirection);

  // Sort items
  const sortedItems = useMemo(() => {
    if (!sortField) return items;

    return [...items].sort((a, b) => {
      const aVal = getFieldValue(a, sortField);
      const bVal = getFieldValue(b, sortField);

      let comparison = 0;

      if (aVal === null || aVal === undefined) comparison = 1;
      else if (bVal === null || bVal === undefined) comparison = -1;
      else if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal, 'ja');
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime();
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [items, sortField, sortDirection]);

  // Toggle sort
  const toggleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  // Set sort
  const setSort = useCallback((field, direction = 'asc') => {
    setSortField(field);
    setSortDirection(direction);
  }, []);

  // Clear sort
  const clearSort = useCallback(() => {
    setSortField(defaultField);
    setSortDirection(defaultDirection);
  }, [defaultField, defaultDirection]);

  return {
    sortedItems,
    sortField,
    sortDirection,
    toggleSort,
    setSort,
    clearSort,
    isSorted: sortField !== null
  };
}

/**
 * Combined search and filter hook
 */
export function useSearchAndFilter(items, config) {
  const {
    searchFields = [],
    searchWeights = {},
    facetConfigs = [],
    rangeFields = [],
    defaultSort = null
  } = config;

  // Search
  const search = useSearch(items, searchFields, { weights: searchWeights });

  // Use search results if query exists, otherwise use all items
  const searchedItems = search.query ? search.results.map((r) => r.item) : items;

  // Faceted filter
  const facetFilter = useFacetedFilter(searchedItems, facetConfigs);

  // Range filters
  const rangeFilters = {};
  rangeFields.forEach((field) => {
    rangeFilters[field] = useRangeFilter(facetFilter.filteredItems, field);
  });

  // Get final filtered items
  const filteredItems = useMemo(() => {
    let result = facetFilter.filteredItems;

    Object.values(rangeFilters).forEach((filter) => {
      if (filter.hasRange) {
        result = result.filter((item) =>
          filter.filteredItems.includes(item)
        );
      }
    });

    return result;
  }, [facetFilter.filteredItems, rangeFilters]);

  // Sort
  const sort = useSort(filteredItems, {
    defaultField: defaultSort?.field,
    defaultDirection: defaultSort?.direction
  });

  // Clear all filters
  const clearAll = useCallback(() => {
    search.clearSearch();
    facetFilter.clearAllFacets();
    Object.values(rangeFilters).forEach((filter) => filter.clearRange());
    sort.clearSort();
  }, [search, facetFilter, rangeFilters, sort]);

  return {
    // Search
    query: search.query,
    setQuery: search.setQuery,
    isSearching: search.isSearching,
    clearSearch: search.clearSearch,
    getHighlightedText: search.getHighlightedText,

    // Facets
    facets: facetFilter.facets,
    toggleFacet: facetFilter.toggleFacet,
    setFacet: facetFilter.setFacet,
    clearFacet: facetFilter.clearFacet,
    isFacetSelected: facetFilter.isFacetSelected,

    // Range
    rangeFilters,

    // Sort
    sortField: sort.sortField,
    sortDirection: sort.sortDirection,
    toggleSort: sort.toggleSort,
    setSort: sort.setSort,

    // Results
    items: sort.sortedItems,
    totalCount: items.length,
    filteredCount: sort.sortedItems.length,

    // Actions
    clearAll,
    hasActiveFilters: facetFilter.hasActiveFilters ||
      Object.values(rangeFilters).some((f) => f.hasRange) ||
      !!search.query
  };
}

/**
 * Search suggestions hook
 */
export function useSearchSuggestions(items, fields, options = {}) {
  const { limit = 10, minLength = 2 } = options;

  const [prefix, setPrefix] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const indexRef = useRef(null);

  // Build index
  useEffect(() => {
    if (items && items.length > 0) {
      indexRef.current = buildSearchIndex(items, fields);
    }
  }, [items, fields]);

  // Get suggestions
  useEffect(() => {
    if (!prefix || prefix.length < minLength || !indexRef.current) {
      setSuggestions([]);
      return;
    }

    const results = getSuggestions(indexRef.current, prefix, { limit });
    setSuggestions(results);
  }, [prefix, minLength, limit]);

  return {
    prefix,
    setPrefix,
    suggestions,
    hasSuggestions: suggestions.length > 0
  };
}

/**
 * Search history hook
 */
export function useSearchHistory(options = {}) {
  const { maxItems = 20, storageKey = 'search_history' } = options;

  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const historyManager = useMemo(() => createSearchHistory(maxItems), [maxItems]);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(history));
    } catch {
      // Ignore storage errors
    }
  }, [history, storageKey]);

  // Initialize history manager
  useEffect(() => {
    history.forEach((h) => historyManager.add(h.query));
  }, []);

  const addToHistory = useCallback((query) => {
    if (!query.trim()) return;

    setHistory((prev) => {
      const filtered = prev.filter((h) => h.query !== query);
      return [{ query, timestamp: Date.now() }, ...filtered].slice(0, maxItems);
    });
  }, [maxItems]);

  const removeFromHistory = useCallback((query) => {
    setHistory((prev) => prev.filter((h) => h.query !== query));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory
  };
}

// Helper function
function getFieldValue(obj, path) {
  if (!obj || !path) return undefined;

  const keys = path.split('.');
  let value = obj;

  for (const key of keys) {
    if (value === null || value === undefined) return undefined;
    value = value[key];
  }

  return value;
}

export default {
  useSearch,
  useFacetedFilter,
  useRangeFilter,
  useSort,
  useSearchAndFilter,
  useSearchSuggestions,
  useSearchHistory
};
