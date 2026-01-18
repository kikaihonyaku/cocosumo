import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FormControlLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import {
  ThreeSixty as VrIcon,
  Chair as StagingIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import axios from 'axios';

export default function ContentSelector({
  roomId,
  publicationId,
  selectedVrTourIds,
  selectedVirtualStagingIds,
  onVrTourSelectionChange,
  onVirtualStagingSelectionChange
}) {
  const navigate = useNavigate();
  const [vrTours, setVrTours] = useState([]);
  const [virtualStagings, setVirtualStagings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewDialog, setPreviewDialog] = useState({ open: false, type: null, item: null });

  // 公開ページ編集のコンテンツタブに戻るためのURL
  const getReturnUrl = () => {
    if (publicationId) {
      return `/room/${roomId}/property-publication/${publicationId}/edit?tab=content`;
    }
    return null;
  };

  const navigateToVirtualStaging = (path) => {
    const returnUrl = getReturnUrl();
    if (returnUrl) {
      navigate(`${path}?returnUrl=${encodeURIComponent(returnUrl)}`);
    } else {
      navigate(path);
    }
  };

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

  const handlePreview = (type, item) => {
    setPreviewDialog({ open: true, type, item });
  };

  const handleClosePreview = () => {
    setPreviewDialog({ open: false, type: null, item: null });
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
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VrIcon color="primary" />
                VRツアー
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => navigateToVirtualStaging(`/room/${roomId}/vr-tour/new`)}
              >
                新規作成
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              公開ページに埋め込むVRツアーを選択してください
            </Typography>

            {vrTours.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                この部屋にはまだVRツアーが作成されていません。
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => navigateToVirtualStaging(`/room/${roomId}/vr-tour/new`)}
                  sx={{ ml: 1 }}
                >
                  作成する
                </Button>
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
                      '&:hover': { bgcolor: 'action.hover' },
                      position: 'relative'
                    }}
                    onClick={() => handleVrTourToggle(tour.id)}
                  >
                    <Checkbox
                      checked={selectedVrTourIds.includes(tour.id)}
                      sx={{
                        alignSelf: 'center',
                        ml: 1,
                        '&.Mui-checked': {
                          color: 'primary.main'
                        },
                        '& .MuiSvgIcon-root': {
                          fontSize: 28
                        }
                      }}
                    />
                    <CardMedia
                      component="img"
                      sx={{ width: 120, height: 120, objectFit: 'cover' }}
                      image={tour.thumbnail_url || '/placeholder-vr.png'}
                      alt={tour.title}
                    />
                    <CardContent sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {tour.title}
                        </Typography>
                        <Chip
                          label={tour.status === 'published' ? '公開中' : '下書き'}
                          size="small"
                          color={tour.status === 'published' ? 'success' : 'default'}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                      {tour.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {tour.description}
                        </Typography>
                      )}
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={`${tour.scenes_count || tour.vr_scenes?.length || 0}シーン`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        display: 'flex',
                        gap: 0.5
                      }}
                    >
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToVirtualStaging(`/room/${roomId}/vr-tour/${tour.id}/edit`);
                        }}
                        sx={{
                          bgcolor: 'background.paper',
                          boxShadow: 1,
                          '&:hover': {
                            bgcolor: 'secondary.main',
                            color: 'white'
                          }
                        }}
                        size="small"
                        title="編集"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview('vr_tour', tour);
                        }}
                        sx={{
                          bgcolor: 'background.paper',
                          boxShadow: 1,
                          '&:hover': {
                            bgcolor: 'primary.main',
                            color: 'white'
                          }
                        }}
                        size="small"
                        title="プレビュー"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Box>
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
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StagingIcon color="primary" />
                バーチャルステージング
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => navigateToVirtualStaging(`/room/${roomId}/virtual-staging/new`)}
              >
                新規作成
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              公開ページに埋め込むバーチャルステージングを選択してください
            </Typography>

            {virtualStagings.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                この部屋にはまだバーチャルステージングが作成されていません。
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => navigateToVirtualStaging(`/room/${roomId}/virtual-staging/new`)}
                  sx={{ ml: 1 }}
                >
                  作成する
                </Button>
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
                      '&:hover': { bgcolor: 'action.hover' },
                      position: 'relative'
                    }}
                    onClick={() => handleVirtualStagingToggle(staging.id)}
                  >
                    <Checkbox
                      checked={selectedVirtualStagingIds.includes(staging.id)}
                      sx={{
                        alignSelf: 'center',
                        ml: 1,
                        '&.Mui-checked': {
                          color: 'primary.main'
                        },
                        '& .MuiSvgIcon-root': {
                          fontSize: 28
                        }
                      }}
                    />
                    <CardMedia
                      component="img"
                      sx={{ width: 120, height: 120, objectFit: 'cover' }}
                      image={staging.thumbnail_url || '/placeholder-staging.png'}
                      alt={staging.title}
                    />
                    <CardContent sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {staging.title}
                        </Typography>
                        <Chip
                          label={staging.status === 'published' ? '公開中' : '下書き'}
                          size="small"
                          color={staging.status === 'published' ? 'success' : 'default'}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                      {staging.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {staging.description}
                        </Typography>
                      )}
                    </CardContent>
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        display: 'flex',
                        gap: 0.5
                      }}
                    >
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToVirtualStaging(`/room/${roomId}/virtual-staging/${staging.id}/edit`);
                        }}
                        sx={{
                          bgcolor: 'background.paper',
                          boxShadow: 1,
                          '&:hover': {
                            bgcolor: 'secondary.main',
                            color: 'white'
                          }
                        }}
                        size="small"
                        title="編集"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview('virtual_staging', staging);
                        }}
                        sx={{
                          bgcolor: 'background.paper',
                          boxShadow: 1,
                          '&:hover': {
                            bgcolor: 'primary.main',
                            color: 'white'
                          }
                        }}
                        size="small"
                        title="プレビュー"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Box>
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

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog.open}
        onClose={handleClosePreview}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {previewDialog.type === 'vr_tour' ? <VrIcon /> : <StagingIcon />}
            <Typography variant="h6">
              {previewDialog.item?.title || 'プレビュー'}
            </Typography>
          </Box>
          <IconButton onClick={handleClosePreview} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewDialog.type === 'vr_tour' && previewDialog.item && (
            <Box
              component="iframe"
              src={`/room/${roomId}/vr-tour/${previewDialog.item.id}/viewer`}
              sx={{
                width: '100%',
                height: 600,
                border: 'none',
                borderRadius: 1
              }}
            />
          )}
          {previewDialog.type === 'virtual_staging' && previewDialog.item && (
            <Box
              component="iframe"
              src={`/room/${roomId}/virtual-staging/${previewDialog.item.id}/viewer`}
              sx={{
                width: '100%',
                height: 600,
                border: 'none',
                borderRadius: 1
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
