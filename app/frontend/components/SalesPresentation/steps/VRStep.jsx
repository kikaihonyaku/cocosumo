import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip
} from '@mui/material';
import {
  ViewInAr as VRIcon,
  ThreeSixty as ThreeSixtyIcon,
  CompareArrows as CompareIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';

export default function VRStep({ property, config, isMobile }) {
  const { vr_tours, virtual_stagings } = property;

  const hasVRContent = (vr_tours && vr_tours.length > 0) || (virtual_stagings && virtual_stagings.length > 0);

  const handleVRTourClick = (tour) => {
    const url = `/vr/${tour.public_id}`;
    window.open(url, '_blank');
  };

  const handleStagingClick = (staging) => {
    const url = `/staging/${staging.public_id}`;
    window.open(url, '_blank');
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <VRIcon color="primary" />
        VR・写真
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        VRツアーとバーチャルステージングをご覧いただけます
      </Typography>

      {!hasVRContent ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 2 }}>
          <VRIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            VRコンテンツはありません
          </Typography>
          <Typography variant="body2" color="text.secondary">
            この物件にはVRツアーやバーチャルステージングが登録されていません
          </Typography>
        </Paper>
      ) : (
        <>
          {/* VRツアー */}
          {vr_tours && vr_tours.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ThreeSixtyIcon color="primary" />
                VRツアー
              </Typography>
              <Grid container spacing={2}>
                {vr_tours.map((tour) => (
                  <Grid item xs={12} sm={6} md={4} key={tour.id}>
                    <Card sx={{ height: '100%', borderRadius: 2 }}>
                      <CardActionArea onClick={() => handleVRTourClick(tour)}>
                        {tour.thumbnail_url ? (
                          <CardMedia
                            component="img"
                            height={isMobile ? 140 : 180}
                            image={tour.thumbnail_url}
                            alt={tour.title}
                            sx={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <Box
                            sx={{
                              height: isMobile ? 140 : 180,
                              bgcolor: 'grey.200',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <ThreeSixtyIcon sx={{ fontSize: 48, color: 'grey.400' }} />
                          </Box>
                        )}
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2" fontWeight="bold" noWrap>
                              {tour.title}
                            </Typography>
                            <OpenIcon fontSize="small" color="action" />
                          </Box>
                          {tour.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                mt: 0.5,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              {tour.description}
                            </Typography>
                          )}
                          <Chip
                            size="small"
                            icon={<ThreeSixtyIcon />}
                            label="360度VR"
                            color="primary"
                            variant="outlined"
                            sx={{ mt: 1 }}
                          />
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* バーチャルステージング */}
          {virtual_stagings && virtual_stagings.length > 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CompareIcon color="primary" />
                バーチャルステージング
              </Typography>
              <Grid container spacing={2}>
                {virtual_stagings.map((staging) => (
                  <Grid item xs={12} sm={6} md={4} key={staging.id}>
                    <Card sx={{ height: '100%', borderRadius: 2 }}>
                      <CardActionArea onClick={() => handleStagingClick(staging)}>
                        {staging.after_photo_url ? (
                          <CardMedia
                            component="img"
                            height={isMobile ? 140 : 180}
                            image={staging.after_photo_url}
                            alt={staging.title}
                            sx={{ objectFit: 'cover' }}
                          />
                        ) : staging.before_photo_url ? (
                          <CardMedia
                            component="img"
                            height={isMobile ? 140 : 180}
                            image={staging.before_photo_url}
                            alt={staging.title}
                            sx={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <Box
                            sx={{
                              height: isMobile ? 140 : 180,
                              bgcolor: 'grey.200',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <CompareIcon sx={{ fontSize: 48, color: 'grey.400' }} />
                          </Box>
                        )}
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2" fontWeight="bold" noWrap>
                              {staging.title}
                            </Typography>
                            <OpenIcon fontSize="small" color="action" />
                          </Box>
                          {staging.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                mt: 0.5,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              {staging.description}
                            </Typography>
                          )}
                          <Chip
                            size="small"
                            icon={<CompareIcon />}
                            label="ビフォーアフター"
                            color="secondary"
                            variant="outlined"
                            sx={{ mt: 1 }}
                          />
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
