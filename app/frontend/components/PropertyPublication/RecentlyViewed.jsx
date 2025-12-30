import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Stack,
  Drawer,
  Fab,
  Badge,
  Tooltip,
  Button,
  Divider
} from '@mui/material';
import {
  History as HistoryIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  OpenInNew as OpenInNewIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import {
  getViewHistory,
  removeFromHistory,
  clearHistory,
  formatRelativeTime,
  getHistoryCount
} from '../../services/viewHistory';

// 間取りラベル
const getRoomTypeLabel = (roomType) => {
  const labels = {
    'studio': 'ワンルーム',
    '1K': '1K',
    '1DK': '1DK',
    '1LDK': '1LDK',
    '2K': '2K',
    '2DK': '2DK',
    '2LDK': '2LDK',
    '3K': '3K',
    '3DK': '3DK',
    '3LDK': '3LDK',
    'other': 'その他'
  };
  return labels[roomType] || roomType || '';
};

/**
 * Recently Viewed Properties Drawer
 * Shows a floating button and drawer with view history
 */
export default function RecentlyViewed({ currentPublicationId }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const updateHistory = () => {
      const items = getViewHistory();
      // Filter out current property
      const filtered = items.filter(
        (item) => item.publicationId !== currentPublicationId
      );
      setHistory(filtered);
    };

    updateHistory();

    window.addEventListener('view-history-updated', updateHistory);
    return () => window.removeEventListener('view-history-updated', updateHistory);
  }, [currentPublicationId]);

  const handleRemove = (publicationId) => {
    removeFromHistory(publicationId);
  };

  const handleClear = () => {
    clearHistory();
    setOpen(false);
  };

  const handleOpenProperty = (publicationId) => {
    window.open(`/p/${publicationId}`, '_blank');
  };

  // Don't show if no history (excluding current)
  if (history.length === 0) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <Tooltip title="最近見た物件">
        <Fab
          color="secondary"
          size="medium"
          onClick={() => setOpen(true)}
          aria-label={`最近見た物件 ${history.length}件`}
          sx={{
            position: 'fixed',
            bottom: 100, // Above compare button
            right: 24,
            zIndex: 999,
            '@media print': { display: 'none' }
          }}
        >
          <Badge badgeContent={history.length} color="error" max={20}>
            <HistoryIcon />
          </Badge>
        </Fab>
      </Tooltip>

      {/* History Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 380 },
            maxWidth: '100%'
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon />
              最近見た物件
            </Typography>
            <Box>
              <Button
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleClear}
                sx={{ mr: 1 }}
              >
                全削除
              </Button>
              <IconButton onClick={() => setOpen(false)} aria-label="閉じる">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* History List */}
          <Stack spacing={2}>
            {history.map((item) => (
              <Paper
                key={item.publicationId}
                variant="outlined"
                sx={{
                  p: 1.5,
                  display: 'flex',
                  gap: 1.5,
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                {/* Thumbnail */}
                {item.thumbnailUrl ? (
                  <Box
                    component="img"
                    src={item.thumbnailUrl}
                    alt={item.title}
                    sx={{
                      width: 80,
                      height: 60,
                      objectFit: 'cover',
                      borderRadius: 1,
                      flexShrink: 0
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 80,
                      height: 60,
                      bgcolor: 'grey.200',
                      borderRadius: 1,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      No Image
                    </Typography>
                  </Box>
                )}

                {/* Content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 'bold',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {item.title}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                    {item.rent && (
                      <Chip
                        label={`${item.rent.toLocaleString()}円`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                    {item.roomType && (
                      <Chip
                        label={getRoomTypeLabel(item.roomType)}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                    {item.area && (
                      <Chip
                        label={`${item.area}m²`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {formatRelativeTime(item.viewedAt)}
                      {item.viewCount > 1 && ` (${item.viewCount}回閲覧)`}
                    </Typography>
                  </Box>
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenProperty(item.publicationId)}
                    aria-label="物件ページを開く"
                  >
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemove(item.publicationId)}
                    aria-label="履歴から削除"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Paper>
            ))}
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}

/**
 * Compact Recently Viewed Widget for embedding in pages
 */
export function RecentlyViewedCompact({ limit = 3, currentPublicationId }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const updateHistory = () => {
      const items = getViewHistory();
      const filtered = items
        .filter((item) => item.publicationId !== currentPublicationId)
        .slice(0, limit);
      setHistory(filtered);
    };

    updateHistory();

    window.addEventListener('view-history-updated', updateHistory);
    return () => window.removeEventListener('view-history-updated', updateHistory);
  }, [currentPublicationId, limit]);

  if (history.length === 0) {
    return null;
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }} className="no-print">
      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <HistoryIcon fontSize="small" />
        最近見た物件
      </Typography>
      <Stack spacing={1}>
        {history.map((item) => (
          <Box
            key={item.publicationId}
            component="a"
            href={`/p/${item.publicationId}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              textDecoration: 'none',
              color: 'inherit',
              p: 1,
              borderRadius: 1,
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            {item.thumbnailUrl && (
              <Box
                component="img"
                src={item.thumbnailUrl}
                alt=""
                sx={{
                  width: 48,
                  height: 36,
                  objectFit: 'cover',
                  borderRadius: 0.5
                }}
              />
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {item.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.rent && `${item.rent.toLocaleString()}円`}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
