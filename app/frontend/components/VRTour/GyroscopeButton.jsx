import React, { useState, useEffect, useCallback } from 'react';
import {
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  ScreenRotation as GyroscopeIcon,
} from '@mui/icons-material';

/**
 * ジャイロスコープコントロールボタン
 * モバイルデバイスで端末の向きに応じてパノラマを操作
 */
const GyroscopeButton = ({
  onGyroscopeChange,
  gyroscopeEnabled = false,
  disabled = false,
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // ジャイロスコープがサポートされているかチェック
  useEffect(() => {
    const checkSupport = () => {
      // DeviceOrientationEventがサポートされているか確認
      if (typeof DeviceOrientationEvent !== 'undefined') {
        // iOS 13以降はrequestPermissionが必要
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          setIsSupported(true);
        } else if ('ondeviceorientation' in window) {
          setIsSupported(true);
        }
      }

      // モバイルデバイスでない場合はサポート外
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (!isMobile) {
        setIsSupported(false);
      }
    };

    checkSupport();
  }, []);

  const handleToggleGyroscope = useCallback(async () => {
    if (gyroscopeEnabled) {
      // ジャイロスコープを無効化
      onGyroscopeChange(false);
      return;
    }

    // iOS 13以降は明示的な権限リクエストが必要
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          onGyroscopeChange(true);
          setSnackbar({
            open: true,
            message: 'ジャイロスコープが有効になりました。端末を動かしてみてください。',
            severity: 'success'
          });
        } else {
          setPermissionDenied(true);
          setSnackbar({
            open: true,
            message: 'ジャイロスコープの権限が拒否されました。設定から許可してください。',
            severity: 'warning'
          });
        }
      } catch (error) {
        console.error('Gyroscope permission error:', error);
        setSnackbar({
          open: true,
          message: 'ジャイロスコープの権限リクエストに失敗しました。',
          severity: 'error'
        });
      }
    } else {
      // iOS 12以前やAndroidなど
      onGyroscopeChange(true);
      setSnackbar({
        open: true,
        message: 'ジャイロスコープが有効になりました。端末を動かしてみてください。',
        severity: 'success'
      });
    }
  }, [gyroscopeEnabled, onGyroscopeChange]);

  // モバイルデバイスでない、またはジャイロスコープ非対応の場合は表示しない
  if (!isSupported) {
    return null;
  }

  return (
    <>
      <Tooltip title={gyroscopeEnabled ? 'ジャイロスコープを無効化' : 'ジャイロスコープを有効化'}>
        <IconButton
          onClick={handleToggleGyroscope}
          disabled={disabled || permissionDenied}
          sx={{
            color: gyroscopeEnabled ? 'primary.main' : 'white',
            bgcolor: gyroscopeEnabled ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.3)',
            },
          }}
        >
          <GyroscopeIcon />
        </IconButton>
      </Tooltip>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default GyroscopeButton;
