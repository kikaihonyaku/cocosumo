/**
 * Toast Context
 * Global toast/snackbar notification system
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Snackbar, Alert, IconButton, Button, Slide, Box, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

// Toast types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Default durations
const DEFAULT_DURATIONS = {
  [TOAST_TYPES.SUCCESS]: 3000,
  [TOAST_TYPES.ERROR]: 6000,
  [TOAST_TYPES.WARNING]: 5000,
  [TOAST_TYPES.INFO]: 4000
};

// Max toasts to show at once
const MAX_TOASTS = 3;

// Create context
const ToastContext = createContext(null);

// Generate unique ID
let toastId = 0;
const generateId = () => `toast-${++toastId}`;

// Slide transition
function SlideTransition(props) {
  return <Slide {...props} direction="up" />;
}

/**
 * Toast Provider Component
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Add toast
  const addToast = useCallback((options) => {
    const {
      message,
      type = TOAST_TYPES.INFO,
      duration = DEFAULT_DURATIONS[type],
      action,
      actionLabel,
      onAction,
      onClose,
      persistent = false,
      title
    } = typeof options === 'string' ? { message: options } : options;

    const id = generateId();

    const newToast = {
      id,
      message,
      type,
      duration: persistent ? null : duration,
      action,
      actionLabel,
      onAction,
      onClose,
      title,
      createdAt: Date.now()
    };

    setToasts((prev) => {
      // Remove oldest if exceeding max
      const updated = prev.length >= MAX_TOASTS ? prev.slice(1) : prev;
      return [...updated, newToast];
    });

    return id;
  }, []);

  // Remove toast
  const removeToast = useCallback((id) => {
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id);
      if (toast?.onClose) {
        toast.onClose();
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  // Clear all toasts
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((message, options = {}) => {
    return addToast({ message, type: TOAST_TYPES.SUCCESS, ...options });
  }, [addToast]);

  const error = useCallback((message, options = {}) => {
    return addToast({ message, type: TOAST_TYPES.ERROR, ...options });
  }, [addToast]);

  const warning = useCallback((message, options = {}) => {
    return addToast({ message, type: TOAST_TYPES.WARNING, ...options });
  }, [addToast]);

  const info = useCallback((message, options = {}) => {
    return addToast({ message, type: TOAST_TYPES.INFO, ...options });
  }, [addToast]);

  // Promise-based toast (for async operations)
  const promise = useCallback((promiseFn, messages) => {
    const {
      loading = '処理中...',
      success: successMsg = '完了しました',
      error: errorMsg = 'エラーが発生しました'
    } = messages;

    const loadingId = addToast({
      message: loading,
      type: TOAST_TYPES.INFO,
      persistent: true
    });

    return promiseFn
      .then((result) => {
        removeToast(loadingId);
        success(typeof successMsg === 'function' ? successMsg(result) : successMsg);
        return result;
      })
      .catch((err) => {
        removeToast(loadingId);
        error(typeof errorMsg === 'function' ? errorMsg(err) : errorMsg);
        throw err;
      });
  }, [addToast, removeToast, success, error]);

  const contextValue = useMemo(() => ({
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info,
    promise
  }), [toasts, addToast, removeToast, clearToasts, success, error, warning, info, promise]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Toast Container Component
 */
function ToastContainer({ toasts, onClose }) {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        maxWidth: '90vw',
        width: 400
      }}
    >
      {toasts.map((toast, index) => (
        <Snackbar
          key={toast.id}
          open={true}
          autoHideDuration={toast.duration}
          onClose={(_, reason) => {
            if (reason === 'clickaway') return;
            onClose(toast.id);
          }}
          TransitionComponent={SlideTransition}
          sx={{
            position: 'relative',
            transform: 'none',
            bottom: 'auto',
            left: 'auto',
            right: 'auto'
          }}
        >
          <Alert
            severity={toast.type}
            variant="filled"
            sx={{
              width: '100%',
              alignItems: 'center',
              boxShadow: 3
            }}
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {toast.actionLabel && toast.onAction && (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => {
                      toast.onAction();
                      onClose(toast.id);
                    }}
                  >
                    {toast.actionLabel}
                  </Button>
                )}
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={() => onClose(toast.id)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            }
          >
            {toast.title && (
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {toast.title}
              </Typography>
            )}
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </Box>
  );
}

/**
 * Hook to use toast notifications
 */
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}

export default ToastContext;
