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
  CompareArrows as CompareArrowsIcon,
  Public as PublicIcon,
  ContentCopy as CopyIcon,
  Search as SearchIcon,
  ImageNotSupported as ImageNotSupportedIcon
} from '@mui/icons-material';

export default function VirtualStagings() {
  const navigate = useNavigate();
  const [virtualStagings, setVirtualStagings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedStaging, setSelectedStaging] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchVirtualStagings();
  }, []);

  const fetchVirtualStagings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/virtual_stagings', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVirtualStagings(data);
        setError('');
      } else {
        setError('バーチャルステージングの取得に失敗しました');
      }
    } catch (err) {
      console.error('取得エラー:', err);
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, staging) => {
    setAnchorEl(event.currentTarget);
    setSelectedStaging(staging);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedStaging(null);
  };

  const handlePublish = async (staging) => {
    try {
      const response = await fetch(`/api/v1/rooms/${staging.room.id}/virtual_stagings/${staging.id}/publish`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setSnackbarMessage('バーチャルステージングを公開しました');
        fetchVirtualStagings();
      } else {
        setError('公開に失敗しました');
      }
    } catch (err) {
      console.error('公開エラー:', err);
      setError('ネットワークエラーが発生しました');
    }
    handleMenuClose();
  };

  const handleUnpublish = async (staging) => {
    try {
      const response = await fetch(`/api/v1/rooms/${staging.room.id}/virtual_stagings/${staging.id}/unpublish`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setSnackbarMessage('バーチャルステージングを非公開にしました');
        fetchVirtualStagings();
      } else {
        setError('非公開化に失敗しました');
      }
    } catch (err) {
      console.error('非公開化エラー:', err);
      setError('ネットワークエラーが発生しました');
    }
    handleMenuClose();
  };

  const copyPublicUrl = (stagingId) => {
    const url = `${window.location.origin}/virtual-staging/${stagingId}`;
    navigator.clipboard.writeText(url).then(() => {
      setSnackbarMessage('公開URLをコピーしました');
    });
    handleMenuClose();
  };

  // フィルタリング処理
  const filteredStagings = virtualStagings.filter((staging) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const buildingName = staging.room?.building?.name?.toLowerCase() || '';
    const roomNumber = staging.room?.room_number?.toLowerCase() || '';
    const stagingTitle = staging.title?.toLowerCase() || '';

    return buildingName.includes(query) ||
           roomNumber.includes(query) ||
           stagingTitle.includes(query);
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
          バーチャルステージング管理
        </Typography>
      </Box>

      {/* 検索フィールド */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="物件名、部屋番号、タイトルで検索..."
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

      {virtualStagings.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CompareArrowsIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            バーチャルステージングが登録されていません
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            部屋詳細ページからバーチャルステージングを登録してください
          </Typography>
        </Box>
      ) : filteredStagings.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <SearchIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            検索条件に一致するバーチャルステージングが見つかりません
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            検索条件を変更してください
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredStagings.map((staging) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={staging.id}>
              <Card sx={{
                width: 320,
                height: 380,
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* サムネイル画像 - Before画像を表示 */}
                {staging.thumbnail_url ? (
                  <CardMedia
                    component="img"
                    image={staging.thumbnail_url}
                    alt={staging.title}
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
                        {staging.title}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, staging)}
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
                      {staging.room?.building?.name} - {staging.room?.room_number}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip
                        label={staging.status === 'published' ? '公開中' : '下書き'}
                        size="small"
                        color={staging.status === 'published' ? 'success' : 'default'}
                      />
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {staging.updated_at ? new Date(staging.updated_at).toLocaleDateString('ja-JP') : '-'}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ pt: 0, pb: 1, px: 2 }}>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => navigate(`/room/${staging.room?.id}/virtual-staging/${staging.id}/viewer`)}
                    >
                      表示
                    </Button>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => window.open(`/room/${staging.room?.id}/virtual-staging/${staging.id}/edit`, '_blank')}
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
        {selectedStaging?.status === 'draft' ? (
          <MenuItem onClick={() => handlePublish(selectedStaging)}>
            <PublicIcon sx={{ mr: 1, fontSize: 20 }} />
            公開する
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleUnpublish(selectedStaging)}>
            <PublicIcon sx={{ mr: 1, fontSize: 20 }} />
            非公開にする
          </MenuItem>
        )}
        {selectedStaging?.status === 'published' && (
          <MenuItem onClick={() => copyPublicUrl(selectedStaging.id)}>
            <CopyIcon sx={{ mr: 1, fontSize: 20 }} />
            公開URLをコピー
          </MenuItem>
        )}
      </Menu>
    </Container>
  );
}
