import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Typography,
  Stack
} from '@mui/material';
import {
  Twitter as TwitterIcon,
  Facebook as FacebookIcon,
  Link as LinkIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';

export default function ShareButtons({ url, title, qrCodeUrl }) {
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const handleLineShare = () => {
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`;
    window.open(lineUrl, '_blank', 'width=600,height=400');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
        シェア
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Tooltip title="Twitterでシェア">
          <IconButton
            onClick={handleTwitterShare}
            sx={{
              bgcolor: '#1DA1F2',
              color: 'white',
              '&:hover': { bgcolor: '#0d8bd9' }
            }}
            size="small"
          >
            <TwitterIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Facebookでシェア">
          <IconButton
            onClick={handleFacebookShare}
            sx={{
              bgcolor: '#4267B2',
              color: 'white',
              '&:hover': { bgcolor: '#365899' }
            }}
            size="small"
          >
            <FacebookIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="LINEで送る">
          <IconButton
            onClick={handleLineShare}
            sx={{
              bgcolor: '#00B900',
              color: 'white',
              '&:hover': { bgcolor: '#009900' }
            }}
            size="small"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.771.039 1.086l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
          </IconButton>
        </Tooltip>

        <Tooltip title={copied ? 'コピーしました！' : 'URLをコピー'}>
          <IconButton
            onClick={handleCopyLink}
            sx={{
              bgcolor: copied ? 'success.main' : 'grey.600',
              color: 'white',
              '&:hover': { bgcolor: copied ? 'success.dark' : 'grey.700' }
            }}
            size="small"
          >
            <LinkIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {qrCodeUrl && (
          <Tooltip title="QRコードを表示">
            <IconButton
              onClick={() => setQrDialogOpen(true)}
              sx={{
                bgcolor: 'grey.600',
                color: 'white',
                '&:hover': { bgcolor: 'grey.700' }
              }}
              size="small"
            >
              <QrCodeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)}>
        <DialogTitle>QRコード</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="QR Code" style={{ maxWidth: '100%', maxHeight: 300 }} />
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              スマートフォンでスキャンしてアクセスできます
            </Typography>
          </Box>
        </DialogContent>
        <Button onClick={() => setQrDialogOpen(false)}>閉じる</Button>
      </Dialog>
    </Box>
  );
}
