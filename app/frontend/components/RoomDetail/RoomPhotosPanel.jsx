import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Chip,
  Fab,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  PhotoLibrary as PhotoLibraryIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ZoomIn as ZoomInIcon,
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  OpenInFull as OpenInFullIcon,
  CloseFullscreen as CloseFullscreenIcon,
  Edit as EditIcon,
  Image as ImageIcon,
  Download as DownloadIcon,
  ArrowBackIos as ArrowBackIosIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

// カテゴリ定義
const PHOTO_CATEGORIES = {
  all: { label: '全て', value: 'all' },
  interior: { label: '室内', value: 'interior' },
  living: { label: 'リビング', value: 'living' },
  kitchen: { label: 'キッチン', value: 'kitchen' },
  bathroom: { label: 'バスルーム', value: 'bathroom' },
  floor_plan: { label: '間取り図', value: 'floor_plan' },
  exterior: { label: '外観', value: 'exterior' },
  other: { label: 'その他', value: 'other' },
};

export default function RoomPhotosPanel({ roomId, buildingName, roomNumber, onPhotosUpdate, isMaximized, onToggleMaximize, isMobile = false }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [uploadCategory, setUploadCategory] = useState('interior');
  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false);
  const [photoToEdit, setPhotoToEdit] = useState(null);
  const [newCategory, setNewCategory] = useState('');

  // フィルタリングされた写真リスト
  const filteredPhotos = selectedCategory === 'all'
    ? photos
    : photos.filter(photo => photo.photo_type === selectedCategory);

  // 写真データ取得
  useEffect(() => {
    fetchPhotos();
  }, [roomId]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/rooms/${roomId}/room_photos`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPhotos(data.photos || data || []);
      }
    } catch (error) {
      console.error('写真データの取得に失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    try {
      setUploading(true);

      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          alert('画像ファイルのみアップロード可能です');
          continue;
        }

        const formData = new FormData();
        formData.append('room_photo[photo]', file);
        formData.append('room_photo[photo_type]', uploadCategory);

        const response = await fetch(`/api/v1/rooms/${roomId}/room_photos`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`ファイル ${file.name} のアップロードに失敗しました`);
        }
      }

      await fetchPhotos();
      setUploadDialogOpen(false);
      if (onPhotosUpdate) onPhotosUpdate();

    } catch (error) {
      console.error('写真アップロードエラー:', error);
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!confirm('この写真を削除してもよろしいですか？')) return;

    try {
      const response = await fetch(`/api/v1/rooms/${roomId}/room_photos/${photoId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('写真の削除に失敗しました');
      }

      await fetchPhotos();
      if (onPhotosUpdate) onPhotosUpdate();

    } catch (error) {
      console.error('写真削除エラー:', error);
      alert(error.message);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(Array.from(e.target.files));
    }
  };

  const openPreview = (photo) => {
    setSelectedPhoto(photo);
    setPreviewDialogOpen(true);
  };

  const handleEditCategory = (photo) => {
    setPhotoToEdit(photo);
    setNewCategory(photo.photo_type || 'interior');
    setEditCategoryDialogOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!photoToEdit) return;

    try {
      const response = await fetch(`/api/v1/rooms/${roomId}/room_photos/${photoToEdit.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_photo: {
            photo_type: newCategory,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('カテゴリの更新に失敗しました');
      }

      await fetchPhotos();
      setEditCategoryDialogOpen(false);
      setPhotoToEdit(null);
      if (onPhotosUpdate) onPhotosUpdate();

    } catch (error) {
      console.error('カテゴリ更新エラー:', error);
      alert(error.message);
    }
  };

  const handleDownloadPhoto = async () => {
    if (!selectedPhoto) return;

    try {
      const response = await fetch(selectedPhoto.photo_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // ファイル名を生成: 建物名_部屋番号_カテゴリ名_YYYYMMDD_HHMMSS.拡張子
      const now = new Date();
      const timestamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
        '_',
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0'),
      ].join('');

      // カテゴリ名を取得
      const categoryLabel = selectedPhoto.photo_type
        ? PHOTO_CATEGORIES[selectedPhoto.photo_type]?.label || selectedPhoto.photo_type
        : 'その他';

      // 拡張子を取得
      const urlParts = selectedPhoto.photo_url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      const extension = lastPart.includes('.') ? lastPart.split('.').pop() : 'jpg';

      // ファイル名の生成（日本語ファイル名として）
      const fileName = `${buildingName || '建物'}_${roomNumber || '部屋'}号室_${categoryLabel}_${timestamp}.${extension}`;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('写真ダウンロードエラー:', error);
      alert('写真のダウンロードに失敗しました');
    }
  };

  const handlePreviousPhoto = () => {
    if (!selectedPhoto) return;
    const currentIndex = filteredPhotos.findIndex(photo => photo.id === selectedPhoto.id);
    if (currentIndex > 0) {
      setSelectedPhoto(filteredPhotos[currentIndex - 1]);
    }
  };

  const handleNextPhoto = () => {
    if (!selectedPhoto) return;
    const currentIndex = filteredPhotos.findIndex(photo => photo.id === selectedPhoto.id);
    if (currentIndex < filteredPhotos.length - 1) {
      setSelectedPhoto(filteredPhotos[currentIndex + 1]);
    }
  };

  // キーボードイベントハンドラ
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!previewDialogOpen) return;

      if (e.key === 'ArrowLeft') {
        handlePreviousPhoto();
      } else if (e.key === 'ArrowRight') {
        handleNextPhoto();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [previewDialogOpen, selectedPhoto, photos, selectedCategory]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Box sx={{
        borderBottom: '1px solid #e0e0e0',
        bgcolor: 'background.paper',
      }}>
        <Box sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
        }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1, fontWeight: 600, fontSize: '1.05rem' }}>
            <PhotoLibraryIcon color="primary" sx={{ fontSize: 26 }} />
            部屋写真 ({filteredPhotos.length}/{photos.length})
          </Typography>

          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              // 現在選択中のカテゴリをデフォルトに設定（'all'の場合は'interior'）
              setUploadCategory(selectedCategory !== 'all' ? selectedCategory : 'interior');
              setUploadDialogOpen(true);
            }}
            sx={{ mr: 1 }}
          >
            写真追加
          </Button>

          {!isMobile && isMaximized && (
            <Tooltip title={isMaximized ? "最小化" : "最大化"}>
              <IconButton
                size="small"
                onClick={onToggleMaximize}
              >
                {isMaximized ? <CloseFullscreenIcon /> : <OpenInFullIcon />}
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* カテゴリタブ */}
        <Box sx={{ px: 2, pb: 1 }}>
          <Tabs
            value={selectedCategory}
            onChange={(e, newValue) => setSelectedCategory(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 40,
              '& .MuiTab-root': {
                minHeight: 40,
                py: 1,
                px: 2,
                fontSize: '0.875rem',
              }
            }}
          >
            {Object.entries(PHOTO_CATEGORIES).map(([key, category]) => (
              <Tab
                key={key}
                label={category.label}
                value={category.value}
              />
            ))}
          </Tabs>
        </Box>
      </Box>

      {/* 写真一覧 */}
      <Box sx={{ flex: 1, overflow: 'hidden', p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : filteredPhotos.length === 0 ? (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            textAlign: 'center',
            p: 2
          }}>
            <PhotoLibraryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography color="text.secondary" gutterBottom>
              写真が登録されていません
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => {
                // 現在選択中のカテゴリをデフォルトに設定（'all'の場合は'interior'）
                setUploadCategory(selectedCategory !== 'all' ? selectedCategory : 'interior');
                setUploadDialogOpen(true);
              }}
              sx={{ mt: 1 }}
            >
              写真を追加
            </Button>
          </Box>
        ) : (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: isMaximized
              ? 'repeat(4, 1fr)'
              : 'repeat(3, 1fr)',
            gap: 2,
            overflowY: 'auto',
            height: '100%',
            pb: 1,
            alignContent: 'start',
            '&::-webkit-scrollbar': {
              width: 8,
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: 'grey.100',
              borderRadius: 1,
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'grey.400',
              borderRadius: 1,
              '&:hover': {
                bgcolor: 'grey.500',
              },
            },
          }}>
            {filteredPhotos.map((photo, index) => (
              <Box
                key={photo.id}
                sx={{
                  position: 'relative',
                  width: '100%',
                  paddingBottom: '75%', // 4:3 aspect ratio
                }}
              >
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  borderRadius: 1,
                  overflow: 'hidden',
                  boxShadow: 2,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  }
                }}>
                  <img
                    src={photo.photo_url}
                    alt={`部屋写真 ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      cursor: 'pointer',
                    }}
                    onClick={() => openPreview(photo)}
                  />

                  {/* 写真のオーバーレイ */}
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    display: 'flex',
                    gap: 0.5,
                    p: 0.5,
                  }}>
                    <Tooltip title="カテゴリ編集">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCategory(photo);
                        }}
                        sx={{
                          bgcolor: 'rgba(25,118,210,0.6)',
                          color: 'white',
                          '&:hover': { bgcolor: 'rgba(25,118,210,0.8)' }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="削除">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePhoto(photo.id);
                        }}
                        sx={{
                          bgcolor: 'rgba(255,0,0,0.6)',
                          color: 'white',
                          '&:hover': { bgcolor: 'rgba(255,0,0,0.8)' }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* カテゴリラベル */}
                  {photo.photo_type && (
                    <Box sx={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                    }}>
                      <Chip
                        label={PHOTO_CATEGORIES[photo.photo_type]?.label || photo.photo_type}
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          bgcolor: 'rgba(25, 118, 210, 0.95)',
                          color: 'white'
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* アップロードダイアログ */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>写真アップロード</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 3, mt: 1 }}>
            <InputLabel>カテゴリ</InputLabel>
            <Select
              value={uploadCategory}
              label="カテゴリ"
              onChange={(e) => setUploadCategory(e.target.value)}
            >
              {Object.entries(PHOTO_CATEGORIES)
                .filter(([key]) => key !== 'all')
                .map(([key, category]) => (
                  <MenuItem key={key} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <Box
            sx={{
              border: '2px dashed',
              borderColor: dragActive ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              bgcolor: dragActive ? 'primary.50' : 'transparent',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'grey.50',
              }
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('room-photo-upload-input').click()}
          >
            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              写真をドラッグ&ドロップ
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              またはクリックしてファイルを選択
            </Typography>
            <Typography variant="caption" color="text.secondary">
              JPG, PNG, GIF形式をサポート
            </Typography>

            <input
              id="room-photo-upload-input"
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </Box>

          {uploading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>アップロード中...</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
            キャンセル
          </Button>
        </DialogActions>
      </Dialog>

      {/* 写真プレビューダイアログ */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth={false}
        PaperProps={{
          sx: {
            maxWidth: '90vw',
            maxHeight: '90vh',
            m: 2,
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'white',
          py: 1,
          px: 2,
        }}>
          <Typography variant="h6">写真プレビュー</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {selectedPhoto && (
              <Tooltip title="画像を編集">
                <IconButton
                  component={RouterLink}
                  to={`/rooms/${roomId}/photos/${selectedPhoto.id}/edit`}
                  sx={{ color: 'white' }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="ダウンロード">
              <IconButton
                onClick={handleDownloadPhoto}
                sx={{ color: 'white' }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <IconButton
              onClick={() => setPreviewDialogOpen(false)}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{
          p: 0,
          bgcolor: 'black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {selectedPhoto && (
            <>
              {/* 前の写真ボタン */}
              {filteredPhotos.findIndex(photo => photo.id === selectedPhoto.id) > 0 && (
                <IconButton
                  onClick={handlePreviousPhoto}
                  sx={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    width: 48,
                    height: 48,
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.7)',
                    },
                    zIndex: 1,
                  }}
                >
                  <ArrowBackIosIcon sx={{ ml: 0.5, fontSize: 24 }} />
                </IconButton>
              )}

              <img
                src={selectedPhoto.photo_url}
                alt="写真プレビュー"
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />

              {/* 次の写真ボタン */}
              {filteredPhotos.findIndex(photo => photo.id === selectedPhoto.id) < filteredPhotos.length - 1 && (
                <IconButton
                  onClick={handleNextPhoto}
                  sx={{
                    position: 'absolute',
                    right: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    width: 48,
                    height: 48,
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.7)',
                    },
                    zIndex: 1,
                  }}
                >
                  <ArrowForwardIosIcon sx={{ fontSize: 24 }} />
                </IconButton>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* カテゴリ編集ダイアログ */}
      <Dialog
        open={editCategoryDialogOpen}
        onClose={() => setEditCategoryDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>カテゴリ編集</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>カテゴリ</InputLabel>
            <Select
              value={newCategory}
              label="カテゴリ"
              onChange={(e) => setNewCategory(e.target.value)}
            >
              {Object.entries(PHOTO_CATEGORIES)
                .filter(([key]) => key !== 'all')
                .map(([key, category]) => (
                  <MenuItem key={key} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 1, px: 3, pb: 2 }}>
          {/* カテゴリ更新ボタン */}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button onClick={() => setEditCategoryDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdateCategory} variant="contained">
              更新
            </Button>
          </Box>

          {/* 画像編集リンク */}
          {photoToEdit && (
            <Button
              component={RouterLink}
              to={`/rooms/${roomId}/photos/${photoToEdit.id}/edit`}
              startIcon={<ImageIcon />}
              variant="outlined"
              fullWidth
              sx={{ textTransform: 'none' }}
            >
              画像を編集
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* フローティングアクションボタン（小画面用） */}
      {photos.length > 0 && (
        <Fab
          color="primary"
          size="small"
          onClick={() => {
            // 現在選択中のカテゴリをデフォルトに設定（'all'の場合は'interior'）
            setUploadCategory(selectedCategory !== 'all' ? selectedCategory : 'interior');
            setUploadDialogOpen(true);
          }}
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
}
