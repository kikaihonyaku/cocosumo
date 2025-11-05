import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Grid,
  Box,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  ViewInAr as ViewInArIcon,
  Public as PublicIcon,
  ContentCopy as CopyIcon,
  Search as SearchIcon,
  ImageNotSupported as ImageNotSupportedIcon
} from '@mui/icons-material';

export default function VrTours() {
  const navigate = useNavigate();
  const [vrTours, setVrTours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTour, setSelectedTour] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchVrTours();
  }, []);

  const fetchVrTours = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/vr_tours', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVrTours(data);
        setError('');
      } else {
        setError('VRツアーの取得に失敗しました');
      }
    } catch (err) {
      console.error('取得エラー:', err);
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, tour) => {
    setAnchorEl(event.currentTarget);
    setSelectedTour(tour);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTour(null);
  };

  const handlePublish = async (tourId) => {
    try {
      const response = await fetch(`/api/v1/vr_tours/bulk_action`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vr_tour_ids: [tourId],
          action: 'publish',
        }),
      });

      if (response.ok) {
        setSnackbarMessage('VRツアーを公開しました');
        fetchVrTours();
      } else {
        setError('公開に失敗しました');
      }
    } catch (err) {
      console.error('公開エラー:', err);
      setError('ネットワークエラーが発生しました');
    }
    handleMenuClose();
  };

  const handleUnpublish = async (tourId) => {
    try {
      const response = await fetch(`/api/v1/vr_tours/bulk_action`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vr_tour_ids: [tourId],
          action: 'unpublish',
        }),
      });

      if (response.ok) {
        setSnackbarMessage('VRツアーを非公開にしました');
        fetchVrTours();
      } else {
        setError('非公開化に失敗しました');
      }
    } catch (err) {
      console.error('非公開化エラー:', err);
      setError('ネットワークエラーが発生しました');
    }
    handleMenuClose();
  };

  const copyPublicUrl = (tourId) => {
    const url = `${window.location.origin}/vr/${tourId}`;
    navigator.clipboard.writeText(url).then(() => {
      setSnackbarMessage('公開URLをコピーしました');
    });
    handleMenuClose();
  };

  // フィルタリング処理
  const filteredVrTours = vrTours.filter((tour) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const buildingName = tour.room?.building?.name?.toLowerCase() || '';
    const roomNumber = tour.room?.room_number?.toLowerCase() || '';
    const tourTitle = tour.title?.toLowerCase() || '';

    return buildingName.includes(query) ||
           roomNumber.includes(query) ||
           tourTitle.includes(query);
  });

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1">
          VRツアー管理
        </Typography>
      </Box>

      {/* 検索フィールド */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="物件名、部屋番号、ツアー名で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {snackbarMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSnackbarMessage('')}>
          {snackbarMessage}
        </Alert>
      )}

      {vrTours.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ViewInArIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            VRツアーが登録されていません
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            部屋詳細ページからVRツアーを登録してください
          </Typography>
        </Box>
      ) : filteredVrTours.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <SearchIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            検索条件に一致するVRツアーが見つかりません
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            検索条件を変更してください
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredVrTours.map((tour) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={tour.id}>
              <Card sx={{
                width: 320,
                height: 380,
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* サムネイル画像 - 上部に表示 */}
                {tour.thumbnail_url ? (
                  <CardMedia
                    component="img"
                    image={tour.thumbnail_url}
                    alt={tour.title}
                    sx={{
                      height: 180,
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <Box sx={{
                    height: 180,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.100',
                    textAlign: 'center',
                    color: 'text.disabled'
                  }}>
                    <Box>
                      <ImageNotSupportedIcon sx={{ fontSize: 60, mb: 1 }} />
                      <Typography variant="body2" display="block">
                        No Image
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* コンテンツエリア */}
                <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
                  <CardContent sx={{ flexGrow: 1, pb: 1, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography
                        variant="h6"
                        component="h2"
                        sx={{
                          flexGrow: 1,
                          fontSize: '1rem',
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {tour.title}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, tour)}
                        sx={{ ml: 1, flexShrink: 0 }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {tour.room?.building?.name} - {tour.room?.room_number}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip
                        label={tour.status === 'published' ? '公開中' : '下書き'}
                        size="small"
                        color={tour.status === 'published' ? 'success' : 'default'}
                      />
                      <Chip
                        label={`${tour.scenes_count || 0}シーン`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {tour.updated_at ? new Date(tour.updated_at).toLocaleDateString('ja-JP') : '-'}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ pt: 0, pb: 1, px: 2 }}>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => navigate(`/room/${tour.room?.id}/vr-tour/${tour.id}/viewer`)}
                    >
                      表示
                    </Button>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => window.open(`/room/${tour.room?.id}/vr-tour/${tour.id}/edit`, '_blank')}
                    >
                      編集
                    </Button>
                  </CardActions>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedTour?.status === 'draft' ? (
          <MenuItem onClick={() => handlePublish(selectedTour.id)}>
            <PublicIcon sx={{ mr: 1, fontSize: 20 }} />
            公開する
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleUnpublish(selectedTour.id)}>
            <PublicIcon sx={{ mr: 1, fontSize: 20 }} />
            非公開にする
          </MenuItem>
        )}
        {selectedTour?.status === 'published' && (
          <MenuItem onClick={() => copyPublicUrl(selectedTour.id)}>
            <CopyIcon sx={{ mr: 1, fontSize: 20 }} />
            公開URLをコピー
          </MenuItem>
        )}
      </Menu>
    </Container>
  );
}
