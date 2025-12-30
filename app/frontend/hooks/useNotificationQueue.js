/**
 * Notification Queue Hooks
 * Unified notification state management
 */

import { useState, useEffect, useCallback, useRef, useMemo, createContext, useContext } from 'react';
import {
  createNotification,
  notificationPresets,
  NotificationType,
  NotificationPosition,
  createNotificationQueue,
  filterExpiredNotifications,
  groupNotificationsByPosition,
  createAriaLiveRegion,
  getNotificationAriaLabel,
  browserNotification
} from '../utils/notificationUtils';

/**
 * Notification Context
 */
const NotificationContext = createContext(null);

/**
 * Notification Provider Hook
 */
export function useNotificationProvider(options = {}) {
  const {
    maxQueue = 10,
    maxVisible = 5,
    defaultPosition = NotificationPosition.TOP_RIGHT,
    defaultDuration = 5000,
    enableBrowserNotifications = false
  } = options;

  const [notifications, setNotifications] = useState([]);
  const queueRef = useRef(null);
  const timersRef = useRef(new Map());
  const ariaRegionRef = useRef(null);

  // Initialize queue manager
  useEffect(() => {
    queueRef.current = createNotificationQueue({
      maxQueue,
      maxVisible,
      defaultPosition
    });

    // Subscribe to queue changes
    const unsubscribe = queueRef.current.subscribe(setNotifications);

    // Create ARIA live region
    ariaRegionRef.current = createAriaLiveRegion('polite');

    return () => {
      unsubscribe();
      ariaRegionRef.current?.remove();
      // Clear all timers
      timersRef.current.forEach(clearTimeout);
      timersRef.current.clear();
    };
  }, [maxQueue, maxVisible, defaultPosition]);

  // Setup auto-dismiss timers
  useEffect(() => {
    notifications.forEach((notification) => {
      // Skip if already has timer or shouldn't auto-dismiss
      if (timersRef.current.has(notification.id)) return;
      if (notification.duration === 0 || notification.isPaused) return;

      const timer = setTimeout(() => {
        dismiss(notification.id);
        timersRef.current.delete(notification.id);
      }, notification.remainingTime || notification.duration);

      timersRef.current.set(notification.id, timer);
    });

    // Cleanup timers for removed notifications
    const currentIds = new Set(notifications.map((n) => n.id));
    timersRef.current.forEach((timer, id) => {
      if (!currentIds.has(id)) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
    });
  }, [notifications]);

  // Show notification
  const show = useCallback((message, options = {}) => {
    const notification = createNotification(message, {
      duration: defaultDuration,
      position: defaultPosition,
      ...options
    });

    const id = queueRef.current?.add(notification);

    // Announce for screen readers
    ariaRegionRef.current?.announce(getNotificationAriaLabel(notification));

    // Show browser notification if enabled
    if (enableBrowserNotifications && notification.type !== NotificationType.LOADING) {
      const { title, body } = typeof message === 'object'
        ? { title: message.title, body: message.body || message.message }
        : { title: undefined, body: message };

      browserNotification.show(title || '通知', {
        body,
        tag: id
      });
    }

    return id;
  }, [defaultDuration, defaultPosition, enableBrowserNotifications]);

  // Dismiss notification
  const dismiss = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    return queueRef.current?.remove(id);
  }, []);

  // Update notification
  const update = useCallback((id, updates) => {
    // If duration changed, reset timer
    if (updates.duration !== undefined) {
      const timer = timersRef.current.get(id);
      if (timer) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
    }
    return queueRef.current?.update(id, updates);
  }, []);

  // Pause notification
  const pause = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    queueRef.current?.pause(id);
  }, []);

  // Resume notification
  const resume = useCallback((id) => {
    queueRef.current?.resume(id);
  }, []);

  // Clear notifications
  const clear = useCallback((position = null) => {
    const toClear = position
      ? notifications.filter((n) => n.position === position)
      : notifications;

    toClear.forEach((n) => {
      const timer = timersRef.current.get(n.id);
      if (timer) {
        clearTimeout(timer);
        timersRef.current.delete(n.id);
      }
    });

    queueRef.current?.clear(position);
  }, [notifications]);

  // Preset methods
  const success = useCallback((message, options = {}) => {
    return show(message, { ...options, type: NotificationType.SUCCESS });
  }, [show]);

  const error = useCallback((message, options = {}) => {
    return show(message, { ...options, type: NotificationType.ERROR, duration: 0 });
  }, [show]);

  const warning = useCallback((message, options = {}) => {
    return show(message, { ...options, type: NotificationType.WARNING, duration: 8000 });
  }, [show]);

  const info = useCallback((message, options = {}) => {
    return show(message, { ...options, type: NotificationType.INFO });
  }, [show]);

  const loading = useCallback((message, options = {}) => {
    return show(message, {
      ...options,
      type: NotificationType.LOADING,
      duration: 0,
      dismissible: false,
      showProgress: false
    });
  }, [show]);

  // Promise-based notification
  const promise = useCallback(async (promiseOrFn, messages = {}, options = {}) => {
    const loadingId = loading(messages.loading || '処理中...');

    try {
      const result = typeof promiseOrFn === 'function'
        ? await promiseOrFn()
        : await promiseOrFn;

      dismiss(loadingId);
      success(messages.success || '完了しました', options);

      return result;
    } catch (err) {
      dismiss(loadingId);
      error(messages.error || 'エラーが発生しました', options);

      throw err;
    }
  }, [loading, dismiss, success, error]);

  // Grouped notifications by position
  const groupedNotifications = useMemo(() => {
    return groupNotificationsByPosition(notifications);
  }, [notifications]);

  return {
    notifications,
    groupedNotifications,
    show,
    dismiss,
    update,
    pause,
    resume,
    clear,
    success,
    error,
    warning,
    info,
    loading,
    promise,
    hasNotifications: notifications.length > 0,
    count: notifications.length
  };
}

