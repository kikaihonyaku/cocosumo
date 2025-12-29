import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Button,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  OpenInNew as OpenInNewIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

/**
 * 情報ホットスポットの詳細パネル
 */
const InfoHotspotPanel = ({
  open,
  onClose,
  hotspot,
}) => {
  if (!hotspot || !hotspot.data) {
    return null;
  }

  const { title, description, image_url, link_url, link_text } = hotspot.data;
  const displayTitle = title || hotspot.text || '情報';

  const handleLinkClick = () => {
    if (link_url) {
      window.open(link_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {displayTitle}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* 画像 */}
        {image_url && (
          <Box sx={{ mb: 2 }}>
            <Box
              component="img"
              src={image_url}
              alt={displayTitle}
              sx={{
                width: '100%',
                maxHeight: 300,
                objectFit: 'cover',
                borderRadius: 1,
              }}
            />
          </Box>
        )}

        {/* 説明文 */}
        {description && (
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap',
            }}
          >
            {description}
          </Typography>
        )}

        {/* リンク */}
        {link_url && (
          <>
            <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
            <Button
              variant="contained"
              endIcon={<OpenInNewIcon />}
              onClick={handleLinkClick}
              fullWidth
              sx={{
                bgcolor: 'primary.main',
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              {link_text || '詳細を見る'}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InfoHotspotPanel;
