/**
 * Accessibility Hooks
 * Collection of hooks for improving accessibility
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/**
 * Screen reader announcement hook
 */
export function useAnnounce() {
  const announceRef = useRef(null);

  // Create announcer element on mount
  useEffect(() => {
    // Check if announcer already exists
    let announcer = document.getElementById('sr-announcer');

    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'sr-announcer';
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `;
      document.body.appendChild(announcer);
    }

    announceRef.current = announcer;

    return () => {
      // Don't remove - might be used by other components
    };
  }, []);

  // Announce message to screen readers
  const announce = useCallback((message, priority = 'polite') => {
    if (!announceRef.current || !message) return;

    // Set aria-live based on priority
    announceRef.current.setAttribute('aria-live', priority);

    // Clear and set message (forces re-announcement)
    announceRef.current.textContent = '';

    // Small delay to ensure screen readers pick up the change
    setTimeout(() => {
      if (announceRef.current) {
        announceRef.current.textContent = message;
      }
    }, 100);
  }, []);

  // Announce assertive (interrupts current speech)
  const announceAssertive = useCallback((message) => {
    announce(message, 'assertive');
  }, [announce]);

  // Announce polite (waits for current speech to finish)
  const announcePolite = useCallback((message) => {
    announce(message, 'polite');
  }, [announce]);

  return {
    announce,
    announceAssertive,
    announcePolite
  };
}

/**
 * Reduced motion preference hook
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (e) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * High contrast preference hook
 */
export function useHighContrast() {
  const [prefersHighContrast, setPrefersHighContrast] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-contrast: more)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');

    const handleChange = (e) => {
      setPrefersHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersHighContrast;
}

/**
 * Color scheme preference hook
 */
export function useColorSchemePreference() {
  const [colorScheme, setColorScheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      setColorScheme(e.matches ? 'dark' : 'light');
    };

    darkQuery.addEventListener('change', handleChange);
    return () => darkQuery.removeEventListener('change', handleChange);
  }, []);

  return colorScheme;
}

/**
 * ARIA attributes hook
 */
export function useAriaProps(options = {}) {
  const {
    role,
    label,
    labelledBy,
    describedBy,
    expanded,
    selected,
    checked,
    pressed,
    disabled,
    hidden,
    current,
    live,
    busy,
    controls,
    owns,
    hasPopup,
    level,
    valueNow,
    valueMin,
    valueMax,
    valueText
  } = options;

  return useMemo(() => {
    const props = {};

    if (role) props.role = role;
    if (label) props['aria-label'] = label;
    if (labelledBy) props['aria-labelledby'] = labelledBy;
    if (describedBy) props['aria-describedby'] = describedBy;
    if (expanded !== undefined) props['aria-expanded'] = expanded;
    if (selected !== undefined) props['aria-selected'] = selected;
    if (checked !== undefined) props['aria-checked'] = checked;
    if (pressed !== undefined) props['aria-pressed'] = pressed;
    if (disabled !== undefined) props['aria-disabled'] = disabled;
    if (hidden !== undefined) props['aria-hidden'] = hidden;
    if (current) props['aria-current'] = current;
    if (live) props['aria-live'] = live;
    if (busy !== undefined) props['aria-busy'] = busy;
    if (controls) props['aria-controls'] = controls;
    if (owns) props['aria-owns'] = owns;
    if (hasPopup) props['aria-haspopup'] = hasPopup;
    if (level !== undefined) props['aria-level'] = level;
    if (valueNow !== undefined) props['aria-valuenow'] = valueNow;
    if (valueMin !== undefined) props['aria-valuemin'] = valueMin;
    if (valueMax !== undefined) props['aria-valuemax'] = valueMax;
    if (valueText) props['aria-valuetext'] = valueText;

    return props;
  }, [
    role, label, labelledBy, describedBy, expanded, selected, checked,
    pressed, disabled, hidden, current, live, busy, controls, owns,
    hasPopup, level, valueNow, valueMin, valueMax, valueText
  ]);
}

/**
 * Skip link hook
 */
export function useSkipLink(targetId = 'main-content') {
  const skipToContent = useCallback(() => {
    const target = document.getElementById(targetId);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      // Remove tabindex after focus
      target.addEventListener('blur', () => {
        target.removeAttribute('tabindex');
      }, { once: true });
    }
  }, [targetId]);

  return {
    skipToContent,
    skipLinkProps: {
      href: `#${targetId}`,
      onClick: (e) => {
        e.preventDefault();
        skipToContent();
      }
    }
  };
}

/**
 * Keyboard navigation hook (for lists, grids, etc.)
 */
