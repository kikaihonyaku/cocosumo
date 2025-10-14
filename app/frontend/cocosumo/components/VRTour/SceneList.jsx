import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Edit as EditIcon
} from "@mui/icons-material";

export default function SceneList({ vrTourId, roomId, onSceneSelect, onSceneDelete }) {
  const [scenes, setScenes] = useState([]);
  const [roomPhotos, setRoomPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newScene, setNewScene] = useState({
    title: '',
    room_photo_id: ''
  });
  const [selectedSceneId, setSelectedSceneId] = useState(null);

  useEffect(() => {
    fetchScenes();
    fetchRoomPhotos();
  }, [vrTourId]);

  const fetchScenes = async () => {
    try {
      const response = await fetch(`/api/v1/vr_tours/${vrTourId}/vr_scenes`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setScenes(data);
        if (data.length > 0 && !selectedSceneId) {
          setSelectedSceneId(data[0].id);
          onSceneSelect && onSceneSelect(data[0]);
        }
      } else {
        setError('シーンの取得に失敗しました');
      }
    } catch (err) {
      console.error('取得エラー:', err);
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomPhotos = async () => {
    try {
      const response = await fetch(`/api/v1/rooms/${roomId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // room_photosを取得（実際のAPIレスポンスに応じて調整）
        setRoomPhotos(data.room_photos || []);
      }
    } catch (err) {
      console.error('部屋写真の取得エラー:', err);
    }
  };

  const handleAddScene = async () => {
    if (!newScene.title || !newScene.room_photo_id) {
      alert('タイトルと写真を選択してください');
      return;
    }

    try {
      const response = await fetch(`/api/v1/vr_tours/${vrTourId}/vr_scenes`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vr_scene: newScene }),
      });

      if (response.ok) {
        setAddDialogOpen(false);
        setNewScene({ title: '', room_photo_id: '' });
        fetchScenes();
      } else {
        const data = await response.json();
        alert(data.errors?.join(', ') || 'シーンの追加に失敗しました');
      }
    } catch (err) {
      console.error('追加エラー:', err);
      alert('ネットワークエラーが発生しました');
    }
  };

  const handleDeleteScene = async (sceneId) => {
    if (!confirm('このシーンを削除してもよろしいですか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/vr_tours/${vrTourId}/vr_scenes/${sceneId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // 親コンポーネントに削除を通知
        onSceneDelete && onSceneDelete(sceneId);
        fetchScenes();
      } else {
        alert('削除に失敗しました');
      }
    } catch (err) {
      console.error('削除エラー:', err);
      alert('ネットワークエラーが発生しました');
    }
  };

  const handleSceneClick = (scene) => {
    setSelectedSceneId(scene.id);
    onSceneSelect && onSceneSelect(scene);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
        >
          シーンを追加
        </Button>
      </Box>

      <List sx={{ flex: 1, overflow: 'auto' }}>
        {scenes.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              まだシーンがありません
            </Typography>
          </Box>
        ) : (
          scenes.map((scene) => (
            <ListItem
              key={scene.id}
              disablePadding
              secondaryAction={
                <IconButton
                  edge="end"
                  onClick={() => handleDeleteScene(scene.id)}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              }
              sx={{
                bgcolor: selectedSceneId === scene.id ? 'action.selected' : 'transparent'
              }}
            >
              <ListItemButton onClick={() => handleSceneClick(scene)}>
                <DragIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <ListItemText
                  primary={scene.title}
                  secondary={`順序: ${scene.display_order || 0}`}
                />
              </ListItemButton>
            </ListItem>
          ))
        )}
      </List>

      {/* シーン追加ダイアログ */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>新しいシーンを追加</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="シーン名"
              value={newScene.title}
              onChange={(e) => setNewScene({ ...newScene, title: e.target.value })}
              required
            />

            <FormControl fullWidth required>
              <InputLabel>パノラマ写真</InputLabel>
              <Select
                value={newScene.room_photo_id}
                onChange={(e) => setNewScene({ ...newScene, room_photo_id: e.target.value })}
                label="パノラマ写真"
              >
                {roomPhotos.length === 0 ? (
                  <MenuItem value="" disabled>
                    写真がありません
                  </MenuItem>
                ) : (
                  roomPhotos.map((photo) => (
                    <MenuItem key={photo.id} value={photo.id}>
                      {photo.caption || `写真 ${photo.id}`}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <Alert severity="info">
              現在、部屋に登録されている写真から選択します。<br />
              360度パノラマ写真を事前に部屋に登録してください。
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleAddScene}
            variant="contained"
            disabled={!newScene.title || !newScene.room_photo_id}
          >
            追加
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
