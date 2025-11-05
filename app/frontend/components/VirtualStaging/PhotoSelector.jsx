import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
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

          {/* 写真グリッド */}
          <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
            <Grid container spacing={1.5}>
              {filteredPhotos.map((photo) => (
                <Grid item xs={4} sm={3} md={2} key={photo.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedPhotoId === photo.id ? 2 : 1,
                      borderColor: selectedPhotoId === photo.id ? 'primary.main' : 'divider',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 3,
                        transform: 'translateY(-2px)',
                      },
                    }}
                    onClick={() => onPhotoSelect(photo.id)}
                  >
                    <CardMedia
                      component="img"
                      height="80"
                      image={photo.photo_url}
                      alt={getPhotoDisplayName(photo)}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ p: 0.75 }}>
                      <Typography variant="caption" noWrap sx={{ display: 'block', fontSize: '0.7rem' }}>
                        {getPhotoDisplayName(photo)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

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
