/**
 * Focus Trap Hook
 * Traps focus within a container (for modals, dialogs, etc.)
 */

import { useEffect, useRef, useCallback } from 'react';

// Focusable element selectors
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]',
  'audio[controls]',
  'video[controls]',
  'details > summary'
].join(',');

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container) {
  if (!container) return [];

  const elements = Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS));

  return elements.filter((el) => {
    // Check visibility
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }

    // Check if element or ancestor is hidden
    if (el.closest('[hidden]') || el.closest('[aria-hidden="true"]')) {
      return false;
    }

    return true;
  });
}

/**
 * Focus trap hook
 */
export function useFocusTrap(options = {}) {
  const {
    enabled = true,
    autoFocus = true,
    restoreFocus = true,
    initialFocus = null, // Selector or ref for initial focus
    finalFocus = null, // Selector or ref for focus after trap is disabled
    escapeDeactivates = true,
    onEscape
  } = options;

  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Store previous focus when trap is enabled
  useEffect(() => {
    if (enabled) {
      previousFocusRef.current = document.activeElement;
    }
  }, [enabled]);

  // Handle initial focus
  useEffect(() => {
    if (!enabled || !autoFocus) return;

    const container = containerRef.current;
    if (!container) return;

    // Small delay to ensure container is rendered
    const timer = setTimeout(() => {
      let elementToFocus = null;

      // Check for initial focus element
      if (initialFocus) {
        if (typeof initialFocus === 'string') {
          elementToFocus = container.querySelector(initialFocus);
        } else if (initialFocus.current) {
          elementToFocus = initialFocus.current;
        }
      }

      // Default to first focusable element
      if (!elementToFocus) {
        const focusable = getFocusableElements(container);
        elementToFocus = focusable[0];
      }

      if (elementToFocus) {
        elementToFocus.focus();
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [enabled, autoFocus, initialFocus]);

  // Handle focus restoration
  useEffect(() => {
    if (!restoreFocus) return;

    return () => {
      if (!enabled) return;

      // Restore focus when trap is disabled
      let elementToFocus = null;

      if (finalFocus) {
        if (typeof finalFocus === 'string') {
          elementToFocus = document.querySelector(finalFocus);
        } else if (finalFocus.current) {
          elementToFocus = finalFocus.current;
        }
      }

      if (!elementToFocus && previousFocusRef.current) {
        elementToFocus = previousFocusRef.current;
      }

      if (elementToFocus && typeof elementToFocus.focus === 'function') {
        // Small delay to ensure DOM updates
        setTimeout(() => {
          elementToFocus.focus();
        }, 0);
      }
    };
  }, [enabled, restoreFocus, finalFocus]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e) => {
      // Handle Escape
      if (e.key === 'Escape' && escapeDeactivates) {
        onEscape?.(e);
        return;
      }

      // Handle Tab
      if (e.key !== 'Tab') return;

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) return;

      const firstFocusable = focusable[0];
      const lastFocusable = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      // Shift + Tab
      if (e.shiftKey) {
        if (activeElement === firstFocusable || !container.contains(activeElement)) {
          e.preventDefault();
          lastFocusable.focus();
        }
      }
      // Tab
      else {
        if (activeElement === lastFocusable || !container.contains(activeElement)) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    // Handle focus leaving container
    const handleFocusIn = (e) => {
      if (!container.contains(e.target)) {
        const focusable = getFocusableElements(container);
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [enabled, escapeDeactivates, onEscape]);

  // Focus first element
  const focusFirst = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusable = getFocusableElements(container);
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }, []);

  // Focus last element
  const focusLast = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusable = getFocusableElements(container);
    if (focusable.length > 0) {
      focusable[focusable.length - 1].focus();
    }
  }, []);

  // Focus specific element
  const focusElement = useCallback((selector) => {
    const container = containerRef.current;
    if (!container) return;

    const element = typeof selector === 'string'
      ? container.querySelector(selector)
      : selector;

    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }, []);

  return {
    containerRef,
    focusFirst,
    focusLast,
    focusElement,
    getFocusableElements: () => getFocusableElements(containerRef.current)
  };
}

/**
 * Simple focus trap for modals
 */
export function useModalFocusTrap(isOpen, options = {}) {
  return useFocusTrap({
    enabled: isOpen,
    autoFocus: true,
    restoreFocus: true,
    escapeDeactivates: true,
    ...options
  });
}

/**
 * Focus manager for complex UIs
 */
export function useFocusManager() {
  const focusHistoryRef = useRef([]);

  // Push focus to history
  const pushFocus = useCallback(() => {
    focusHistoryRef.current.push(document.activeElement);
  }, []);

  // Pop and restore focus
  const popFocus = useCallback(() => {
    const element = focusHistoryRef.current.pop();
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }, []);

  // Focus element and push current to history
  const moveFocus = useCallback((element) => {
    pushFocus();
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }, [pushFocus]);

  // Clear focus history
  const clearHistory = useCallback(() => {
    focusHistoryRef.current = [];
  }, []);

  return {
    pushFocus,
    popFocus,
    moveFocus,
    clearHistory,
    historyLength: focusHistoryRef.current.length
  };
}

export default {
  useFocusTrap,
  useModalFocusTrap,
  useFocusManager,
  getFocusableElements,
  FOCUSABLE_SELECTORS
};
