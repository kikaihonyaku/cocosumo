/**
 * Notification Utilities
 * Unified notification management and display logic
 */

/**
 * Notification types
 */
export const NotificationType = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  LOADING: 'loading'
};

/**
 * Notification position
 */
export const NotificationPosition = {
  TOP_LEFT: 'top-left',
  TOP_CENTER: 'top-center',
  TOP_RIGHT: 'top-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_CENTER: 'bottom-center',
  BOTTOM_RIGHT: 'bottom-right'
};

/**
 * Default notification options
 */
export const defaultNotificationOptions = {
  type: NotificationType.INFO,
  duration: 5000,
  dismissible: true,
  position: NotificationPosition.TOP_RIGHT,
  pauseOnHover: true,
  showProgress: true,
  icon: null,
  action: null,
  onClose: null,
  className: ''
};

/**
 * Generate unique notification ID
 */
let notificationIdCounter = 0;
export function generateNotificationId() {
  return `notification-${Date.now()}-${++notificationIdCounter}`;
}

/**
 * Create notification object
 */
export function createNotification(message, options = {}) {
  const mergedOptions = { ...defaultNotificationOptions, ...options };

  return {
    id: generateNotificationId(),
    message,
    type: mergedOptions.type,
    duration: mergedOptions.duration,
    dismissible: mergedOptions.dismissible,
    position: mergedOptions.position,
    pauseOnHover: mergedOptions.pauseOnHover,
    showProgress: mergedOptions.showProgress,
    icon: mergedOptions.icon,
    action: mergedOptions.action,
    onClose: mergedOptions.onClose,
    className: mergedOptions.className,
    createdAt: Date.now(),
    isPaused: false,
    remainingTime: mergedOptions.duration
  };
}

/**
 * Notification presets for common use cases
 */
export const notificationPresets = {
  success: (message, options = {}) =>
    createNotification(message, { ...options, type: NotificationType.SUCCESS }),

  error: (message, options = {}) =>
    createNotification(message, {
      ...options,
      type: NotificationType.ERROR,
      duration: options.duration ?? 0 // Errors don't auto-dismiss by default
    }),

  warning: (message, options = {}) =>
    createNotification(message, {
      ...options,
      type: NotificationType.WARNING,
      duration: options.duration ?? 8000
    }),

  info: (message, options = {}) =>
    createNotification(message, { ...options, type: NotificationType.INFO }),

  loading: (message, options = {}) =>
    createNotification(message, {
      ...options,
      type: NotificationType.LOADING,
      duration: 0, // Loading notifications don't auto-dismiss
      dismissible: false,
      showProgress: false
    })
};

/**
 * Get icon for notification type
 */
export function getNotificationIcon(type) {
  const icons = {
    [NotificationType.SUCCESS]: '✓',
    [NotificationType.ERROR]: '✕',
    [NotificationType.WARNING]: '⚠',
    [NotificationType.INFO]: 'ℹ',
    [NotificationType.LOADING]: '⟳'
  };

  return icons[type] || icons[NotificationType.INFO];
}

/**
 * Get color for notification type
 */
export function getNotificationColor(type) {
  const colors = {
    [NotificationType.SUCCESS]: {
      bg: '#10B981',
      bgLight: '#D1FAE5',
      text: '#065F46',
      border: '#34D399'
    },
    [NotificationType.ERROR]: {
      bg: '#EF4444',
      bgLight: '#FEE2E2',
      text: '#991B1B',
      border: '#F87171'
    },
    [NotificationType.WARNING]: {
      bg: '#F59E0B',
      bgLight: '#FEF3C7',
      text: '#92400E',
      border: '#FBBF24'
    },
    [NotificationType.INFO]: {
      bg: '#3B82F6',
      bgLight: '#DBEAFE',
      text: '#1E40AF',
      border: '#60A5FA'
    },
    [NotificationType.LOADING]: {
      bg: '#6B7280',
      bgLight: '#F3F4F6',
      text: '#374151',
      border: '#9CA3AF'
    }
  };

  return colors[type] || colors[NotificationType.INFO];
}

