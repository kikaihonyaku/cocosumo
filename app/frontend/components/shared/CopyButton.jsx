/**
 * Copy Button Component
 * Reusable button for copying text to clipboard
 */

import React, { forwardRef } from 'react';
import {
  IconButton,
  Button,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { useCopyToClipboard } from '../../hooks/useClipboard';
import { canShare, shareContent } from '../../utils/clipboardUtils';

/**
 * Simple copy button (icon only)
 */
export const CopyIconButton = forwardRef(function CopyIconButton(
  {
    text,
    size = 'small',
    color = 'default',
    tooltip = 'コピー',
    successTooltip = 'コピーしました',
    onCopy,
    disabled = false,
    ...props
  },
  ref
) {
  const { copy, copied, error } = useCopyToClipboard({
    onSuccess: onCopy
  });

  const handleClick = (e) => {
    e.stopPropagation();
    copy(text);
  };

  return (
    <Tooltip title={copied ? successTooltip : tooltip}>
      <span>
        <IconButton
          ref={ref}
          size={size}
          color={copied ? 'success' : color}
          onClick={handleClick}
          disabled={disabled || !text}
          {...props}
        >
          {copied ? <CheckIcon fontSize="inherit" /> : <CopyIcon fontSize="inherit" />}
        </IconButton>
      </span>
    </Tooltip>
  );
});

/**
 * Copy button with text label
 */
export const CopyButton = forwardRef(function CopyButton(
  {
    text,
    label = 'コピー',
    successLabel = 'コピーしました',
    variant = 'outlined',
    size = 'small',
    color = 'primary',
    startIcon = true,
    onCopy,
    disabled = false,
    showNotification = false,
    ...props
  },
  ref
) {
  const { copy, copied, error } = useCopyToClipboard({
    onSuccess: onCopy
  });

  const [notificationOpen, setNotificationOpen] = React.useState(false);

  const handleClick = async (e) => {
    e.stopPropagation();
    const success = await copy(text);
    if (success && showNotification) {
      setNotificationOpen(true);
    }
  };

  const handleCloseNotification = () => {
    setNotificationOpen(false);
  };

  return (
    <>
      <Button
        ref={ref}
        variant={variant}
        size={size}
        color={copied ? 'success' : color}
        onClick={handleClick}
        disabled={disabled || !text}
        startIcon={
          startIcon ? (
            copied ? <CheckIcon /> : <CopyIcon />
          ) : undefined
        }
        {...props}
      >
        {copied ? successLabel : label}
      </Button>

      {showNotification && (
        <Snackbar
          open={notificationOpen}
          autoHideDuration={2000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity="success"
            variant="filled"
          >
            {successLabel}
          </Alert>
        </Snackbar>
      )}
    </>
  );
});

/**
 * Copy text field content button
 */
export function CopyFieldButton({ value, fieldLabel, ...props }) {
  return (
    <CopyIconButton
      text={value}
      tooltip={`${fieldLabel}をコピー`}
      successTooltip={`${fieldLabel}をコピーしました`}
      {...props}
    />
  );
}

/**
 * Share button with fallback to copy
 */
export const ShareButton = forwardRef(function ShareButton(
  {
    title,
    text,
    url,
    shareLabel = '共有',
    copyLabel = 'URLをコピー',
    variant = 'outlined',
    size = 'small',
    color = 'primary',
    onShare,
    onCopy,
    ...props
  },
  ref
) {
  const { copy, copied } = useCopyToClipboard({
    onSuccess: onCopy
  });

  const shareSupported = canShare();

  const handleClick = async (e) => {
    e.stopPropagation();

    if (shareSupported) {
      try {
        await shareContent({ title, text, url });
        onShare?.();
      } catch (err) {
        // User cancelled or error - fallback to copy
        if (err.name !== 'AbortError') {
          copy(url || text);
        }
      }
    } else {
      copy(url || text);
    }
  };

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      color={copied ? 'success' : color}
      onClick={handleClick}
      startIcon={shareSupported ? <ShareIcon /> : (copied ? <CheckIcon /> : <CopyIcon />)}
      {...props}
    >
      {shareSupported ? shareLabel : (copied ? 'コピーしました' : copyLabel)}
    </Button>
  );
});

/**
 * Copy URL button
 */
export function CopyUrlButton({
  url,
  label = 'URLをコピー',
  successLabel = 'コピーしました',
  ...props
}) {
  return (
    <CopyButton
      text={url || window.location.href}
      label={label}
      successLabel={successLabel}
      {...props}
    />
  );
}

/**
 * Copy code block button
 */
export function CopyCodeButton({ code, language, ...props }) {
  return (
    <CopyIconButton
      text={code}
      tooltip={`${language ? `${language} ` : ''}コードをコピー`}
      size="small"
      {...props}
    />
  );
}

/**
 * Inline copy text (text with copy button)
 */
export function CopyableText({
  children,
  text,
  component: Component = 'span',
  showIcon = true,
  sx = {},
  ...props
}) {
  const textToCopy = text || (typeof children === 'string' ? children : '');

  return (
    <Component
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        ...sx
      }}
    >
      {children}
      {showIcon && textToCopy && (
        <CopyIconButton
          text={textToCopy}
          size="small"
          sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
          {...props}
        />
      )}
    </Component>
  );
}

/**
 * Copy to clipboard with custom render
 */
export function CopyWrapper({ text, children, onCopy }) {
  const { copy, copied, error } = useCopyToClipboard({
    onSuccess: onCopy
  });

  const handleCopy = () => {
    copy(text);
  };

  return children({ copy: handleCopy, copied, error });
}

export default CopyButton;
