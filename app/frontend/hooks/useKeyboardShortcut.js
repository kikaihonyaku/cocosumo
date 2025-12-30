/**
 * Keyboard Shortcut Hook
 * Global keyboard shortcut management
 */

import { useEffect, useCallback, useRef, useState, createContext, useContext } from 'react';

// Modifier key detection
const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

/**
 * Parse shortcut string into key components
 * Supports formats like: "ctrl+k", "cmd+shift+p", "escape"
 */
function parseShortcut(shortcut) {
  const parts = shortcut.toLowerCase().split('+');
  const result = {
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
    key: ''
  };

  parts.forEach((part) => {
    switch (part) {
      case 'ctrl':
      case 'control':
        result.ctrl = true;
        break;
      case 'alt':
      case 'option':
        result.alt = true;
        break;
      case 'shift':
        result.shift = true;
        break;
      case 'meta':
      case 'cmd':
      case 'command':
        result.meta = true;
        break;
      case 'mod':
        // Cross-platform modifier (Cmd on Mac, Ctrl on Windows/Linux)
        if (isMac) {
          result.meta = true;
        } else {
          result.ctrl = true;
        }
        break;
      default:
        result.key = part;
    }
  });

  return result;
}

/**
 * Check if keyboard event matches shortcut
 */
function matchesShortcut(event, shortcut) {
  const parsed = typeof shortcut === 'string' ? parseShortcut(shortcut) : shortcut;

  // Check modifiers
  if (parsed.ctrl !== event.ctrlKey) return false;
  if (parsed.alt !== event.altKey) return false;
  if (parsed.shift !== event.shiftKey) return false;
  if (parsed.meta !== event.metaKey) return false;

  // Check key
  const eventKey = event.key.toLowerCase();
  const targetKey = parsed.key.toLowerCase();

  // Handle special keys
  const specialKeyMap = {
    'escape': 'escape',
    'esc': 'escape',
    'enter': 'enter',
    'return': 'enter',
    'space': ' ',
    'spacebar': ' ',
    'up': 'arrowup',
    'down': 'arrowdown',
    'left': 'arrowleft',
    'right': 'arrowright',
    'delete': 'delete',
    'backspace': 'backspace',
    'tab': 'tab'
  };

  const normalizedTarget = specialKeyMap[targetKey] || targetKey;
  const normalizedEvent = specialKeyMap[eventKey] || eventKey;

  return normalizedTarget === normalizedEvent;
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut) {
  const parsed = parseShortcut(shortcut);
  const parts = [];

  if (parsed.meta) parts.push(isMac ? '⌘' : 'Ctrl');
  if (parsed.ctrl && !parsed.meta) parts.push(isMac ? '⌃' : 'Ctrl');
  if (parsed.alt) parts.push(isMac ? '⌥' : 'Alt');
  if (parsed.shift) parts.push(isMac ? '⇧' : 'Shift');

  // Capitalize key
  const keyDisplay = {
    'escape': 'Esc',
    'enter': '↵',
    'space': 'Space',
    'arrowup': '↑',
    'arrowdown': '↓',
    'arrowleft': '←',
    'arrowright': '→',
    'backspace': '⌫',
    'delete': 'Del',
    'tab': 'Tab'
  };

  parts.push(keyDisplay[parsed.key] || parsed.key.toUpperCase());

  return parts.join(isMac ? '' : '+');
}

/**
 * Single keyboard shortcut hook
 * @param {string} shortcut - Shortcut string (e.g., "mod+k")
 * @param {Function} callback - Callback function
 * @param {object} options - Options
 */
export function useKeyboardShortcut(shortcut, callback, options = {}) {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = false,
    target = null, // null means window
    ignoreInputs = true
  } = options;

  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      // Ignore if focus is in input/textarea/contenteditable
      if (ignoreInputs) {
        const target = event.target;
        const tagName = target.tagName?.toLowerCase();
        if (
          tagName === 'input' ||
          tagName === 'textarea' ||
          tagName === 'select' ||
          target.isContentEditable
        ) {
          // Allow Escape in inputs
          if (event.key !== 'Escape') {
            return;
          }
        }
      }

      if (matchesShortcut(event, shortcut)) {
        if (preventDefault) {
          event.preventDefault();
        }
        if (stopPropagation) {
          event.stopPropagation();
        }
        callbackRef.current(event);
      }
    };

    const targetElement = target || window;
    targetElement.addEventListener('keydown', handleKeyDown);

    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcut, enabled, preventDefault, stopPropagation, target, ignoreInputs]);
}

