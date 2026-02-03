import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Alert,
} from '@mui/material';

// カテゴリ定義
const PHOTO_CATEGORIES = {
  interior: '室内',
  living: 'リビング',
  kitchen: 'キッチン',
  bathroom: 'バスルーム',
  floor_plan: '間取り図',
  exterior: '外観',
  other: 'その他',
};

const PhotoSelector = ({ photos, selectedPhotoId, onPhotoSelect, label }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const getPhotoDisplayName = (photo) => {
    return photo.caption || `画像 ${photo.id}`;
  };

  const filteredPhotos = photos.filter((photo) =>
    selectedCategory === 'all' || photo.photo_type === selectedCategory
  );

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom sx={{ mb: 1.5 }}>
        {label}
      </Typography>

      {photos.length === 0 ? (
        <Alert severity="warning">
          写真がありません。部屋に写真を事前に登録してください。
        </Alert>
      ) : (
        <>
          {/* カテゴリ絞り込み */}
          <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label="全て"
              onClick={() => setSelectedCategory('all')}
              color={selectedCategory === 'all' ? 'primary' : 'default'}
              variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
              size="small"
            />
            {Object.entries(PHOTO_CATEGORIES).map(([key, label]) => (
              <Chip
                key={key}
                label={label}
                onClick={() => setSelectedCategory(key)}
                color={selectedCategory === key ? 'primary' : 'default'}
                variant={selectedCategory === key ? 'filled' : 'outlined'}
                size="small"
              />
            ))}
          </Box>

          {/* 写真グリッド - サムネイル表示で一覧性を高める */}
          <Box sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            maxHeight: 350,
            overflowY: 'auto',
            p: 1,
            bgcolor: 'grey.50',
            borderRadius: 1,
          }}>
            {filteredPhotos.map((photo) => (
              <Box
                key={photo.id}
                onClick={() => onPhotoSelect(photo.id)}
                sx={{
                  width: 72,
                  height: 72,
                  flexShrink: 0,
                  cursor: 'pointer',
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: selectedPhotoId === photo.id ? '3px solid' : '2px solid',
                  borderColor: selectedPhotoId === photo.id ? 'primary.main' : 'transparent',
                  boxShadow: selectedPhotoId === photo.id ? 3 : 1,
                  transition: 'all 0.15s',
                  '&:hover': {
                    borderColor: selectedPhotoId === photo.id ? 'primary.main' : 'grey.400',
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <img
                  src={photo.photo_url}
                  alt={getPhotoDisplayName(photo)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </Box>
            ))}
          </Box>

          {/* 選択中の写真情報 */}
          {selectedPhotoId && (
            <Box sx={{ mt: 1, p: 1, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
              <Typography variant="body2" color="primary.main">
                選択中: {photos.find(p => p.id === selectedPhotoId)?.caption || `画像 ${selectedPhotoId}`}
              </Typography>
            </Box>
          )}

          {filteredPhotos.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              このカテゴリの写真はありません
            </Alert>
          )}
        </>
      )}

    </Box>
  );
};

export default PhotoSelector;
