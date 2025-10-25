import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  PhotoLibrary as PhotoLibraryIcon,
  ZoomIn as ZoomInIcon,
  Close as CloseIcon,
  OpenInFull as OpenInFullIcon,
  CloseFullscreen as CloseFullscreenIcon,
} from '@mui/icons-material';

export default function BuildingPhotosPanel({ buildingId, isMaximized, onToggleMaximize, isMobile = false }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // 写真データ取得
  useEffect(() => {
    if (buildingId) {
      fetchPhotos();
    }
  }, [buildingId]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/buildings/${buildingId}/photos`, {
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
      console.error('建物外観データの取得に失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const openPreview = (photo) => {
    setSelectedPhoto(photo);
    setPreviewDialogOpen(true);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Box sx={{
        px: 2,
        py: 1.5,
        borderBottom: '1px solid #e0e0e0',
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        minHeight: 56
      }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1, fontWeight: 600, fontSize: '1.05rem' }}>
          <PhotoLibraryIcon color="primary" sx={{ fontSize: 26 }} />
          建物外観 ({photos.length})
        </Typography>

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

      {/* 写真一覧 */}
      <Box sx={{ flex: 1, overflow: 'hidden', p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : photos.length === 0 ? (
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
              建物外観写真が登録されていません
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              物件詳細画面から登録できます
            </Typography>
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
            {photos.map((photo, index) => (
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
                    alt={`建物外観 ${index + 1}`}
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
                    <Tooltip title="拡大表示">
                      <IconButton
                        size="small"
                        onClick={() => openPreview(photo)}
                        sx={{
                          bgcolor: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                        }}
                      >
                        <ZoomInIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* メイン写真マーク */}
                  {index === 0 && (
                    <Box sx={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                    }}>
                      <Chip
                        label="メイン"
                        size="small"
                        color="primary"
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

      {/* 写真プレビューダイアログ */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">建物外観プレビュー</Typography>
          <IconButton onClick={() => setPreviewDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedPhoto && (
            <Box sx={{ textAlign: 'center', bgcolor: 'black' }}>
              <img
                src={selectedPhoto.url || selectedPhoto.image_url}
                alt="建物外観プレビュー"
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
