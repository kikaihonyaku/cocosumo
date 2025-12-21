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
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';
import {
  PhotoLibrary as PhotoLibraryIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  OpenInFull as OpenInFullIcon,
  CloseFullscreen as CloseFullscreenIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  ArrowBackIos as ArrowBackIosIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  MeetingRoom as MeetingRoomIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

// カテゴリ定義
const PHOTO_CATEGORIES = {
  all: { label: '全て', value: 'all' },
  exterior: { label: '外観', value: 'exterior' },
  entrance: { label: 'エントランス', value: 'entrance' },
  common_area: { label: '共用部', value: 'common_area' },
  parking: { label: '駐車場', value: 'parking' },
  surroundings: { label: '周辺環境', value: 'surroundings' },
  other: { label: 'その他', value: 'other' },
};

// RoomPhoto のカテゴリ定義
const ROOM_PHOTO_CATEGORIES = {
  interior: { label: '室内', value: 'interior' },
  living: { label: 'リビング', value: 'living' },
  kitchen: { label: 'キッチン', value: 'kitchen' },
  bathroom: { label: 'バスルーム', value: 'bathroom' },
  floor_plan: { label: '間取り図', value: 'floor_plan' },
  exterior: { label: '外観', value: 'exterior' },
  other: { label: 'その他', value: 'other' },
};

export default function BuildingPhotosPanel({ propertyId, buildingName, rooms = [], onPhotosUpdate, isMaximized, onToggleMaximize, isMobile = false }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [uploadCategory, setUploadCategory] = useState('exterior');
  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false);
  const [photoToEdit, setPhotoToEdit] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  // 部屋への移動機能用
  const [moveToRoomDialogOpen, setMoveToRoomDialogOpen] = useState(false);
  const [moveTargetRoomId, setMoveTargetRoomId] = useState('');
  const [moveTargetCategory, setMoveTargetCategory] = useState('other');
  const [moving, setMoving] = useState(false);

  // フィルタリングされた写真リスト
  const filteredPhotos = selectedCategory === 'all'
    ? photos
    : photos.filter(photo => photo.photo_type === selectedCategory);

  // 写真データ取得
  useEffect(() => {
    fetchPhotos();
  }, [propertyId]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/buildings/${propertyId}/photos`, {
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
        formData.append('photo', file);
        formData.append('photo_type', uploadCategory);

        const response = await fetch(`/api/v1/buildings/${propertyId}/photos`, {
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
      const response = await fetch(`/api/v1/buildings/${propertyId}/photos/${photoId}`, {
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
    setNewCategory(photo.photo_type || 'exterior');
    setEditCategoryDialogOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!photoToEdit) return;

    try {
      const response = await fetch(`/api/v1/buildings/${propertyId}/photos/${photoToEdit.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photo_type: newCategory,
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

  // 部屋移動ダイアログを開く
  const handleOpenMoveToRoomDialog = (photo) => {
    setPhotoToEdit(photo);

    // 元のカテゴリに合わせてデフォルトの移動先カテゴリを設定
    if (photo.photo_type === 'exterior') {
      setMoveTargetCategory('exterior');
    } else {
      setMoveTargetCategory('other');
    }

    // デフォルトで最初の部屋を選択
    if (rooms.length > 0) {
      setMoveTargetRoomId(rooms[0].id);
    }

    setMoveToRoomDialogOpen(true);
  };

  // 部屋への移動を実行
  const handleMoveToRoom = async () => {
    if (!photoToEdit || !moveTargetRoomId) return;

    setMoving(true);
    try {
      const response = await fetch(`/api/v1/buildings/${propertyId}/photos/${photoToEdit.id}/move_to_room`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_room_id: moveTargetRoomId,
          photo_type: moveTargetCategory,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '写真の移動に失敗しました');
      }

      await fetchPhotos();
      setMoveToRoomDialogOpen(false);
      setEditCategoryDialogOpen(false);
      setPhotoToEdit(null);
      if (onPhotosUpdate) onPhotosUpdate();
      alert('写真を部屋に移動しました');

    } catch (error) {
      console.error('写真移動エラー:', error);
      alert(error.message);
    } finally {
      setMoving(false);
    }
  };

  const handleDownloadPhoto = async () => {
    if (!selectedPhoto) return;

    try {
      const photoUrl = selectedPhoto.url || selectedPhoto.image_url;
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // ファイル名を生成: 建物名_カテゴリ名_YYYYMMDD_HHMMSS.拡張子
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
      const urlParts = photoUrl.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      const extension = lastPart.includes('.') ? lastPart.split('.').pop() : 'jpg';

      // ファイル名の生成
      const fileName = `${buildingName || '建物'}_${categoryLabel}_${timestamp}.${extension}`;
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
            外観写真 ({filteredPhotos.length}/{photos.length})
          </Typography>

          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setUploadDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            追加
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
              onClick={() => setUploadDialogOpen(true)}
              sx={{ mt: 1 }}
            >
              写真を追加
            </Button>
          </Box>
        ) : (
          <Box sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            overflowY: 'hidden',
            height: '100%',
            pb: 1,
            '&::-webkit-scrollbar': {
              height: 8,
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
                  flexShrink: 0,
                  width: isMaximized ? 300 : 200,
                  height: isMaximized ? 250 : 180,
                }}
              >
                <Box sx={{
                  position: 'relative',
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
                    src={photo.thumbnail_url || photo.url || photo.image_url}
                    alt={`外観写真 ${index + 1}`}
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
            onClick={() => document.getElementById('photo-upload-input').click()}
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
              id="photo-upload-input"
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
          <Typography component="span" variant="h6">写真プレビュー</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {selectedPhoto && (
              <Tooltip title="画像を編集">
                <IconButton
                  component={RouterLink}
                  to={`/buildings/${propertyId}/photos/${selectedPhoto.id}/edit`}
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
                src={selectedPhoto.url || selectedPhoto.image_url}
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
              to={`/buildings/${propertyId}/photos/${photoToEdit.id}/edit`}
              startIcon={<EditIcon />}
              variant="outlined"
              fullWidth
              sx={{ textTransform: 'none' }}
            >
              画像を編集
            </Button>
          )}

          {/* 部屋に移動ボタン */}
          {photoToEdit && rooms.length > 0 && (
            <Button
              onClick={() => handleOpenMoveToRoomDialog(photoToEdit)}
              startIcon={<MeetingRoomIcon />}
              variant="outlined"
              color="secondary"
              fullWidth
              sx={{ textTransform: 'none' }}
            >
              部屋写真に移動
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 部屋への移動ダイアログ */}
      <Dialog
        open={moveToRoomDialogOpen}
        onClose={() => !moving && setMoveToRoomDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MeetingRoomIcon color="secondary" />
          部屋写真に移動
        </DialogTitle>
        <DialogContent>
          {rooms.length === 0 ? (
            <Alert severity="warning" sx={{ mt: 2 }}>
              この建物には部屋が登録されていません。
              先に部屋を追加してください。
            </Alert>
          ) : (
            <Box sx={{ py: 2 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                この写真を選択した部屋の写真に移動します。
                移動後は建物写真から削除されます。
              </Alert>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>移動先の部屋</InputLabel>
                <Select
                  value={moveTargetRoomId}
                  label="移動先の部屋"
                  onChange={(e) => setMoveTargetRoomId(e.target.value)}
                >
                  {rooms.map((room) => (
                    <MenuItem key={room.id} value={room.id}>
                      {room.room_number}号室
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>移動先のカテゴリ</InputLabel>
                <Select
                  value={moveTargetCategory}
                  label="移動先のカテゴリ"
                  onChange={(e) => setMoveTargetCategory(e.target.value)}
                >
                  {Object.entries(ROOM_PHOTO_CATEGORIES).map(([key, category]) => (
                    <MenuItem key={key} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setMoveToRoomDialogOpen(false)}
            disabled={moving}
          >
            キャンセル
          </Button>
          {rooms.length > 0 && (
            <Button
              onClick={handleMoveToRoom}
              variant="contained"
              color="secondary"
              disabled={moving || !moveTargetRoomId}
              startIcon={moving ? <CircularProgress size={20} /> : <MeetingRoomIcon />}
            >
              {moving ? '移動中...' : '移動する'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

    </Box>
  );
}
