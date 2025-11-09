import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Checkbox,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  FormControlLabel
} from '@mui/material';
import {
  ThreeSixty as VrIcon,
  Chair as StagingIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import axios from 'axios';

export default function ContentSelector({
  roomId,
  selectedVrTourIds,
  selectedVirtualStagingIds,
  onVrTourSelectionChange,
  onVirtualStagingSelectionChange
}) {
  const [vrTours, setVrTours] = useState([]);
  const [virtualStagings, setVirtualStagings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadContent();
  }, [roomId]);

  const loadContent = async () => {
    try {
      setLoading(true);

      // Load VR tours
      const vrResponse = await axios.get(`/api/v1/rooms/${roomId}/vr_tours`);
      setVrTours(vrResponse.data.filter(vr => !vr.discarded_at));

      // Load virtual stagings
      const stagingResponse = await axios.get(`/api/v1/rooms/${roomId}/virtual_stagings`);
      setVirtualStagings(stagingResponse.data.filter(vs => !vs.discarded_at));
    } catch (error) {
      console.error('Error loading content:', error);
      setError('コンテンツの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleVrTourToggle = (tourId) => {
    const newSelection = selectedVrTourIds.includes(tourId)
      ? selectedVrTourIds.filter(id => id !== tourId)
      : [...selectedVrTourIds, tourId];
    onVrTourSelectionChange(newSelection);
  };

  const handleVirtualStagingToggle = (stagingId) => {
    const newSelection = selectedVirtualStagingIds.includes(stagingId)
      ? selectedVirtualStagingIds.filter(id => id !== stagingId)
      : [...selectedVirtualStagingIds, stagingId];
    onVirtualStagingSelectionChange(newSelection);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* VRツアー */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VrIcon color="primary" />
              VRツアー
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              公開ページに埋め込むVRツアーを選択してください
            </Typography>

            {vrTours.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                この部屋にはまだVRツアーが作成されていません。
              </Alert>
            ) : (
              <Box sx={{ mt: 2 }}>
                {vrTours.map((tour) => (
                  <Card
                    key={tour.id}
                    sx={{
                      display: 'flex',
                      mb: 2,
                      cursor: 'pointer',
                      border: selectedVrTourIds.includes(tour.id) ? '2px solid' : '1px solid',
                      borderColor: selectedVrTourIds.includes(tour.id) ? 'primary.main' : 'divider',
                      bgcolor: selectedVrTourIds.includes(tour.id) ? 'action.selected' : 'background.paper',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => handleVrTourToggle(tour.id)}
                  >
                    <Checkbox
                      checked={selectedVrTourIds.includes(tour.id)}
                      sx={{ alignSelf: 'center', ml: 1 }}
                    />
                    <CardMedia
                      component="img"
                      sx={{ width: 120, height: 120, objectFit: 'cover' }}
                      image={tour.thumbnail_url || '/placeholder-vr.png'}
                      alt={tour.title}
                    />
                    <CardContent sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {tour.title}
                      </Typography>
                      {tour.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {tour.description}
                        </Typography>
                      )}
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={`${tour.vr_tour_scenes?.length || 0}シーン`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            {selectedVrTourIds.length > 0 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {selectedVrTourIds.length}件のVRツアーを選択中
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* バーチャルステージング */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StagingIcon color="primary" />
              バーチャルステージング
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              公開ページに埋め込むバーチャルステージングを選択してください
            </Typography>

            {virtualStagings.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                この部屋にはまだバーチャルステージングが作成されていません。
              </Alert>
            ) : (
              <Box sx={{ mt: 2 }}>
                {virtualStagings.map((staging) => (
                  <Card
                    key={staging.id}
                    sx={{
                      display: 'flex',
                      mb: 2,
                      cursor: 'pointer',
                      border: selectedVirtualStagingIds.includes(staging.id) ? '2px solid' : '1px solid',
                      borderColor: selectedVirtualStagingIds.includes(staging.id) ? 'primary.main' : 'divider',
                      bgcolor: selectedVirtualStagingIds.includes(staging.id) ? 'action.selected' : 'background.paper',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => handleVirtualStagingToggle(staging.id)}
                  >
                    <Checkbox
                      checked={selectedVirtualStagingIds.includes(staging.id)}
                      sx={{ alignSelf: 'center', ml: 1 }}
                    />
                    <CardMedia
                      component="img"
                      sx={{ width: 120, height: 120, objectFit: 'cover' }}
                      image={staging.thumbnail_url || '/placeholder-staging.png'}
                      alt={staging.title}
                    />
                    <CardContent sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {staging.title}
                      </Typography>
                      {staging.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {staging.description}
                        </Typography>
                      )}
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={`${staging.virtual_staging_scenes?.length || 0}シーン`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            {selectedVirtualStagingIds.length > 0 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {selectedVirtualStagingIds.length}件のバーチャルステージングを選択中
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
