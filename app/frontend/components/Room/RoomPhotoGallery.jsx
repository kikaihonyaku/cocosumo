import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Image as ImageIcon
} from "@mui/icons-material";

const PHOTO_TYPE_LABELS = {
  interior: '室内',
  exterior: '外観',
  bathroom: '浴室',
  kitchen: 'キッチン',
  other: 'その他'
};

export default function RoomPhotoGallery({ roomId }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [newPhoto, setNewPhoto] = useState({
    photo_type: 'interior',
    caption: ''
  });

  useEffect(() => {
    fetchPhotos();
  }, [roomId]);

  const fetchPhotos = async () => {
    try {
      const response = await fetch(`/api/v1/rooms/${roomId}/room_photos`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPhotos(data);
      } else {
        setError('写真の取得に失敗しました');
      }
    } catch (err) {
      console.error('取得エラー:', err);
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('ファイルを選択してください');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('room_photo[photo]', selectedFile);
      formData.append('room_photo[photo_type]', newPhoto.photo_type);
      formData.append('room_photo[caption]', newPhoto.caption);

      const response = await fetch(`/api/v1/rooms/${roomId}/room_photos`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        setUploadDialogOpen(false);
        setSelectedFile(null);
        setNewPhoto({ photo_type: 'interior', caption: '' });
        fetchPhotos();
      } else {
        const data = await response.json();
        alert(data.errors?.join(', ') || 'アップロードに失敗しました');
      }
    } catch (err) {
      console.error('アップロードエラー:', err);
      alert('ネットワークエラーが発生しました');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId) => {
    if (!confirm('この写真を削除してもよろしいですか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/rooms/${roomId}/room_photos/${photoId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchPhotos();
      } else {
        alert('削除に失敗しました');
      }
    } catch (err) {
      console.error('削除エラー:', err);
      alert('ネットワークエラーが発生しました');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          部屋写真 ({photos.length}枚)
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setUploadDialogOpen(true)}
        >
          写真を追加
        </Button>
      </Box>

      {photos.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'background.paper', borderRadius: 1 }}>
          <ImageIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" gutterBottom>
            まだ写真が登録されていません
          </Typography>
          <Typography variant="body2" color="text.secondary">
            「写真を追加」ボタンから写真をアップロードしてください
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {photos.map((photo) => (
            <Grid item xs={12} sm={6} md={4} key={photo.id}>
              <Card>
                {photo.photo_url ? (
                  <CardMedia
                    component="img"
                    height="200"
                    image={photo.photo_url}
                    alt={photo.caption || 'Room photo'}
                    sx={{ objectFit: 'cover' }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 200,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.200'
                    }}
                  >
                    <ImageIcon sx={{ fontSize: 60, color: 'grey.400' }} />
                  </Box>
                )}
                <CardContent>
                  <Box sx={{ mb: 1 }}>
                    <Chip
                      label={PHOTO_TYPE_LABELS[photo.photo_type] || photo.photo_type}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  {photo.caption && (
                    <Typography variant="body2" color="text.secondary">
                      {photo.caption}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    順序: {photo.display_order}
                  </Typography>
                </CardContent>
                <CardActions>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(photo.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* アップロードダイアログ */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>写真をアップロード</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              fullWidth
            >
              ファイルを選択
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileSelect}
              />
            </Button>

            {selectedFile && (
              <Alert severity="info">
                選択されたファイル: {selectedFile.name}
              </Alert>
            )}

            <FormControl fullWidth>
              <InputLabel>写真タイプ</InputLabel>
              <Select
                value={newPhoto.photo_type}
                onChange={(e) => setNewPhoto({ ...newPhoto, photo_type: e.target.value })}
                label="写真タイプ"
              >
                <MenuItem value="interior">室内</MenuItem>
                <MenuItem value="exterior">外観</MenuItem>
                <MenuItem value="bathroom">浴室</MenuItem>
                <MenuItem value="kitchen">キッチン</MenuItem>
                <MenuItem value="other">その他</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="キャプション（任意）"
              value={newPhoto.caption}
              onChange={(e) => setNewPhoto({ ...newPhoto, caption: e.target.value })}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || uploading}
          >
            {uploading ? 'アップロード中...' : 'アップロード'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