/**
 * Create Notification Context Provider
 */
export function createNotificationProvider(options = {}) {
  function NotificationProvider({ children }) {
    const notification = useNotificationProvider(options);

    return (
      <NotificationContext.Provider value={notification}>
        {children}
      </NotificationContext.Provider>
    );
  }

  return NotificationProvider;
}

/**
 * Use notification context
 */
export function useNotification() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }

  return context;
}

/**
 * Standalone notification queue hook
 */
export function useNotificationQueue(options = {}) {
  return useNotificationProvider(options);
}

/**
 * Single notification hook
 */
export function useSingleNotification(options = {}) {
  const { duration = 5000, onDismiss } = options;

  const [notification, setNotification] = useState(null);
  const timerRef = useRef(null);

  const show = useCallback((message, type = NotificationType.INFO, customDuration) => {
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const newNotification = createNotification(message, {
      type,
      duration: customDuration ?? duration
    });

    setNotification(newNotification);

    // Auto dismiss
    const dismissDuration = customDuration ?? duration;
    if (dismissDuration > 0) {
      timerRef.current = setTimeout(() => {
        setNotification(null);
        onDismiss?.();
      }, dismissDuration);
    }

    return newNotification.id;
  }, [duration, onDismiss]);

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setNotification(null);
    onDismiss?.();
  }, [onDismiss]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    notification,
    show,
    dismiss,
    success: (msg, dur) => show(msg, NotificationType.SUCCESS, dur),
    error: (msg, dur) => show(msg, NotificationType.ERROR, dur ?? 0),
    warning: (msg, dur) => show(msg, NotificationType.WARNING, dur ?? 8000),
    info: (msg, dur) => show(msg, NotificationType.INFO, dur),
    isVisible: notification !== null
  };
}

/**
 * Confirmation notification hook
 */
export function useConfirmationNotification() {
  const [state, setState] = useState({
    isOpen: false,
    message: '',
    title: '',
    confirmLabel: '確認',
    cancelLabel: 'キャンセル',
    type: 'warning'
  });

  const resolveRef = useRef(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;

      setState({
        isOpen: true,
        message: typeof options === 'string' ? options : options.message,
        title: options.title || '',
        confirmLabel: options.confirmLabel || '確認',
        cancelLabel: options.cancelLabel || 'キャンセル',
        type: options.type || 'warning'
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, []);

  const handleCancel = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);

  return {
    ...state,
    confirm,
    onConfirm: handleConfirm,
    onCancel: handleCancel
  };
}

/**
 * Snackbar-style notification hook
 */
export function useSnackbar(options = {}) {
  const { position = NotificationPosition.BOTTOM_CENTER, duration = 4000 } = options;

  const queue = useNotificationQueue({
    maxQueue: 3,
    maxVisible: 1,
    defaultPosition: position,
    defaultDuration: duration
  });

  const showSnackbar = useCallback((message, action = null) => {
    return queue.show(message, {
      position,
      duration,
      action,
      showProgress: false
    });
  }, [queue, position, duration]);

  return {
    ...queue,
    showSnackbar
  };
}

/**
 * Browser notification permission hook
 */
export function useBrowserNotification() {
  const [permission, setPermission] = useState(() =>
    browserNotification.getPermission()
  );

  const requestPermission = useCallback(async () => {
    const result = await browserNotification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const showNotification = useCallback((title, options = {}) => {
    if (permission !== 'granted') {
      return null;
    }
    return browserNotification.show(title, options);
  }, [permission]);

  return {
    permission,
    isSupported: browserNotification.isSupported(),
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    requestPermission,
    show: showNotification
  };
}

/**
 * Notification history hook
 */
export function useNotificationHistory(options = {}) {
  const { maxHistory = 50, persist = false, storageKey = 'notification_history' } = options;

  const [history, setHistory] = useState(() => {
    if (persist) {
      try {
        const stored = localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // Persist to localStorage
  useEffect(() => {
    if (persist) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(history));
      } catch {
        // Ignore storage errors
      }
    }
  }, [history, persist, storageKey]);

  const addToHistory = useCallback((notification) => {
    setHistory((prev) => {
      const entry = {
        id: notification.id,
        message: notification.message,
        type: notification.type,
        timestamp: notification.createdAt || Date.now(),
        read: false
      };

      return [entry, ...prev].slice(0, maxHistory);
    });
  }, [maxHistory]);

  const markAsRead = useCallback((id) => {
    setHistory((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, read: true } : entry
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setHistory((prev) =>
      prev.map((entry) => ({ ...entry, read: true }))
    );
  }, []);

  const removeFromHistory = useCallback((id) => {
    setHistory((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const unreadCount = useMemo(() => {
    return history.filter((entry) => !entry.read).length;
  }, [history]);

  return {
    history,
    addToHistory,
    markAsRead,
    markAllAsRead,
    removeFromHistory,
    clearHistory,
    unreadCount,
    hasUnread: unreadCount > 0
  };
}

export {
  NotificationContext,
  NotificationType,
  NotificationPosition
};

export default {
  useNotificationProvider,
  createNotificationProvider,
  useNotification,
  useNotificationQueue,
  useSingleNotification,
  useConfirmationNotification,
  useSnackbar,
  useBrowserNotification,
  useNotificationHistory,
  NotificationContext,
  NotificationType,
  NotificationPosition
};
