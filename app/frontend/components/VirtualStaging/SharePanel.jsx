import React, { useState, useRef } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Snackbar,
  Alert,
  Divider,
  Paper,
} from '@mui/material';
import {
  Share as ShareIcon,
  ContentCopy as CopyIcon,
  QrCode as QrCodeIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';

// SNSアイコン（SVG）
const LineIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.349 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

/**
 * 共有パネルコンポーネント
 */
const SharePanel = ({
  publicUrl,
  title,
  variant = 'button', // 'button' | 'icon' | 'inline'
  showQrCode = true,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const qrRef = useRef(null);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setSnackbar({ open: true, message: 'URLをコピーしました' });
  };

  const handleShareLine = () => {
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(publicUrl)}`;
    window.open(lineUrl, '_blank', 'width=600,height=500');
  };

  const handleShareTwitter = () => {
    const text = title ? `${title} | バーチャルステージング` : 'バーチャルステージング';
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=500');
  };

  const handleShareFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=500');
  };

  const handleDownloadQr = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    // SVGをCanvasに変換してPNGとしてダウンロード
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, 300, 300);

      const link = document.createElement('a');
      link.download = `qr-${title || 'virtual-staging'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    setSnackbar({ open: true, message: 'QRコードをダウンロードしました' });
  };

  const renderTrigger = () => {
    if (variant === 'icon') {
      return (
        <Tooltip title="共有">
          <IconButton onClick={() => setDialogOpen(true)} sx={{ color: 'white' }}>
            <ShareIcon />
          </IconButton>
        </Tooltip>
      );
    }

    if (variant === 'inline') {
      return (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="URLをコピー">
            <IconButton onClick={handleCopyUrl} size="small">
              <CopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="LINEで共有">
            <IconButton
              onClick={handleShareLine}
              size="small"
              sx={{ color: '#06C755' }}
            >
              <LineIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="X (Twitter)で共有">
            <IconButton onClick={handleShareTwitter} size="small">
              <TwitterIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Facebookで共有">
            <IconButton
              onClick={handleShareFacebook}
              size="small"
              sx={{ color: '#1877F2' }}
            >
              <FacebookIcon />
            </IconButton>
          </Tooltip>
          {showQrCode && (
            <Tooltip title="QRコード">
              <IconButton onClick={() => setDialogOpen(true)} size="small">
                <QrCodeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      );
    }

    // デフォルト: button
    return (
      <Button
        variant="outlined"
        startIcon={<ShareIcon />}
        onClick={() => setDialogOpen(true)}
      >
        共有
      </Button>
    );
  };

  return (
    <>
      {renderTrigger()}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShareIcon color="primary" />
            <Typography variant="h6">共有</Typography>
          </Box>
          <IconButton onClick={() => setDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {/* URL */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              公開URL
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                value={publicUrl}
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
              />
              <Button
                variant="contained"
                onClick={handleCopyUrl}
                startIcon={<CopyIcon />}
              >
                コピー
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* SNS共有 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              SNSで共有
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Paper
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: '#06C75510',
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={handleShareLine}
              >
                <Box sx={{ color: '#06C755', mb: 0.5 }}>
                  <LineIcon />
                </Box>
                <Typography variant="caption">LINE</Typography>
              </Paper>

              <Paper
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.05)',
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={handleShareTwitter}
              >
                <Box sx={{ mb: 0.5 }}>
                  <TwitterIcon />
                </Box>
                <Typography variant="caption">X</Typography>
              </Paper>

              <Paper
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: '#1877F210',
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={handleShareFacebook}
              >
                <Box sx={{ color: '#1877F2', mb: 0.5 }}>
                  <FacebookIcon />
                </Box>
                <Typography variant="caption">Facebook</Typography>
              </Paper>
            </Box>
          </Box>

          {showQrCode && (
            <>
              <Divider sx={{ my: 2 }} />

              {/* QRコード */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  QRコード
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mt: 2,
                  }}
                >
                  <Paper
                    ref={qrRef}
                    sx={{
                      p: 2,
                      bgcolor: 'white',
                      display: 'inline-block',
                    }}
                    elevation={2}
                  >
                    <QRCodeSVG
                      value={publicUrl}
                      size={180}
                      level="M"
                      includeMargin={false}
                    />
                  </Paper>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadQr}
                    sx={{ mt: 2 }}
                  >
                    QRコードをダウンロード
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    印刷資料やチラシに貼り付けてご利用ください
                  </Typography>
                </Box>
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SharePanel;