/**
 * Format notification message
 */
export function formatNotificationMessage(message) {
  if (typeof message === 'string') {
    return { title: null, body: message };
  }

  if (typeof message === 'object') {
    return {
      title: message.title || null,
      body: message.body || message.message || ''
    };
  }

  return { title: null, body: String(message) };
}

/**
 * Group notifications by position
 */
export function groupNotificationsByPosition(notifications) {
  const groups = {};

  Object.values(NotificationPosition).forEach((position) => {
    groups[position] = [];
  });

  notifications.forEach((notification) => {
    const position = notification.position || NotificationPosition.TOP_RIGHT;
    if (!groups[position]) {
      groups[position] = [];
    }
    groups[position].push(notification);
  });

  return groups;
}

/**
 * Calculate notification stack positions
 */
export function calculateStackPositions(notifications, options = {}) {
  const { gap = 12, maxVisible = 5 } = options;

  return notifications.slice(0, maxVisible).map((notification, index) => ({
    ...notification,
    stackIndex: index,
    offsetY: index * (64 + gap), // Assuming base height of 64px
    isVisible: index < maxVisible,
    opacity: index < maxVisible ? 1 - index * 0.1 : 0,
    scale: index < maxVisible ? 1 - index * 0.02 : 0.9
  }));
}

/**
 * Sort notifications by priority and time
 */
export function sortNotifications(notifications, options = {}) {
  const { priorityOrder = ['error', 'warning', 'success', 'info', 'loading'] } = options;

  return [...notifications].sort((a, b) => {
    // Sort by priority first
    const priorityA = priorityOrder.indexOf(a.type);
    const priorityB = priorityOrder.indexOf(b.type);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Then by creation time (newest first)
    return b.createdAt - a.createdAt;
  });
}

/**
 * Filter expired notifications
 */
export function filterExpiredNotifications(notifications) {
  const now = Date.now();

  return notifications.filter((notification) => {
    if (notification.duration === 0) return true; // Never expires
    if (notification.isPaused) return true; // Paused notifications don't expire

    const elapsed = now - notification.createdAt;
    return elapsed < notification.duration;
  });
}

/**
 * Create notification queue manager
 */
export function createNotificationQueue(options = {}) {
  const {
    maxQueue = 10,
    maxVisible = 3,
    defaultPosition = NotificationPosition.TOP_RIGHT
  } = options;

  let notifications = [];
  let listeners = [];

  const notify = () => {
    listeners.forEach((listener) => listener([...notifications]));
  };

  return {
    add: (notification) => {
      // Remove excess notifications
      if (notifications.length >= maxQueue) {
        notifications = notifications.slice(-(maxQueue - 1));
      }

      const newNotification = {
        ...notification,
        position: notification.position || defaultPosition
      };

      notifications.push(newNotification);
      notify();

      return newNotification.id;
    },

    remove: (id) => {
      const index = notifications.findIndex((n) => n.id === id);
      if (index !== -1) {
        const [removed] = notifications.splice(index, 1);
        removed.onClose?.();
        notify();
        return true;
      }
      return false;
    },

    update: (id, updates) => {
      const index = notifications.findIndex((n) => n.id === id);
      if (index !== -1) {
        notifications[index] = { ...notifications[index], ...updates };
        notify();
        return true;
      }
      return false;
    },

    pause: (id) => {
      const index = notifications.findIndex((n) => n.id === id);
      if (index !== -1) {
        const elapsed = Date.now() - notifications[index].createdAt;
        notifications[index].isPaused = true;
        notifications[index].remainingTime = Math.max(
          0,
          notifications[index].duration - elapsed
        );
        notify();
      }
    },

    resume: (id) => {
      const index = notifications.findIndex((n) => n.id === id);
      if (index !== -1) {
        notifications[index].isPaused = false;
        notifications[index].createdAt = Date.now() - (
          notifications[index].duration - notifications[index].remainingTime
        );
        notify();
      }
    },

    clear: (position = null) => {
      if (position) {
        notifications = notifications.filter((n) => n.position !== position);
      } else {
        notifications.forEach((n) => n.onClose?.());
        notifications = [];
      }
      notify();
    },

    getAll: () => [...notifications],

    getByPosition: (position) =>
      notifications.filter((n) => n.position === position),

    subscribe: (listener) => {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter((l) => l !== listener);
      };
    }
  };
}

