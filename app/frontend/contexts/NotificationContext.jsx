/**
 * Notification Context
 * Global notification management for persistent alerts and confirmations
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
  AlertTitle,
  Box,
  Collapse,
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

// Notification types
export const NOTIFICATION_TYPES = {
  ALERT: 'alert',
  CONFIRM: 'confirm',
  PROMPT: 'prompt',
  BANNER: 'banner'
};

// Create context
const NotificationContext = createContext(null);

/**
 * Notification Provider Component
 */
export function NotificationProvider({ children }) {
  const [dialogs, setDialogs] = useState([]);
  const [banners, setBanners] = useState([]);

  // Add dialog
  const showDialog = useCallback((options) => {
    return new Promise((resolve) => {
      const id = `dialog-${Date.now()}`;
      const dialog = {
        id,
        ...options,
        resolve
      };
      setDialogs((prev) => [...prev, dialog]);
    });
  }, []);

  // Close dialog
  const closeDialog = useCallback((id, result) => {
    setDialogs((prev) => {
      const dialog = prev.find((d) => d.id === id);
      if (dialog?.resolve) {
        dialog.resolve(result);
      }
      return prev.filter((d) => d.id !== id);
    });
  }, []);

  // Confirm dialog
  const confirm = useCallback((options) => {
    const {
      title = '確認',
      message,
      confirmText = 'はい',
      cancelText = 'いいえ',
      confirmColor = 'primary',
      dangerous = false
    } = typeof options === 'string' ? { message: options } : options;

    return showDialog({
      type: NOTIFICATION_TYPES.CONFIRM,
      title,
      message,
      confirmText,
      cancelText,
      confirmColor: dangerous ? 'error' : confirmColor
    });
  }, [showDialog]);

  // Alert dialog
  const alert = useCallback((options) => {
    const {
      title = 'お知らせ',
      message,
      okText = 'OK'
    } = typeof options === 'string' ? { message: options } : options;

    return showDialog({
      type: NOTIFICATION_TYPES.ALERT,
      title,
      message,
      okText
    });
  }, [showDialog]);

  // Show banner
  const showBanner = useCallback((options) => {
    const {
      message,
      severity = 'info',
      title,
      action,
      actionLabel,
      dismissible = true,
      persistent = false
    } = typeof options === 'string' ? { message: options } : options;

    const id = `banner-${Date.now()}`;
    const banner = {
      id,
      message,
      severity,
      title,
      action,
      actionLabel,
      dismissible,
      persistent
    };

    setBanners((prev) => [...prev, banner]);

    // Auto-dismiss non-persistent banners
    if (!persistent) {
      setTimeout(() => {
        dismissBanner(id);
      }, 10000);
    }

    return id;
  }, []);

  // Dismiss banner
  const dismissBanner = useCallback((id) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // Clear all banners
  const clearBanners = useCallback(() => {
    setBanners((prev) => prev.filter((b) => b.persistent));
  }, []);

  const contextValue = useMemo(() => ({
    confirm,
    alert,
    showBanner,
    dismissBanner,
    clearBanners,
    banners
  }), [confirm, alert, showBanner, dismissBanner, clearBanners, banners]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {/* Banner Area */}
      <BannerContainer banners={banners} onDismiss={dismissBanner} />

      {children}

      {/* Dialog Stack */}
      {dialogs.map((dialog) => (
        <NotificationDialog
          key={dialog.id}
          dialog={dialog}
          onClose={(result) => closeDialog(dialog.id, result)}
        />
      ))}
    </NotificationContext.Provider>
  );
}

/**
 * Banner Container
 */
function BannerContainer({ banners, onDismiss }) {
  if (banners.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {banners.map((banner) => (
        <Collapse key={banner.id} in={true}>
          <Alert
            severity={banner.severity}
            sx={{
              borderRadius: 0,
              '& .MuiAlert-message': { flex: 1 }
            }}
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {banner.actionLabel && banner.action && (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={banner.action}
                  >
                    {banner.actionLabel}
                  </Button>
                )}
                {banner.dismissible && (
                  <IconButton
                    size="small"
                    color="inherit"
                    onClick={() => onDismiss(banner.id)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            }
          >
            {banner.title && <AlertTitle>{banner.title}</AlertTitle>}
            {banner.message}
          </Alert>
        </Collapse>
      ))}
    </Box>
  );
}

/**
 * Notification Dialog
 */
function NotificationDialog({ dialog, onClose }) {
  const { type, title, message, confirmText, cancelText, okText, confirmColor } = dialog;

  return (
    <Dialog
      open={true}
      onClose={() => onClose(false)}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        {type === NOTIFICATION_TYPES.CONFIRM ? (
          <>
            <Button onClick={() => onClose(false)} color="inherit">
              {cancelText}
            </Button>
            <Button
              onClick={() => onClose(true)}
              color={confirmColor}
              variant="contained"
              autoFocus
            >
              {confirmText}
            </Button>
          </>
        ) : (
          <Button onClick={() => onClose(true)} variant="contained" autoFocus>
            {okText}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

/**
 * Hook to use notifications
 */
export function useNotification() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }

  return context;
}

export default NotificationContext;
