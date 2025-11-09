import React, { useState } from 'react';
import {
  Box,
  IconButton,
  ImageList,
  ImageListItem,
  Paper
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';

export default function PhotoGallery({ photos = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <Box
        sx={{
          bgcolor: '#e0e0e0',
          height: 400,
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

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index) => {
    setCurrentIndex(index);
  };

  const currentPhoto = photos[currentIndex];

  return (
    <Box>
      {/* Main Image Display */}
      <Box sx={{ position: 'relative', bgcolor: '#000', borderRadius: 1, overflow: 'hidden' }}>
        <Box
          component="img"
          src={currentPhoto.room_photo?.photo_url || currentPhoto.photo_url}
          alt={currentPhoto.room_photo?.caption || `写真 ${currentIndex + 1}`}
          sx={{
            width: '100%',
            height: 400,
            objectFit: 'contain',
            display: 'block'
          }}
        />

        {/* Navigation Buttons */}
        {photos.length > 1 && (
          <>
            <IconButton
              onClick={handlePrevious}
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
              onClick={handleNext}
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
                bottom: 16,
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
      </Box>

      {/* Thumbnail Gallery */}
      {photos.length > 1 && (
        <Box sx={{ mt: 2 }}>
          <ImageList
            sx={{
              gridAutoFlow: 'column',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr)) !important',
              gridAutoColumns: 'minmax(100px, 1fr)',
              overflowX: 'auto',
              overflowY: 'hidden'
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
                  style={{
                    width: '100%',
                    height: 80,
                    objectFit: 'cover'
                  }}
                />
              </ImageListItem>
            ))}
          </ImageList>
        </Box>
      )}
    </Box>
  );
}
