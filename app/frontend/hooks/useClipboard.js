/**
 * Clipboard Hook
 * Provides clipboard read/write operations with fallback support
 */

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Check if clipboard API is supported
 */
export function isClipboardSupported() {
  return !!(navigator.clipboard && window.isSecureContext);
}

/**
 * Copy to clipboard hook
 */
export function useCopyToClipboard(options = {}) {
  const {
    successDuration = 2000,
    onSuccess,
    onError
  } = options;

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Copy text to clipboard
  const copy = useCallback(async (text) => {
    if (!text) {
      setError('コピーするテキストがありません');
      return false;
    }

    try {
      // Try modern clipboard API first
      if (isClipboardSupported()) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (!successful) {
          throw new Error('コピーに失敗しました');
        }
      }

      setCopied(true);
      setError(null);
      onSuccess?.(text);

      // Reset copied state after duration
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, successDuration);

      return true;
    } catch (err) {
      const errorMessage = err.message || 'クリップボードへのコピーに失敗しました';
      setError(errorMessage);
      setCopied(false);
      onError?.(err, errorMessage);
      return false;
    }
  }, [successDuration, onSuccess, onError]);

  // Copy rich text (HTML)
  const copyRichText = useCallback(async (html, plainText) => {
    try {
      if (isClipboardSupported() && navigator.clipboard.write) {
        const blob = new Blob([html], { type: 'text/html' });
        const textBlob = new Blob([plainText || html], { type: 'text/plain' });
        const clipboardItem = new ClipboardItem({
          'text/html': blob,
          'text/plain': textBlob
        });
        await navigator.clipboard.write([clipboardItem]);
      } else {
        // Fallback to plain text
        return copy(plainText || html);
      }

      setCopied(true);
      setError(null);
      onSuccess?.(html);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, successDuration);

      return true;
    } catch (err) {
      // Fallback to plain text copy
      return copy(plainText || html);
    }
  }, [copy, successDuration, onSuccess]);

  // Reset state
  const reset = useCallback(() => {
    setCopied(false);
    setError(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    copy,
    copyRichText,
    copied,
    error,
    reset,
    isSupported: isClipboardSupported()
  };
}

/**
 * Read from clipboard hook
 */
export function useReadClipboard(options = {}) {
  const { onSuccess, onError } = options;

  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const [isReading, setIsReading] = useState(false);

  // Read text from clipboard
  const readText = useCallback(async () => {
    setIsReading(true);
    setError(null);

    try {
      if (!isClipboardSupported()) {
        throw new Error('クリップボードAPIがサポートされていません');
      }

      const text = await navigator.clipboard.readText();
      setContent(text);
      onSuccess?.(text);
      return text;
    } catch (err) {
      const errorMessage = err.message || 'クリップボードの読み取りに失敗しました';
      setError(errorMessage);
      onError?.(err, errorMessage);
      return null;
    } finally {
      setIsReading(false);
    }
  }, [onSuccess, onError]);

  // Read clipboard items (for images, etc.)
  const readItems = useCallback(async () => {
    setIsReading(true);
    setError(null);

    try {
      if (!isClipboardSupported() || !navigator.clipboard.read) {
        throw new Error('クリップボードの読み取りがサポートされていません');
      }

      const items = await navigator.clipboard.read();
      const results = [];

      for (const item of items) {
        for (const type of item.types) {
          const blob = await item.getType(type);
          results.push({ type, blob });
        }
      }

      setContent(results);
      onSuccess?.(results);
      return results;
    } catch (err) {
      const errorMessage = err.message || 'クリップボードの読み取りに失敗しました';
      setError(errorMessage);
      onError?.(err, errorMessage);
      return null;
    } finally {
      setIsReading(false);
    }
  }, [onSuccess, onError]);

  // Clear state
  const clear = useCallback(() => {
    setContent(null);
    setError(null);
  }, []);

  return {
    content,
    error,
    isReading,
    readText,
    readItems,
    clear,
    isSupported: isClipboardSupported()
  };
}

/**
 * Paste handler hook (for paste events)
 */
export function usePasteHandler(options = {}) {
  const {
    onPasteText,
    onPasteImage,
    onPasteFiles,
    onPasteHtml,
    enabled = true,
    targetRef = null
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const handlePaste = (e) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // Handle files (including images)
      const files = Array.from(clipboardData.files);
      if (files.length > 0) {
        const imageFiles = files.filter((f) => f.type.startsWith('image/'));
        const otherFiles = files.filter((f) => !f.type.startsWith('image/'));

        if (imageFiles.length > 0 && onPasteImage) {
          e.preventDefault();
          onPasteImage(imageFiles);
        }

        if (otherFiles.length > 0 && onPasteFiles) {
          e.preventDefault();
          onPasteFiles(otherFiles);
        }

        return;
      }

      // Handle HTML
      const html = clipboardData.getData('text/html');
      if (html && onPasteHtml) {
        onPasteHtml(html);
      }

      // Handle plain text
      const text = clipboardData.getData('text/plain');
      if (text && onPasteText) {
        onPasteText(text);
      }
    };

    const target = targetRef?.current || document;
    target.addEventListener('paste', handlePaste);

    return () => {
      target.removeEventListener('paste', handlePaste);
    };
  }, [enabled, targetRef, onPasteText, onPasteImage, onPasteFiles, onPasteHtml]);
}

/**
 * Copy on selection hook
 */
export function useCopyOnSelect(options = {}) {
  const {
    enabled = false,
    onCopy
  } = options;

  const { copy } = useCopyToClipboard();

  useEffect(() => {
    if (!enabled) return;

    const handleMouseUp = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text) {
        copy(text);
        onCopy?.(text);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [enabled, copy, onCopy]);
}

/**
 * Clipboard history hook
 */
export function useClipboardHistory(maxItems = 10) {
  const [history, setHistory] = useState([]);

  // Add to history
  const addToHistory = useCallback((item) => {
    setHistory((prev) => {
      // Remove duplicates
      const filtered = prev.filter((h) => h.content !== item.content);
      // Add new item at beginning
      const newHistory = [
        { id: Date.now(), content: item.content, type: item.type || 'text', timestamp: new Date() },
        ...filtered
      ];
      // Limit to max items
      return newHistory.slice(0, maxItems);
    });
  }, [maxItems]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  // Remove item from history
  const removeFromHistory = useCallback((id) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  }, []);

  // Copy to clipboard hook with history
  const { copy, copied, error } = useCopyToClipboard({
    onSuccess: (text) => {
      addToHistory({ content: text, type: 'text' });
    }
  });

  return {
    history,
    copy,
    copied,
    error,
    addToHistory,
    clearHistory,
    removeFromHistory
  };
}

export default {
  useCopyToClipboard,
  useReadClipboard,
  usePasteHandler,
  useCopyOnSelect,
  useClipboardHistory,
  isClipboardSupported
};
