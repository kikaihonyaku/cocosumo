import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Snackbar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  Public as PublicIcon,
  PublicOff as PublicOffIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import BeforeAfterSlider from '../components/VirtualStaging/BeforeAfterSlider';
import PhotoSelector from '../components/VirtualStaging/PhotoSelector';

const VirtualStagingEditor = () => {
  const { roomId, id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [roomPhotos, setRoomPhotos] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [publishDialog, setPublishDialog] = useState(false);
  const [beforePhotoDialog, setBeforePhotoDialog] = useState(false);
  const [afterPhotoDialog, setAfterPhotoDialog] = useState(false);
  const [virtualStaging, setVirtualStaging] = useState({
    title: '',
    description: '',
    before_photo_id: '',
    after_photo_id: '',
    status: 'draft',
  });

  const isEditMode = !!id;
  const isPublished = virtualStaging.status === 'published';

  // データ読み込み
  useEffect(() => {
    loadRoomPhotos();
    if (isEditMode) {
      loadVirtualStaging();
    }
  }, [roomId, id]);

  const loadRoomPhotos = async () => {
    try {
      const response = await fetch(`/api/v1/rooms/${roomId}/room_photos`);
      if (response.ok) {
        const data = await response.json();
        setRoomPhotos(data);
      }
    } catch (error) {
      console.error('Failed to load room photos:', error);
    }
  };

  const loadVirtualStaging = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/rooms/${roomId}/virtual_stagings/${id}`);
      if (response.ok) {
        const data = await response.json();
        setVirtualStaging(data);
      } else if (response.status === 401) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Failed to load virtual staging:', error);
      showSnackbar('読み込みに失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!virtualStaging.title) {
      showSnackbar('タイトルを入力してください', 'warning');
      return;
    }
    if (!virtualStaging.before_photo_id) {
      showSnackbar('Before画像を選択してください', 'warning');
      return;
    }
    if (!virtualStaging.after_photo_id) {
      showSnackbar('After画像を選択してください', 'warning');
      return;
    }

    try {
      setLoading(true);
      const url = isEditMode
        ? `/api/v1/rooms/${roomId}/virtual_stagings/${id}`
        : `/api/v1/rooms/${roomId}/virtual_stagings`;
      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ virtual_staging: virtualStaging }),
      });

      if (response.ok) {
        const data = await response.json();
        setVirtualStaging(data);
        showSnackbar(isEditMode ? '保存しました' : '作成しました', 'success');
        if (!isEditMode) {
          navigate(`/room/${roomId}/virtual-staging/${data.id}/edit`);
        }
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        const error = await response.json();
        showSnackbar(error.errors?.join(', ') || '保存に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      showSnackbar('保存に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/rooms/${roomId}/virtual_stagings/${id}/publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setVirtualStaging(data.virtual_staging);
        showSnackbar('公開しました', 'success');
        setPublishDialog(false);
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        showSnackbar('公開に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Failed to publish:', error);
      showSnackbar('公開に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublish = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/rooms/${roomId}/virtual_stagings/${id}/unpublish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setVirtualStaging(data.virtual_staging);
        showSnackbar('非公開にしました', 'success');
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        showSnackbar('非公開化に失敗しました', 'error');
      }
    } catch (error) {
      console.error('Failed to unpublish:', error);
      showSnackbar('非公開化に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    const publicUrl = `${window.location.origin}/virtual-staging/${id}`;
    navigator.clipboard.writeText(publicUrl);
    showSnackbar('URLをコピーしました', 'success');
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getBeforePhotoUrl = () => {
    const photo = roomPhotos.find((p) => p.id === virtualStaging.before_photo_id);
    return photo?.photo_url || virtualStaging.before_photo_url;
  };

  const getAfterPhotoUrl = () => {
    const photo = roomPhotos.find((p) => p.id === virtualStaging.after_photo_id);
    return photo?.photo_url || virtualStaging.after_photo_url;
  };

  const canShowPreview = virtualStaging.before_photo_id && virtualStaging.after_photo_id;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(`/room/${roomId}`)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            {isEditMode ? 'バーチャルステージング編集' : 'バーチャルステージング作成'}
          </Typography>
          {isPublished && (
            <Chip label="公開中" color="success" size="small" />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={loading}
          >
            保存
          </Button>
          {isEditMode && !isPublished && (
            <Button
              variant="contained"
              color="success"
              startIcon={<PublicIcon />}
              onClick={() => setPublishDialog(true)}
              disabled={loading}
            >
              公開
            </Button>
          )}
          {isEditMode && isPublished && (
            <>
              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyUrl}
              >
                URLコピー
              </Button>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<PublicOffIcon />}
                onClick={handleUnpublish}
                disabled={loading}
              >
                非公開化
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* フォームエリア */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          基本情報
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="タイトル"
            required
            fullWidth
            value={virtualStaging.title}
            onChange={(e) =>
              setVirtualStaging({ ...virtualStaging, title: e.target.value })
            }
          />
          <TextField
            label="説明"
            multiline
            rows={3}
            fullWidth
            value={virtualStaging.description || ''}
            onChange={(e) =>
              setVirtualStaging({ ...virtualStaging, description: e.target.value })
            }
          />
          <Box sx={{ display: 'flex', gap: 3 }}>
            {/* Before画像 */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Before画像 *
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setBeforePhotoDialog(true)}
                fullWidth
              >
                {virtualStaging.before_photo_id
                  ? roomPhotos.find((p) => p.id === virtualStaging.before_photo_id)?.caption || `画像 ${virtualStaging.before_photo_id}`
                  : '画像を選択してください'}
              </Button>
            </Box>

            {/* After画像 */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                After画像 *
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setAfterPhotoDialog(true)}
                fullWidth
              >
                {virtualStaging.after_photo_id
                  ? roomPhotos.find((p) => p.id === virtualStaging.after_photo_id)?.caption || `画像 ${virtualStaging.after_photo_id}`
                  : '画像を選択してください'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* プレビューエリア */}
      {canShowPreview && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            プレビュー
          </Typography>
          <BeforeAfterSlider
            beforeImageUrl={getBeforePhotoUrl()}
            afterImageUrl={getAfterPhotoUrl()}
            beforeLabel="Before"
            afterLabel="After"
            height="500px"
          />
        </Paper>
      )}

      {/* Before画像選択ダイアログ */}
      <Dialog
        open={beforePhotoDialog}
        onClose={() => setBeforePhotoDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Before画像を選択</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <PhotoSelector
              photos={roomPhotos}
              selectedPhotoId={virtualStaging.before_photo_id}
              onPhotoSelect={(photoId) => {
                setVirtualStaging({ ...virtualStaging, before_photo_id: photoId });
                setBeforePhotoDialog(false);
              }}
              label="Before画像を選択してください"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBeforePhotoDialog(false)}>キャンセル</Button>
        </DialogActions>
      </Dialog>

      {/* After画像選択ダイアログ */}
      <Dialog
        open={afterPhotoDialog}
        onClose={() => setAfterPhotoDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>After画像を選択</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <PhotoSelector
              photos={roomPhotos}
              selectedPhotoId={virtualStaging.after_photo_id}
              onPhotoSelect={(photoId) => {
                setVirtualStaging({ ...virtualStaging, after_photo_id: photoId });
                setAfterPhotoDialog(false);
              }}
              label="After画像を選択してください"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAfterPhotoDialog(false)}>キャンセル</Button>
        </DialogActions>
      </Dialog>

      {/* 公開確認ダイアログ */}
      <Dialog open={publishDialog} onClose={() => setPublishDialog(false)}>
        <DialogTitle>バーチャルステージングを公開</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            このバーチャルステージングを公開しますか？
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            公開URL: {window.location.origin}/virtual-staging/{id}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">タイトル:</Typography>
            <Typography>{virtualStaging.title}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishDialog(false)}>キャンセル</Button>
          <Button onClick={handlePublish} variant="contained" color="success">
            公開
          </Button>
        </DialogActions>
      </Dialog>

      {/* スナックバー */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default VirtualStagingEditor;
