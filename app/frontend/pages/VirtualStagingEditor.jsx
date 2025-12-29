import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
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
  AppBar,
  Toolbar,
  ThemeProvider,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  Public as PublicIcon,
  PublicOff as PublicOffIcon,
  ContentCopy as ContentCopyIcon,
  VisibilityOff as UnpublishIcon,
  Edit as EditIcon,
  AutoAwesome as AiIcon,
} from '@mui/icons-material';
import BeforeAfterSlider from '../components/VirtualStaging/BeforeAfterSlider';
import PhotoSelector from '../components/VirtualStaging/PhotoSelector';
import AiStagingDialog from '../components/VirtualStaging/AiStagingDialog';
import SharePanel from '../components/VirtualStaging/SharePanel';
import VariationsPanel from '../components/VirtualStaging/VariationsPanel';
import AnnotationsPanel from '../components/VirtualStaging/AnnotationsPanel';
import muiTheme from '../theme/muiTheme';

const VirtualStagingEditor = () => {
  const { roomId, id } = useParams();
  const navigate = useNavigate();
  const isMdUp = useMediaQuery(muiTheme.breakpoints.up('md'));
  const [loading, setLoading] = useState(false);
  const [roomPhotos, setRoomPhotos] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [publishDialog, setPublishDialog] = useState(false);
  const [beforePhotoDialog, setBeforePhotoDialog] = useState(false);
  const [afterPhotoDialog, setAfterPhotoDialog] = useState(false);
  const [aiStagingDialog, setAiStagingDialog] = useState(false);
  const [virtualStaging, setVirtualStaging] = useState({
    title: '',
    description: '',
    before_photo_id: '',
    after_photo_id: '',
    status: 'draft',
    annotations: [],
  });
  const [variations, setVariations] = useState([]);
  const [annotations, setAnnotations] = useState([]);

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
        setVariations(data.variations || []);
        setAnnotations(data.annotations || []);
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
        body: JSON.stringify({
          virtual_staging: {
            ...virtualStaging,
            annotations: annotations,
          },
        }),
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
    const publicUrl = `${window.location.origin}/virtual-staging/${virtualStaging.public_id}`;
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
    <ThemeProvider theme={muiTheme}>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* ヘッダー */}
        <AppBar position="static" elevation={0} sx={{
          bgcolor: 'primary.main',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          borderRadius: '12px 12px 0 0',
        }}>
          <Toolbar variant="dense" sx={{ minHeight: 52 }}>
            <IconButton
              edge="start"
              onClick={() => navigate(`/room/${roomId}`)}
              sx={{ mr: 1, color: 'white' }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h6" component="h1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                {isEditMode ? 'バーチャルステージング編集' : 'バーチャルステージング作成'}
              </Typography>
              {isEditMode && virtualStaging.title && (
                <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.85rem' }}>
                  {virtualStaging.title}
                </Typography>
              )}
            </Box>

            {/* ステータス表示 */}
            {isEditMode && (
              <Chip
                label={isPublished ? '公開中' : '下書き'}
                color={isPublished ? 'success' : 'default'}
                icon={isPublished ? <PublicIcon /> : <UnpublishIcon />}
                sx={{ mr: { xs: 0.5, md: 2 }, display: { xs: 'none', sm: 'flex' } }}
              />
            )}

            {/* 保存ボタン */}
            <Button
              variant="contained"
              color="secondary"
              startIcon={isMdUp ? <SaveIcon /> : null}
              onClick={handleSave}
              disabled={loading}
              sx={{
                mr: { xs: 0.5, md: 2 },
                minWidth: { xs: 'auto', md: 'auto' },
                px: { xs: 1, md: 2 }
              }}
            >
              {isMdUp ? '保存' : <SaveIcon />}
            </Button>

            {/* 公開ボタン */}
            {isEditMode && !isPublished && (
              <Button
                variant="contained"
                color="success"
                startIcon={isMdUp ? <PublicIcon /> : null}
                onClick={() => setPublishDialog(true)}
                disabled={loading}
                sx={{
                  mr: { xs: 0, md: 2 },
                  minWidth: { xs: 'auto', md: 'auto' },
                  px: { xs: 1, md: 2 },
                  bgcolor: 'success.main',
                  '&:hover': {
                    bgcolor: 'success.dark',
                  }
                }}
              >
                {isMdUp ? '公開する' : <PublicIcon />}
              </Button>
            )}

            {/* 公開中のボタン群 */}
            {isEditMode && isPublished && (
              <>
                <Box sx={{ mr: { xs: 0.5, md: 1 } }}>
                  <SharePanel
                    publicUrl={`${window.location.origin}/virtual-staging/${virtualStaging.public_id}`}
                    title={virtualStaging.title}
                    variant="icon"
                  />
                </Box>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={isMdUp ? <UnpublishIcon /> : null}
                  onClick={handleUnpublish}
                  disabled={loading}
                  sx={{
                    mr: { xs: 0, md: 2 },
                    minWidth: { xs: 'auto', md: 'auto' },
                    px: { xs: 1, md: 2 },
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  {isMdUp ? '非公開にする' : <UnpublishIcon />}
                </Button>
              </>
            )}
          </Toolbar>
        </AppBar>

        {/* メインコンテンツ */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <Container maxWidth="lg" sx={{ py: 4 }}>

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
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => setBeforePhotoDialog(true)}
                  fullWidth
                >
                  {virtualStaging.before_photo_id
                    ? roomPhotos.find((p) => p.id === virtualStaging.before_photo_id)?.caption || `画像 ${virtualStaging.before_photo_id}`
                    : '画像を選択してください'}
                </Button>
                {virtualStaging.before_photo_id && (
                  <Tooltip title="画像を編集">
                    <IconButton
                      component={RouterLink}
                      to={`/rooms/${roomId}/photos/${virtualStaging.before_photo_id}/edit`}
                      color="primary"
                      sx={{
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>

            {/* After画像 */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                After画像 *
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => setAfterPhotoDialog(true)}
                  sx={{ flex: 1 }}
                >
                  {virtualStaging.after_photo_id
                    ? roomPhotos.find((p) => p.id === virtualStaging.after_photo_id)?.caption || `画像 ${virtualStaging.after_photo_id}`
                    : '画像を選択'}
                </Button>
                <Tooltip title="AIでAfter画像を自動生成">
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => setAiStagingDialog(true)}
                    disabled={!virtualStaging.before_photo_id}
                    sx={{
                      minWidth: 'auto',
                      px: 2,
                      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #5a6fd6 30%, #6a4292 90%)',
                      },
                    }}
                  >
                    <AiIcon sx={{ mr: { xs: 0, sm: 0.5 } }} />
                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                      AI生成
                    </Box>
                  </Button>
                </Tooltip>
                {virtualStaging.after_photo_id && (
                  <Tooltip title="画像を編集">
                    <IconButton
                      component={RouterLink}
                      to={`/rooms/${roomId}/photos/${virtualStaging.after_photo_id}/edit`}
                      color="primary"
                      sx={{
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
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
            annotations={annotations}
          />
        </Paper>
      )}

      {/* バリエーション管理（編集モードのみ） */}
      {isEditMode && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <VariationsPanel
            virtualStagingId={id}
            variations={variations}
            roomPhotos={roomPhotos}
            beforePhotoId={virtualStaging.before_photo_id}
            onVariationsChange={setVariations}
            onOpenAiDialog={() => setAiStagingDialog(true)}
          />
        </Paper>
      )}

      {/* アノテーション管理（編集モード・プレビュー可能時） */}
      {isEditMode && canShowPreview && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <AnnotationsPanel
            annotations={annotations}
            onAnnotationsChange={setAnnotations}
            beforeImageUrl={getBeforePhotoUrl()}
            afterImageUrl={getAfterPhotoUrl()}
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
            公開URL: {window.location.origin}/virtual-staging/{virtualStaging.public_id}
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

      {/* AI生成ダイアログ */}
      <AiStagingDialog
        open={aiStagingDialog}
        onClose={() => setAiStagingDialog(false)}
        beforePhoto={roomPhotos.find((p) => p.id === virtualStaging.before_photo_id)}
        roomId={roomId}
        onGenerated={(savedPhoto) => {
          // 新しく生成した写真を写真リストに追加
          setRoomPhotos((prev) => [...prev, savedPhoto]);
          // After画像として設定
          setVirtualStaging((prev) => ({
            ...prev,
            after_photo_id: savedPhoto.id,
          }));
          showSnackbar('AI生成画像をAfterに設定しました', 'success');
        }}
      />

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
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default VirtualStagingEditor;
