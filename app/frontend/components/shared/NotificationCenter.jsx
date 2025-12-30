/**
 * NotificationCenter Component
 * Unified notification display component
 */

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Box, Paper, Typography, IconButton, LinearProgress, Button, Fade, Slide, Collapse } from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as LoadingIcon
} from '@mui/icons-material';
import {
  NotificationType,
  NotificationPosition,
  getNotificationColor,
  formatNotificationMessage
} from '../../utils/notificationUtils';
import { useNotification, useNotificationQueue } from '../../hooks/useNotificationQueue';

/**
 * Single notification item component
 */
function NotificationItem({
  notification,
  onDismiss,
  onPause,
  onResume,
  style = {}
}) {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  const colors = useMemo(() => getNotificationColor(notification.type), [notification.type]);
  const { title, body } = useMemo(
    () => formatNotificationMessage(notification.message),
    [notification.message]
  );

  // Progress animation
  useEffect(() => {
    if (!notification.showProgress || notification.duration === 0 || isPaused) {
      return;
    }

    const startTime = Date.now();
    const duration = notification.remainingTime || notification.duration;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [notification, isPaused]);

  // Pause on hover
  const handleMouseEnter = useCallback(() => {
    if (notification.pauseOnHover && notification.duration > 0) {
      setIsPaused(true);
      onPause?.(notification.id);
    }
  }, [notification, onPause]);

  const handleMouseLeave = useCallback(() => {
    if (notification.pauseOnHover && notification.duration > 0) {
      setIsPaused(false);
      onResume?.(notification.id);
    }
  }, [notification, onResume]);

  // Get icon
  const IconComponent = useMemo(() => {
    if (notification.icon) return notification.icon;

    const icons = {
      [NotificationType.SUCCESS]: SuccessIcon,
      [NotificationType.ERROR]: ErrorIcon,
      [NotificationType.WARNING]: WarningIcon,
      [NotificationType.INFO]: InfoIcon,
      [NotificationType.LOADING]: LoadingIcon
    };

    return icons[notification.type] || InfoIcon;
  }, [notification.type, notification.icon]);

  return (
    <Paper
      elevation={4}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="alert"
      aria-live="polite"
      sx={{
        position: 'relative',
        minWidth: 300,
        maxWidth: 400,
        overflow: 'hidden',
        bgcolor: colors.bgLight,
        borderLeft: `4px solid ${colors.bg}`,
        ...style
      }}
      className={notification.className}
    >
      <Box sx={{ p: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        {/* Icon */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            mt: 0.25
          }}
        >
          <IconComponent
            sx={{
              color: colors.bg,
              fontSize: 24,
              animation: notification.type === NotificationType.LOADING
                ? 'spin 1s linear infinite'
                : 'none',
              '@keyframes spin': {
                from: { transform: 'rotate(0deg)' },
                to: { transform: 'rotate(360deg)' }
              }
            }}
          />
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {title && (
            <Typography
              variant="subtitle2"
              sx={{ color: colors.text, fontWeight: 600, mb: 0.25 }}
            >
              {title}
            </Typography>
          )}
          <Typography
            variant="body2"
            sx={{ color: colors.text, wordBreak: 'break-word' }}
          >
            {body}
          </Typography>

          {/* Action button */}
          {notification.action && (
            <Button
              size="small"
              onClick={notification.action.onClick}
              sx={{
                mt: 1,
                color: colors.bg,
                textTransform: 'none',
                fontWeight: 600,
                p: 0,
                minWidth: 'auto',
                '&:hover': {
                  bgcolor: 'transparent',
                  textDecoration: 'underline'
                }
              }}
            >
              {notification.action.label}
            </Button>
          )}
        </Box>

        {/* Close button */}
        {notification.dismissible && (
          <IconButton
            size="small"
            onClick={() => onDismiss(notification.id)}
            aria-label="通知を閉じる"
            sx={{
              flexShrink: 0,
              color: colors.text,
              opacity: 0.7,
              '&:hover': {
                opacity: 1,
                bgcolor: `${colors.bg}20`
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Progress bar */}
      {notification.showProgress && notification.duration > 0 && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 3,
            bgcolor: 'transparent',
            '& .MuiLinearProgress-bar': {
              bgcolor: colors.bg
            }
          }}
        />
      )}
    </Paper>
  );
}

/**
 * Notification container for a specific position
 */
function NotificationContainer({ position, notifications, onDismiss, onPause, onResume }) {
  const positionStyles = useMemo(() => {
    const styles = {
      position: 'fixed',
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      zIndex: 9999,
      pointerEvents: 'none',
      '& > *': {
        pointerEvents: 'auto'
      }
    };

    // Position-specific styles
    switch (position) {
      case NotificationPosition.TOP_LEFT:
        return { ...styles, top: 16, left: 16, alignItems: 'flex-start' };
      case NotificationPosition.TOP_CENTER:
        return { ...styles, top: 16, left: '50%', transform: 'translateX(-50%)', alignItems: 'center' };
      case NotificationPosition.TOP_RIGHT:
        return { ...styles, top: 16, right: 16, alignItems: 'flex-end' };
      case NotificationPosition.BOTTOM_LEFT:
        return { ...styles, bottom: 16, left: 16, alignItems: 'flex-start', flexDirection: 'column-reverse' };
      case NotificationPosition.BOTTOM_CENTER:
        return { ...styles, bottom: 16, left: '50%', transform: 'translateX(-50%)', alignItems: 'center', flexDirection: 'column-reverse' };
      case NotificationPosition.BOTTOM_RIGHT:
        return { ...styles, bottom: 16, right: 16, alignItems: 'flex-end', flexDirection: 'column-reverse' };
      default:
        return { ...styles, top: 16, right: 16, alignItems: 'flex-end' };
    }
  }, [position]);

  // Determine slide direction
  const slideDirection = useMemo(() => {
    if (position.includes('left')) return 'right';
    if (position.includes('right')) return 'left';
    if (position.includes('top')) return 'down';
    return 'up';
  }, [position]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Box sx={positionStyles}>
      {notifications.map((notification, index) => (
        <Slide
          key={notification.id}
          direction={slideDirection}
          in={true}
          mountOnEnter
          unmountOnExit
        >
          <Box>
            <NotificationItem
              notification={notification}
              onDismiss={onDismiss}
              onPause={onPause}
              onResume={onResume}
            />
          </Box>
        </Slide>
      ))}
    </Box>
  );
}

/**
 * Main NotificationCenter component
 * Renders all notification containers for each position
 */
export function NotificationCenter({
  notifications: externalNotifications,
  onDismiss: externalOnDismiss,
  useContext = true
}) {
  // Try to use context, fall back to props
  let contextValue = null;
  try {
    if (useContext) {
      contextValue = useNotification();
    }
  } catch {
    // Not in provider, use props
  }

  const notifications = contextValue?.notifications || externalNotifications || [];
  const groupedNotifications = contextValue?.groupedNotifications || {};
  const onDismiss = contextValue?.dismiss || externalOnDismiss || (() => {});
  const onPause = contextValue?.pause;
  const onResume = contextValue?.resume;

  // Group notifications by position if not already grouped
  const grouped = useMemo(() => {
    if (Object.keys(groupedNotifications).length > 0) {
      return groupedNotifications;
    }

    const result = {};
    Object.values(NotificationPosition).forEach((pos) => {
      result[pos] = [];
    });

    notifications.forEach((notification) => {
      const pos = notification.position || NotificationPosition.TOP_RIGHT;
      if (!result[pos]) result[pos] = [];
      result[pos].push(notification);
    });

    return result;
  }, [notifications, groupedNotifications]);

  return (
    <>
      {Object.entries(grouped).map(([position, positionNotifications]) => (
        <NotificationContainer
          key={position}
          position={position}
          notifications={positionNotifications}
          onDismiss={onDismiss}
          onPause={onPause}
          onResume={onResume}
        />
      ))}
    </>
  );
}

/**
 * Standalone notification center with internal state
 */
export function StandaloneNotificationCenter(props) {
  const queue = useNotificationQueue(props);

  return (
    <>
      <NotificationCenter
        notifications={queue.notifications}
        onDismiss={queue.dismiss}
        useContext={false}
      />
    </>
  );
}

/**
 * Simple toast component for quick notifications
 */
export function Toast({ message, type = NotificationType.INFO, duration = 5000, onClose }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setOpen(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const colors = getNotificationColor(type);

  return (
    <Fade in={open}>
      <Paper
        elevation={4}
        sx={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          px: 3,
          py: 1.5,
          bgcolor: colors.bg,
          color: 'white',
          borderRadius: 2,
          zIndex: 9999
        }}
      >
        <Typography variant="body2">{message}</Typography>
      </Paper>
    </Fade>
  );
}

/**
 * Snackbar component
 */
export function Snackbar({
  open,
  message,
  action,
  onClose,
  duration = 4000,
  position = NotificationPosition.BOTTOM_CENTER
}) {
  useEffect(() => {
    if (open && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose]);

  const positionStyles = useMemo(() => {
    switch (position) {
      case NotificationPosition.BOTTOM_LEFT:
        return { bottom: 24, left: 24 };
      case NotificationPosition.BOTTOM_RIGHT:
        return { bottom: 24, right: 24 };
      case NotificationPosition.TOP_CENTER:
        return { top: 24, left: '50%', transform: 'translateX(-50%)' };
      default:
        return { bottom: 24, left: '50%', transform: 'translateX(-50%)' };
    }
  }, [position]);

  return (
    <Slide direction="up" in={open} mountOnEnter unmountOnExit>
      <Paper
        elevation={6}
        sx={{
          position: 'fixed',
          ...positionStyles,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 2,
          py: 1,
          bgcolor: '#323232',
          color: 'white',
          borderRadius: 1,
          zIndex: 9999,
          minWidth: 288,
          maxWidth: 568
        }}
      >
        <Typography variant="body2" sx={{ flex: 1 }}>
          {message}
        </Typography>

        {action && (
          <Button
            size="small"
            onClick={action.onClick}
            sx={{
              color: '#90caf9',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {action.label}
          </Button>
        )}

        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color: 'rgba(255,255,255,0.7)' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Paper>
    </Slide>
  );
}

/**
 * Confirmation dialog notification
 */
export function ConfirmationNotification({
  open,
  title,
  message,
  confirmLabel = '確認',
  cancelLabel = 'キャンセル',
  type = 'warning',
  onConfirm,
  onCancel
}) {
  const colors = getNotificationColor(
    type === 'warning' ? NotificationType.WARNING : NotificationType.INFO
  );

  return (
    <Fade in={open}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 3,
            maxWidth: 400,
            width: '90%',
            borderTop: `4px solid ${colors.bg}`
          }}
        >
          {title && (
            <Typography variant="h6" sx={{ mb: 1, color: colors.text }}>
              {title}
            </Typography>
          )}
          <Typography variant="body1" sx={{ mb: 3 }}>
            {message}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={onCancel} color="inherit">
              {cancelLabel}
            </Button>
            <Button
              onClick={onConfirm}
              variant="contained"
              sx={{ bgcolor: colors.bg, '&:hover': { bgcolor: colors.border } }}
            >
              {confirmLabel}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Fade>
  );
}

export default NotificationCenter;