/**
 * Toast helper functions
 */
export const toast = {
  success: (message, options) =>
    notificationPresets.success(message, options),

  error: (message, options) =>
    notificationPresets.error(message, options),

  warning: (message, options) =>
    notificationPresets.warning(message, options),

  info: (message, options) =>
    notificationPresets.info(message, options),

  loading: (message, options) =>
    notificationPresets.loading(message, options),

  promise: async (promise, messages, options = {}) => {
    const loadingNotification = notificationPresets.loading(
      messages.loading || '処理中...',
      options
    );

    try {
      const result = await promise;
      return {
        notification: notificationPresets.success(
          messages.success || '完了しました',
          options
        ),
        result
      };
    } catch (error) {
      return {
        notification: notificationPresets.error(
          messages.error || 'エラーが発生しました',
          options
        ),
        error
      };
    }
  },

  custom: (message, options) =>
    createNotification(message, options)
};

/**
 * Notification accessibility helpers
 */
export function createAriaLiveRegion(priority = 'polite') {
  const region = document.createElement('div');
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', priority);
  region.setAttribute('aria-atomic', 'true');
  region.className = 'sr-only';
  region.style.cssText = `
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

  document.body.appendChild(region);

  return {
    announce: (message) => {
      region.textContent = '';
      // Force reflow for screen readers
      void region.offsetHeight;
      region.textContent = message;
    },
    remove: () => {
      region.remove();
    }
  };
}

/**
 * Get notification aria label
 */
export function getNotificationAriaLabel(notification) {
  const typeLabels = {
    [NotificationType.SUCCESS]: '成功',
    [NotificationType.ERROR]: 'エラー',
    [NotificationType.WARNING]: '警告',
    [NotificationType.INFO]: '情報',
    [NotificationType.LOADING]: '読み込み中'
  };

  const typeLabel = typeLabels[notification.type] || '通知';
  const { title, body } = formatNotificationMessage(notification.message);

  return `${typeLabel}: ${title ? `${title} - ` : ''}${body}`;
}

/**
 * Browser notification support
 */
export const browserNotification = {
  isSupported: () => 'Notification' in window,

  getPermission: () => {
    if (!browserNotification.isSupported()) return 'unsupported';
    return Notification.permission;
  },

  requestPermission: async () => {
    if (!browserNotification.isSupported()) {
      return 'unsupported';
    }

    const permission = await Notification.requestPermission();
    return permission;
  },

  show: (title, options = {}) => {
    if (!browserNotification.isSupported()) return null;
    if (Notification.permission !== 'granted') return null;

    const notification = new Notification(title, {
      icon: options.icon || '/favicon.ico',
      body: options.body,
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false
    });

    if (options.onClick) {
      notification.onclick = options.onClick;
    }

    if (options.onClose) {
      notification.onclose = options.onClose;
    }

    if (options.duration && options.duration > 0) {
      setTimeout(() => notification.close(), options.duration);
    }

    return notification;
  }
};

export default {
  NotificationType,
  NotificationPosition,
  defaultNotificationOptions,
  generateNotificationId,
  createNotification,
  notificationPresets,
  getNotificationIcon,
  getNotificationColor,
  formatNotificationMessage,
  groupNotificationsByPosition,
  calculateStackPositions,
  sortNotifications,
  filterExpiredNotifications,
  createNotificationQueue,
  toast,
  createAriaLiveRegion,
  getNotificationAriaLabel,
  browserNotification
};