export function useKeyboardNavigation(options = {}) {
  const {
    items = [],
    orientation = 'vertical', // 'vertical', 'horizontal', 'both'
    loop = true,
    onSelect,
    onFocus
  } = options;

  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  // Handle keyboard events
  const handleKeyDown = useCallback((e) => {
    const { key } = e;
    let newIndex = activeIndex;
    let handled = false;

    // Vertical navigation
    if (orientation === 'vertical' || orientation === 'both') {
      if (key === 'ArrowDown') {
        newIndex = loop
          ? (activeIndex + 1) % items.length
          : Math.min(activeIndex + 1, items.length - 1);
        handled = true;
      } else if (key === 'ArrowUp') {
        newIndex = loop
          ? (activeIndex - 1 + items.length) % items.length
          : Math.max(activeIndex - 1, 0);
        handled = true;
      }
    }

    // Horizontal navigation
    if (orientation === 'horizontal' || orientation === 'both') {
      if (key === 'ArrowRight') {
        newIndex = loop
          ? (activeIndex + 1) % items.length
          : Math.min(activeIndex + 1, items.length - 1);
        handled = true;
      } else if (key === 'ArrowLeft') {
        newIndex = loop
          ? (activeIndex - 1 + items.length) % items.length
          : Math.max(activeIndex - 1, 0);
        handled = true;
      }
    }

    // Home/End
    if (key === 'Home') {
      newIndex = 0;
      handled = true;
    } else if (key === 'End') {
      newIndex = items.length - 1;
      handled = true;
    }

    // Enter/Space to select
    if (key === 'Enter' || key === ' ') {
      onSelect?.(items[activeIndex], activeIndex);
      handled = true;
    }

    if (handled) {
      e.preventDefault();
      setActiveIndex(newIndex);
      onFocus?.(items[newIndex], newIndex);
    }
  }, [activeIndex, items, orientation, loop, onSelect, onFocus]);

  // Get item props
  const getItemProps = useCallback((index) => ({
    tabIndex: index === activeIndex ? 0 : -1,
    'aria-selected': index === activeIndex,
    onKeyDown: handleKeyDown,
    onClick: () => {
      setActiveIndex(index);
      onSelect?.(items[index], index);
    },
    onFocus: () => {
      setActiveIndex(index);
      onFocus?.(items[index], index);
    }
  }), [activeIndex, items, handleKeyDown, onSelect, onFocus]);

  return {
    activeIndex,
    setActiveIndex,
    containerRef,
    getItemProps,
    containerProps: {
      ref: containerRef,
      role: 'listbox',
      'aria-orientation': orientation === 'both' ? undefined : orientation,
      onKeyDown: handleKeyDown
    }
  };
}

/**
 * Roving tabindex hook
 */
export function useRovingTabIndex(itemCount, options = {}) {
  const { initialIndex = 0, loop = true } = options;

  const [focusIndex, setFocusIndex] = useState(initialIndex);
  const itemRefs = useRef([]);

  // Focus item at index
  const focusItem = useCallback((index) => {
    const item = itemRefs.current[index];
    if (item) {
      item.focus();
      setFocusIndex(index);
    }
  }, []);

  // Move focus
  const moveFocus = useCallback((direction) => {
    let newIndex = focusIndex + direction;

    if (loop) {
      newIndex = (newIndex + itemCount) % itemCount;
    } else {
      newIndex = Math.max(0, Math.min(newIndex, itemCount - 1));
    }

    focusItem(newIndex);
  }, [focusIndex, itemCount, loop, focusItem]);

  // Get ref setter for item
  const getItemRef = useCallback((index) => (el) => {
    itemRefs.current[index] = el;
  }, []);

  // Get tabIndex for item
  const getTabIndex = useCallback((index) => {
    return index === focusIndex ? 0 : -1;
  }, [focusIndex]);

  return {
    focusIndex,
    setFocusIndex,
    focusItem,
    moveFocus,
    getItemRef,
    getTabIndex,
    focusFirst: () => focusItem(0),
    focusLast: () => focusItem(itemCount - 1),
    focusNext: () => moveFocus(1),
    focusPrevious: () => moveFocus(-1)
  };
}

/**
 * Live region hook (for dynamic content updates)
 */
export function useLiveRegion(options = {}) {
  const {
    politeness = 'polite', // 'polite', 'assertive', 'off'
    atomic = true,
    relevant = 'additions text' // 'additions', 'removals', 'text', 'all'
  } = options;

  const regionRef = useRef(null);
  const [content, setContent] = useState('');

  const liveRegionProps = useMemo(() => ({
    ref: regionRef,
    'aria-live': politeness,
    'aria-atomic': atomic,
    'aria-relevant': relevant,
    role: politeness === 'assertive' ? 'alert' : 'status'
  }), [politeness, atomic, relevant]);

  // Update content
  const updateContent = useCallback((newContent) => {
    setContent(newContent);
  }, []);

  // Clear content
  const clearContent = useCallback(() => {
    setContent('');
  }, []);

  return {
    content,
    updateContent,
    clearContent,
    liveRegionProps,
    regionRef
  };
}

export default {
  useAnnounce,
  useReducedMotion,
  useHighContrast,
  useColorSchemePreference,
  useAriaProps,
  useSkipLink,
  useKeyboardNavigation,
  useRovingTabIndex,
  useLiveRegion
};