/**
 * Multiple keyboard shortcuts hook
 * @param {object} shortcuts - Map of shortcut to callback
 * @param {object} options - Options
 */
export function useKeyboardShortcuts(shortcuts, options = {}) {
  const {
    enabled = true,
    preventDefault = true,
    ignoreInputs = true
  } = options;

  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      // Ignore if focus is in input/textarea
      if (ignoreInputs) {
        const target = event.target;
        const tagName = target.tagName?.toLowerCase();
        if (
          tagName === 'input' ||
          tagName === 'textarea' ||
          tagName === 'select' ||
          target.isContentEditable
        ) {
          if (event.key !== 'Escape') {
            return;
          }
        }
      }

      for (const [shortcut, callback] of Object.entries(shortcutsRef.current)) {
        if (matchesShortcut(event, shortcut)) {
          if (preventDefault) {
            event.preventDefault();
          }
          callback(event);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, preventDefault, ignoreInputs]);
}

/**
 * Keyboard shortcut context for global management
 */
const ShortcutContext = createContext(null);

export function ShortcutProvider({ children, shortcuts: initialShortcuts = {} }) {
  const [shortcuts, setShortcuts] = useState(initialShortcuts);
  const [helpOpen, setHelpOpen] = useState(false);

  // Register shortcut
  const registerShortcut = useCallback((id, config) => {
    setShortcuts((prev) => ({
      ...prev,
      [id]: config
    }));
  }, []);

  // Unregister shortcut
  const unregisterShortcut = useCallback((id) => {
    setShortcuts((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // Get all shortcuts for help display
  const getShortcutList = useCallback(() => {
    return Object.entries(shortcuts).map(([id, config]) => ({
      id,
      shortcut: config.shortcut,
      description: config.description,
      category: config.category || 'general',
      formatted: formatShortcut(config.shortcut)
    }));
  }, [shortcuts]);

  // Toggle help dialog
  const toggleHelp = useCallback(() => {
    setHelpOpen((prev) => !prev);
  }, []);

  // Handle all shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check for help shortcut (? or mod+/)
      if (
        (event.key === '?' && !event.ctrlKey && !event.metaKey) ||
        matchesShortcut(event, 'mod+/')
      ) {
        event.preventDefault();
        toggleHelp();
        return;
      }

      // Ignore if in input
      const target = event.target;
      const tagName = target.tagName?.toLowerCase();
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        target.isContentEditable
      ) {
        if (event.key !== 'Escape') {
          return;
        }
      }

      // Check registered shortcuts
      for (const [, config] of Object.entries(shortcuts)) {
        if (config.enabled !== false && matchesShortcut(event, config.shortcut)) {
          event.preventDefault();
          config.callback?.(event);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, toggleHelp]);

  const value = {
    shortcuts,
    registerShortcut,
    unregisterShortcut,
    getShortcutList,
    helpOpen,
    setHelpOpen,
    toggleHelp
  };

  return (
    <ShortcutContext.Provider value={value}>
      {children}
    </ShortcutContext.Provider>
  );
}

export function useShortcutContext() {
  const context = useContext(ShortcutContext);
  if (!context) {
    throw new Error('useShortcutContext must be used within ShortcutProvider');
  }
  return context;
}

/**
 * Register shortcut hook (for use with ShortcutProvider)
 */
export function useRegisterShortcut(id, config) {
  const { registerShortcut, unregisterShortcut } = useShortcutContext();

  useEffect(() => {
    registerShortcut(id, config);
    return () => unregisterShortcut(id);
  }, [id, config, registerShortcut, unregisterShortcut]);
}

export default {
  useKeyboardShortcut,
  useKeyboardShortcuts,
  ShortcutProvider,
  useShortcutContext,
  useRegisterShortcut,
  formatShortcut,
  parseShortcut
};
