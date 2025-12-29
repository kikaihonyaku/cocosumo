import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AutoAwesome as AiIcon,
} from '@mui/icons-material';
import PhotoSelector from './PhotoSelector';

/**
 * バリエーション管理パネル
 */
const VariationsPanel = ({
  virtualStagingId,
  variations = [],
  roomPhotos = [],
  beforePhotoId,
  onVariationsChange,
  onOpenAiDialog,
}) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [currentVariation, setCurrentVariation] = useState(null);
  const [styleName, setStyleName] = useState('');
  const [selectedPhotoId, setSelectedPhotoId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOpenAddDialog = () => {
    setStyleName('');
    setSelectedPhotoId(null);
    setError(null);
    setAddDialogOpen(true);
  };

  const handleOpenEditDialog = (variation) => {
    setCurrentVariation(variation);
    setStyleName(variation.style_name);
    setSelectedPhotoId(variation.after_photo_id);
    setError(null);
    setEditDialogOpen(true);
  };

  const handleAddVariation = async () => {
    if (!styleName.trim()) {
      setError('スタイル名を入力してください');
      return;
    }
    if (!selectedPhotoId) {
      setError('画像を選択してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/v1/virtual_stagings/${virtualStagingId}/variations`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            variation: {
              style_name: styleName,
              after_photo_id: selectedPhotoId,
            },
          }),
        }
      );

      if (response.ok) {
        const newVariation = await response.json();
        onVariationsChange([...variations, newVariation]);
        setAddDialogOpen(false);
      } else {
        const data = await response.json();
        setError(data.errors?.join(', ') || '追加に失敗しました');
      }
    } catch (err) {
      setError('追加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVariation = async () => {
    if (!styleName.trim()) {
      setError('スタイル名を入力してください');
      return;
    }
    if (!selectedPhotoId) {
      setError('画像を選択してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/v1/virtual_stagings/${virtualStagingId}/variations/${currentVariation.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            variation: {
              style_name: styleName,
              after_photo_id: selectedPhotoId,
            },
          }),
        }
      );

      if (response.ok) {
        const updatedVariation = await response.json();
        const newVariations = variations.map((v) =>
          v.id === updatedVariation.id ? updatedVariation : v
        );
        onVariationsChange(newVariations);
        setEditDialogOpen(false);
      } else {
        const data = await response.json();
        setError(data.errors?.join(', ') || '更新に失敗しました');
      }
    } catch (err) {
      setError('更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVariation = async (variationId) => {
    if (!confirm('このバリエーションを削除しますか？')) return;

    try {
      const response = await fetch(
        `/api/v1/virtual_stagings/${virtualStagingId}/variations/${variationId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (response.ok) {
        onVariationsChange(variations.filter((v) => v.id !== variationId));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const getPhotoById = (photoId) => {
    return roomPhotos.find((p) => p.id === photoId);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="600">
          スタイルバリエーション
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onOpenAiDialog && beforePhotoId && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<AiIcon />}
              onClick={onOpenAiDialog}
              sx={{
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                color: 'white',
                border: 'none',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5a6fd6 30%, #6a4292 90%)',
                  border: 'none',
                },
              }}
            >
              AI生成
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
          >
            追加
          </Button>
        </Box>
      </Box>

      {variations.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          バリエーションを追加すると、公開ページでスタイル切り替えが可能になります
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {variations.map((variation) => (
            <Grid item xs={6} sm={4} md={3} key={variation.id}>
              <Card sx={{ height: '100%' }}>
                <CardMedia
                  component="img"
                  height="100"
                  image={variation.after_photo_url || getPhotoById(variation.after_photo_id)?.photo_url}
                  alt={variation.style_name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ py: 1, px: 1.5 }}>
                  <Chip
                    label={variation.style_name}
                    size="small"
                    sx={{ fontSize: '0.75rem' }}
                  />
                </CardContent>
                <CardActions sx={{ pt: 0, px: 1, pb: 1 }}>
                  <Tooltip title="編集">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenEditDialog(variation)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="削除">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteVariation(variation.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 追加ダイアログ */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>バリエーションを追加</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            label="スタイル名"
            placeholder="例: モダン、ナチュラル、北欧風"
            fullWidth
            value={styleName}
            onChange={(e) => setStyleName(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <Typography variant="subtitle2" gutterBottom>
            After画像を選択
          </Typography>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => setPhotoDialogOpen(true)}
            sx={{ mb: 1 }}
          >
            {selectedPhotoId
              ? getPhotoById(selectedPhotoId)?.caption || `画像 ${selectedPhotoId}`
              : '画像を選択してください'}
          </Button>
          {selectedPhotoId && (
            <Box sx={{ mt: 1 }}>
              <img
                src={getPhotoById(selectedPhotoId)?.photo_url}
                alt="Selected"
                style={{ maxWidth: '100%', maxHeight: 150, objectFit: 'contain' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={handleAddVariation}
            disabled={loading}
          >
            追加
          </Button>
        </DialogActions>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>バリエーションを編集</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            label="スタイル名"
            fullWidth
            value={styleName}
            onChange={(e) => setStyleName(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <Typography variant="subtitle2" gutterBottom>
            After画像を選択
          </Typography>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => setPhotoDialogOpen(true)}
            sx={{ mb: 1 }}
          >
            {selectedPhotoId
              ? getPhotoById(selectedPhotoId)?.caption || `画像 ${selectedPhotoId}`
              : '画像を選択してください'}
          </Button>
          {selectedPhotoId && (
            <Box sx={{ mt: 1 }}>
              <img
                src={getPhotoById(selectedPhotoId)?.photo_url}
                alt="Selected"
                style={{ maxWidth: '100%', maxHeight: 150, objectFit: 'contain' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={handleUpdateVariation}
            disabled={loading}
          >
            更新
          </Button>
        </DialogActions>
      </Dialog>

      {/* 写真選択ダイアログ */}
      <Dialog
        open={photoDialogOpen}
        onClose={() => setPhotoDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>画像を選択</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <PhotoSelector
              photos={roomPhotos}
              selectedPhotoId={selectedPhotoId}
              onPhotoSelect={(photoId) => {
                setSelectedPhotoId(photoId);
                setPhotoDialogOpen(false);
              }}
              label="After画像を選択してください"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoDialogOpen(false)}>キャンセル</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VariationsPanel;
