import React, { useState, useEffect, useCallback } from 'react';
import {
  IconButton,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon
} from '@mui/icons-material';
import { isFavorite, toggleFavorite } from '../../services/favorites';
import { trackEvent } from '../../services/analytics';

export default function FavoriteButton({
  publicationId,
  title,
  catchCopy,
  thumbnailUrl,
  address,
  rent,
  roomType,
  area,
  size = 'medium',
  showLabel = false,
  sx = {}
}) {
  const [favorited, setFavorited] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    setFavorited(isFavorite(publicationId));
  }, [publicationId]);

  const handleToggle = useCallback((e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    const property = {
      publicationId,
      title,
      catchCopy,
      thumbnailUrl,
      address,
      rent,
      roomType,
      area
    };

    const newStatus = toggleFavorite(property);
    setFavorited(newStatus);

    // Track analytics
    trackEvent(newStatus ? 'add_to_favorites' : 'remove_from_favorites', {
      publication_id: publicationId
    });

    // Show snackbar
    setSnackbarMessage(newStatus ? 'お気に入りに追加しました' : 'お気に入りから削除しました');
    setSnackbarOpen(true);
  }, [publicationId, title, catchCopy, thumbnailUrl, address, rent, roomType, area]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <>
      <Tooltip title={favorited ? 'お気に入りから削除' : 'お気に入りに追加'}>
        <IconButton
          onClick={handleToggle}
          size={size}
          aria-label={favorited ? 'お気に入りから削除' : 'お気に入りに追加'}
          sx={{
            color: favorited ? 'error.main' : 'action.active',
            '&:hover': {
              color: 'error.main',
              bgcolor: 'error.lighter'
            },
            transition: 'all 0.2s ease',
            '@media print': { display: 'none' },
            ...sx
          }}
        >
          {favorited ? (
            <FavoriteIcon
              fontSize={size}
              sx={{
                animation: favorited ? 'heartBeat 0.3s ease' : 'none',
                '@keyframes heartBeat': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.3)' },
                  '100%': { transform: 'scale(1)' }
                }
              }}
            />
          ) : (
            <FavoriteBorderIcon fontSize={size} />
          )}
        </IconButton>
      </Tooltip>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={favorited ? 'success' : 'info'}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
