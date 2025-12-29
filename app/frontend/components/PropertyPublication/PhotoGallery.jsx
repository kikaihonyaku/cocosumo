import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  IconButton,
  ImageList,
  ImageListItem,
  Typography,
  Modal,
  Backdrop
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon,
  Fullscreen as FullscreenIcon
} from '@mui/icons-material';

export default function PhotoGallery({ photos = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Keyboard navigation
  const handleKeyDown = useCallback((event) => {
    if (!lightboxOpen) return;

    switch (event.key) {
      case 'ArrowLeft':
        setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
        break;
      case 'ArrowRight':
        setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
        break;
      case 'Escape':
        setLightboxOpen(false);
        break;
      default:
        break;
    }
  }, [lightboxOpen, photos.length]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [lightboxOpen]);

  if (photos.length === 0) {
    return (
      <Box
        sx={{
          bgcolor: '#e0e0e0',
          height: { xs: 250, sm: 350, md: 400 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 1
        }}
      >
        写真がありません
      </Box>
    );
  }

  const handlePrevious = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index) => {
    setCurrentIndex(index);
  };

  const handleOpenLightbox = () => {
    setLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setLightboxOpen(false);
  };

  const currentPhoto = photos[currentIndex];
  const imageUrl = currentPhoto.room_photo?.photo_url || currentPhoto.photo_url;
  const imageAlt = currentPhoto.room_photo?.caption || `写真 ${currentIndex + 1}`;

  return (
    <Box>
      {/* Main Image Display */}
      <Box
        sx={{
          position: 'relative',
          bgcolor: '#000',
          borderRadius: 1,
          overflow: 'hidden',
          cursor: 'pointer'
        }}
        onClick={handleOpenLightbox}
      >
        <Box
          component="img"
          src={imageUrl}
          alt={imageAlt}
          loading="lazy"
          sx={{
            width: '100%',
            height: { xs: 250, sm: 350, md: 400 },
            objectFit: 'contain',
            display: 'block'
          }}
        />

        {/* Fullscreen hint */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            p: 0.5,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            fontSize: '0.75rem',
            opacity: 0.8,
            transition: 'opacity 0.2s',
            '&:hover': { opacity: 1 }
          }}
        >
          <FullscreenIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption">拡大表示</Typography>
        </Box>

        {/* Navigation Buttons */}
        {photos.length > 1 && (
          <>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                }
              }}
            >
              <ChevronLeftIcon />
            </IconButton>

            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                }
              }}
            >
              <ChevronRightIcon />
            </IconButton>

            {/* Image Counter */}
            <Box
              sx={{
                position: 'absolute',
                bottom: currentPhoto.comment ? 60 : 16,
                right: 16,
                bgcolor: 'rgba(0, 0, 0, 0.6)',
                color: 'white',
                px: 2,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.875rem'
              }}
            >
              {currentIndex + 1} / {photos.length}
            </Box>
          </>
        )}

        {/* Photo Comment Overlay */}
        {currentPhoto.comment && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: 'rgba(0, 0, 0, 0.75)',
              color: 'white',
              px: 3,
              py: 2,
              backdropFilter: 'blur(4px)'
            }}
          >
            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
              {currentPhoto.comment}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Thumbnail Gallery */}
      {photos.length > 1 && (
        <Box sx={{ mt: 2 }}>
          <ImageList
            sx={{
              gridAutoFlow: 'column',
              gridTemplateColumns: {
                xs: 'repeat(auto-fill, minmax(70px, 1fr)) !important',
                sm: 'repeat(auto-fill, minmax(100px, 1fr)) !important'
              },
              gridAutoColumns: {
                xs: 'minmax(70px, 1fr)',
                sm: 'minmax(100px, 1fr)'
              },
              overflowX: 'auto',
              overflowY: 'hidden',
              pb: 1,
              scrollbarWidth: 'thin'
            }}
            gap={8}
          >
            {photos.map((photo, index) => (
              <ImageListItem
                key={index}
                sx={{
                  cursor: 'pointer',
                  border: currentIndex === index ? '3px solid' : '2px solid transparent',
                  borderColor: currentIndex === index ? 'primary.main' : 'transparent',
                  borderRadius: 1,
                  overflow: 'hidden',
                  opacity: currentIndex === index ? 1 : 0.6,
                  transition: 'all 0.2s',
                  '&:hover': {
                    opacity: 1,
                    transform: 'scale(1.05)'
                  }
                }}
                onClick={() => handleThumbnailClick(index)}
              >
                <img
                  src={photo.room_photo?.photo_url || photo.photo_url}
                  alt={photo.room_photo?.caption || `サムネイル ${index + 1}`}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: 60,
                    objectFit: 'cover'
                  }}
                />
              </ImageListItem>
            ))}
          </ImageList>
        </Box>
      )}

      {/* Lightbox Modal */}
      <Modal
        open={lightboxOpen}
        onClose={handleCloseLightbox}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 300,
            sx: { bgcolor: 'rgba(0, 0, 0, 0.95)' }
          }
        }}
      >
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none'
          }}
          onClick={handleCloseLightbox}
        >
          {/* Close button */}
          <IconButton
            onClick={handleCloseLightbox}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: 'white',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
              zIndex: 10
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Image counter */}
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              color: 'white',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              px: 2,
              py: 0.5,
              borderRadius: 1,
              zIndex: 10
            }}
          >
            <Typography variant="body2">
              {currentIndex + 1} / {photos.length}
            </Typography>
          </Box>

          {/* Main lightbox image */}
          <Box
            component="img"
            src={imageUrl}
            alt={imageAlt}
            sx={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              objectFit: 'contain',
              userSelect: 'none'
            }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Navigation buttons */}
          {photos.length > 1 && (
            <>
              <IconButton
                onClick={handlePrevious}
                sx={{
                  position: 'absolute',
                  left: { xs: 8, md: 24 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                  width: { xs: 40, md: 56 },
                  height: { xs: 40, md: 56 }
                }}
              >
                <ChevronLeftIcon sx={{ fontSize: { xs: 24, md: 32 } }} />
              </IconButton>

              <IconButton
                onClick={handleNext}
                sx={{
                  position: 'absolute',
                  right: { xs: 8, md: 24 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                  width: { xs: 40, md: 56 },
                  height: { xs: 40, md: 56 }
                }}
              >
                <ChevronRightIcon sx={{ fontSize: { xs: 24, md: 32 } }} />
              </IconButton>
            </>
          )}

          {/* Photo comment in lightbox */}
          {currentPhoto.comment && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                maxWidth: '80vw',
                bgcolor: 'rgba(0, 0, 0, 0.75)',
                color: 'white',
                px: 3,
                py: 2,
                borderRadius: 1,
                backdropFilter: 'blur(4px)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Typography variant="body1" sx={{ textAlign: 'center' }}>
                {currentPhoto.comment}
              </Typography>
            </Box>
          )}

          {/* Keyboard hint */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.75rem',
              display: { xs: 'none', md: 'block' }
            }}
          >
            ←→ で移動 / ESC で閉じる
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
