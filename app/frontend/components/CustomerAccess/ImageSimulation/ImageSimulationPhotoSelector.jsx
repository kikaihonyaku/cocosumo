import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardMedia,
  Chip,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ApartmentIcon from '@mui/icons-material/Apartment';

export default function ImageSimulationPhotoSelector({
  propertyPhotos = [],
  buildingPhotos = [],
  selectedPhoto,
  onSelect,
  isMobile
}) {
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSelect = (photo, type) => {
    // room_photoの場合は実際のRoomPhotoのIDを使用（PropertyPublicationPhotoのIDではなく）
    const photoId = type === 'room_photo' ? photo.room_photo?.id : photo.id;
    onSelect({
      id: photoId,
      type: type,
      url: type === 'room_photo' ? photo.room_photo?.photo_url : photo.photo_url,
      caption: type === 'room_photo' ? photo.room_photo?.caption : photo.caption
    });
  };

  const isSelected = (photo, type) => {
    // room_photoの場合は実際のRoomPhotoのIDと比較
    const photoId = type === 'room_photo' ? photo.room_photo?.id : photo.id;
    return selectedPhoto?.id === photoId && selectedPhoto?.type === type;
  };

  // 部屋写真をroom_photoから取得
  const roomPhotos = propertyPhotos.filter(p => p.room_photo?.photo_url);

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
        シミュレーションする画像を選択
      </Typography>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        sx={{ mb: 2 }}
        variant={isMobile ? 'fullWidth' : 'standard'}
      >
        <Tab
          icon={<PhotoCameraIcon sx={{ fontSize: 18 }} />}
          iconPosition="start"
          label={
            <Badge badgeContent={roomPhotos.length} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: 10 } }}>
              <Box sx={{ pr: 1.5 }}>室内写真</Box>
            </Badge>
          }
          sx={{ minHeight: 48, textTransform: 'none' }}
        />
        <Tab
          icon={<ApartmentIcon sx={{ fontSize: 18 }} />}
          iconPosition="start"
          label={
            <Badge badgeContent={buildingPhotos.length} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: 10 } }}>
              <Box sx={{ pr: 1.5 }}>外観写真</Box>
            </Badge>
          }
          sx={{ minHeight: 48, textTransform: 'none' }}
        />
      </Tabs>

      {/* 室内写真 */}
      {tabValue === 0 && (
        <Grid container spacing={1.5}>
          {roomPhotos.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                室内写真がありません
              </Typography>
            </Grid>
          ) : (
            roomPhotos.map((photo) => (
              <Grid item xs={6} sm={4} md={3} key={`room-${photo.id}`}>
                <Card
                  variant="outlined"
                  sx={{
                    border: isSelected(photo, 'room_photo') ? '2px solid' : '1px solid',
                    borderColor: isSelected(photo, 'room_photo') ? 'primary.main' : 'divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.light',
                      transform: 'translateY(-2px)',
                      boxShadow: 2
                    }
                  }}
                >
                  <CardActionArea onClick={() => handleSelect(photo, 'room_photo')}>
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height={isMobile ? 90 : 110}
                        image={photo.room_photo.photo_url}
                        alt={photo.room_photo.caption || '室内写真'}
                        sx={{ objectFit: 'cover' }}
                      />
                      {isSelected(photo, 'room_photo') && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            bgcolor: 'rgba(25, 118, 210, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <CheckCircleIcon sx={{ color: 'white', fontSize: 36 }} />
                        </Box>
                      )}
                      {photo.room_photo.photo_type && (
                        <Chip
                          label={photo.room_photo.photo_type}
                          size="small"
                          sx={{
                            position: 'absolute',
                            bottom: 4,
                            left: 4,
                            fontSize: '0.65rem',
                            height: 20,
                            bgcolor: 'rgba(0,0,0,0.6)',
                            color: 'white'
                          }}
                        />
                      )}
                    </Box>
                  </CardActionArea>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* 外観写真 */}
      {tabValue === 1 && (
        <Grid container spacing={1.5}>
          {buildingPhotos.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                外観写真がありません
              </Typography>
            </Grid>
          ) : (
            buildingPhotos.map((photo) => (
              <Grid item xs={6} sm={4} md={3} key={`building-${photo.id}`}>
                <Card
                  variant="outlined"
                  sx={{
                    border: isSelected(photo, 'building_photo') ? '2px solid' : '1px solid',
                    borderColor: isSelected(photo, 'building_photo') ? 'primary.main' : 'divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.light',
                      transform: 'translateY(-2px)',
                      boxShadow: 2
                    }
                  }}
                >
                  <CardActionArea onClick={() => handleSelect(photo, 'building_photo')}>
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height={isMobile ? 90 : 110}
                        image={photo.photo_url}
                        alt={photo.caption || '外観写真'}
                        sx={{ objectFit: 'cover' }}
                      />
                      {isSelected(photo, 'building_photo') && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            bgcolor: 'rgba(25, 118, 210, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <CheckCircleIcon sx={{ color: 'white', fontSize: 36 }} />
                        </Box>
                      )}
                      {photo.photo_type && (
                        <Chip
                          label={photo.photo_type}
                          size="small"
                          sx={{
                            position: 'absolute',
                            bottom: 4,
                            left: 4,
                            fontSize: '0.65rem',
                            height: 20,
                            bgcolor: 'rgba(0,0,0,0.6)',
                            color: 'white'
                          }}
                        />
                      )}
                    </Box>
                  </CardActionArea>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}
    </Box>
  );
}
