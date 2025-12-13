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
  InputLabel,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Grid,
  Tabs,
  Tab
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Edit as EditIcon
} from "@mui/icons-material";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// カテゴリ定義
const PHOTO_CATEGORIES = {
  interior: '室内',
  living: 'リビング',
  kitchen: 'キッチン',
  bathroom: 'バスルーム',
  floor_plan: '間取り図',
  exterior: '外観',
  other: 'その他',
};

// ドラッグ可能なシーンアイテムコンポーネント
function SortableSceneItem({ scene, isSelected, onSceneClick, onEditScene, onDeleteScene }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: scene.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      disablePadding
      secondaryAction={
        <Box>
          <IconButton
            edge="end"
            onClick={(e) => {
              e.stopPropagation();
              onEditScene(scene);
            }}
            size="small"
            sx={{ mr: 0.5 }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            edge="end"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteScene(scene.id);
            }}
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      }
      sx={{
        bgcolor: isSelected ? 'action.selected' : 'transparent'
      }}
    >
      <ListItemButton onClick={() => onSceneClick(scene)}>
        <Box
          {...attributes}
          {...listeners}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'grab',
            '&:active': {
              cursor: 'grabbing',
            },
            mr: 1,
          }}
        >
          <DragIcon sx={{ color: 'text.secondary' }} />
        </Box>
        <ListItemText
          primary={scene.title}
        />
      </ListItemButton>
    </ListItem>
  );
}

export default function SceneList({ vrTourId, roomId, onSceneSelect, onSceneDelete, onScenesChange }) {
  const [scenes, setScenes] = useState([]);
  const [roomPhotos, setRoomPhotos] = useState([]);
  const [virtualStagings, setVirtualStagings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newScene, setNewScene] = useState({
    title: '',
    room_photo_id: null,
    virtual_staging_id: null
  });
  const [selectedSceneId, setSelectedSceneId] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingScene, setEditingScene] = useState(null);
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState('all');
  const [photoSourceTab, setPhotoSourceTab] = useState(0); // 0: 通常写真, 1: バーチャルステージング

  // ドラッグ&ドロップのセンサー設定
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 写真の表示名を生成
  const getPhotoDisplayName = (photo) => {
    const categoryName = photo.photo_type ? PHOTO_CATEGORIES[photo.photo_type] || photo.photo_type : '';
    const baseName = photo.caption || `写真${photo.id}`;

    if (categoryName) {
      return `[${categoryName}] ${baseName}`;
    }
    return baseName;
  };

  useEffect(() => {
    fetchScenes();
    fetchRoomPhotos();
    fetchVirtualStagings();
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
        // 親コンポーネントに更新を通知
        onScenesChange && onScenesChange(data);
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
      const response = await fetch(`/api/v1/rooms/${roomId}/room_photos`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // room_photosを取得
        setRoomPhotos(data.photos || data || []);
      }
    } catch (err) {
      console.error('部屋写真の取得エラー:', err);
    }
  };

  const fetchVirtualStagings = async () => {
    try {
      const response = await fetch(`/api/v1/rooms/${roomId}/virtual_stagings`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVirtualStagings(data || []);
      }
    } catch (err) {
      console.error('バーチャルステージングの取得エラー:', err);
    }
  };

  const handleAddScene = async () => {
    if (!newScene.title || (!newScene.room_photo_id && !newScene.virtual_staging_id)) {
      alert('タイトルと写真またはバーチャルステージングを選択してください');
      return;
    }

    // room_photo_idとvirtual_staging_idが両方設定されないようにする
    const sceneData = { ...newScene };
    if (sceneData.virtual_staging_id) {
      delete sceneData.room_photo_id;
    } else if (sceneData.room_photo_id) {
      delete sceneData.virtual_staging_id;
    }

    try {
      const response = await fetch(`/api/v1/vr_tours/${vrTourId}/vr_scenes`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vr_scene: sceneData }),
      });

      if (response.ok) {
        setAddDialogOpen(false);
        setNewScene({ title: '', room_photo_id: null, virtual_staging_id: null });
        fetchScenes();
      } else {
        const data = await response.json();
        console.error('Scene creation error:', data);
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

  const handleEditScene = (scene) => {
    setEditingScene({ ...scene });
    setEditDialogOpen(true);
  };

  const handleUpdateScene = async () => {
    if (!editingScene.title) {
      alert('シーン名を入力してください');
      return;
    }

    try {
      const response = await fetch(`/api/v1/vr_tours/${vrTourId}/vr_scenes/${editingScene.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vr_scene: {
            title: editingScene.title
          }
        }),
      });

      if (response.ok) {
        const updatedScene = await response.json();
        setScenes(scenes.map(s => s.id === updatedScene.id ? updatedScene : s));
        setEditDialogOpen(false);
        setEditingScene(null);
        // 親コンポーネントに更新を通知
        onScenesChange && onScenesChange(scenes.map(s => s.id === updatedScene.id ? updatedScene : s));
      } else {
        const data = await response.json();
        alert(data.errors?.join(', ') || 'シーン名の更新に失敗しました');
      }
    } catch (err) {
      console.error('更新エラー:', err);
      alert('ネットワークエラーが発生しました');
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = scenes.findIndex(s => s.id === active.id);
    const newIndex = scenes.findIndex(s => s.id === over.id);

    // ローカル状態を即座に更新
    const newScenes = arrayMove(scenes, oldIndex, newIndex);
    setScenes(newScenes);

    // display_orderを再計算してAPIで更新
    try {
      const updatePromises = newScenes.map((scene, index) => {
        if (scene.display_order !== index) {
          return fetch(`/api/v1/vr_tours/${vrTourId}/vr_scenes/${scene.id}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              vr_scene: {
                display_order: index
              }
            }),
          });
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);

      // 更新後、最新データを取得
      fetchScenes();
    } catch (err) {
      console.error('順序更新エラー:', err);
      alert('順序の更新に失敗しました');
      // エラー時は元に戻す
      fetchScenes();
    }
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
          onClick={() => {
            setAddDialogOpen(true);
            setSelectedPhotoCategory('all');
            setPhotoSourceTab(0);
          }}
        >
          シーンを追加
        </Button>
      </Box>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={scenes.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <List sx={{ flex: 1, overflow: 'auto' }}>
            {scenes.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  まだシーンがありません
                </Typography>
              </Box>
            ) : (
              scenes.map((scene) => (
                <SortableSceneItem
                  key={scene.id}
                  scene={scene}
                  isSelected={selectedSceneId === scene.id}
                  onSceneClick={handleSceneClick}
                  onEditScene={handleEditScene}
                  onDeleteScene={handleDeleteScene}
                />
              ))
            )}
          </List>
        </SortableContext>
      </DndContext>

      {/* シーン追加ダイアログ */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>新しいシーンを追加</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="シーン名"
              value={newScene.title}
              onChange={(e) => setNewScene({ ...newScene, title: e.target.value })}
              required
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ mb: 1.5 }}>
                パノラマ写真を選択 *
              </Typography>

              {/* タブ切り替え */}
              <Tabs value={photoSourceTab} onChange={(e, v) => setPhotoSourceTab(v)} sx={{ mb: 2 }}>
                <Tab label="通常写真" />
                <Tab label="バーチャルステージング" />
              </Tabs>

              {/* 通常写真タブ */}
              {photoSourceTab === 0 && (
                <>
                  {roomPhotos.length === 0 ? (
                    <Alert severity="warning">
                      写真がありません。部屋に360度パノラマ写真を事前に登録してください。
                    </Alert>
                  ) : (
                    <>
                      {/* カテゴリ絞り込み */}
                      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label="全て"
                          onClick={() => setSelectedPhotoCategory('all')}
                          color={selectedPhotoCategory === 'all' ? 'primary' : 'default'}
                          variant={selectedPhotoCategory === 'all' ? 'filled' : 'outlined'}
                          size="small"
                        />
                        {Object.entries(PHOTO_CATEGORIES).map(([key, label]) => (
                          <Chip
                            key={key}
                            label={label}
                            onClick={() => setSelectedPhotoCategory(key)}
                            color={selectedPhotoCategory === key ? 'primary' : 'default'}
                            variant={selectedPhotoCategory === key ? 'filled' : 'outlined'}
                            size="small"
                          />
                        ))}
                      </Box>

                      {/* 写真グリッド - サムネイル表示で一覧性を高める */}
                      <Box sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        maxHeight: 350,
                        overflowY: 'auto',
                        p: 1,
                        bgcolor: 'grey.50',
                        borderRadius: 1
                      }}>
                        {roomPhotos
                          .filter(photo =>
                            selectedPhotoCategory === 'all' || photo.photo_type === selectedPhotoCategory
                          )
                          .map((photo) => (
                            <Box
                              key={photo.id}
                              onClick={() => setNewScene({ ...newScene, room_photo_id: photo.id })}
                              sx={{
                                width: 72,
                                height: 72,
                                flexShrink: 0,
                                cursor: 'pointer',
                                borderRadius: 1,
                                overflow: 'hidden',
                                border: newScene.room_photo_id === photo.id ? '3px solid' : '2px solid',
                                borderColor: newScene.room_photo_id === photo.id ? 'primary.main' : 'transparent',
                                boxShadow: newScene.room_photo_id === photo.id ? 3 : 1,
                                transition: 'all 0.15s',
                                '&:hover': {
                                  borderColor: newScene.room_photo_id === photo.id ? 'primary.main' : 'grey.400',
                                  transform: 'scale(1.05)',
                                },
                              }}
                            >
                              <img
                                src={photo.photo_url}
                                alt={getPhotoDisplayName(photo)}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                            </Box>
                          ))}
                      </Box>
                      {/* 選択中の写真情報 */}
                      {newScene.room_photo_id && (
                        <Box sx={{ mt: 1, p: 1, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
                          <Typography variant="body2" color="primary.main">
                            選択中: {roomPhotos.find(p => p.id === newScene.room_photo_id)?.caption || `写真${newScene.room_photo_id}`}
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                </>
              )}

              {/* バーチャルステージングタブ */}
              {photoSourceTab === 1 && (
                <>
                  {virtualStagings.length === 0 ? (
                    <Alert severity="warning">
                      バーチャルステージングがありません。先にバーチャルステージングを作成してください。
                    </Alert>
                  ) : (
                    <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                      <Grid container spacing={2}>
                        {virtualStagings.map((staging) => (
                          <Grid item xs={12} sm={6} key={staging.id}>
                            <Card
                              sx={{
                                cursor: 'pointer',
                                border: newScene.virtual_staging_id === staging.id ? 2 : 1,
                                borderColor: newScene.virtual_staging_id === staging.id ? 'primary.main' : 'divider',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  boxShadow: 3,
                                  transform: 'translateY(-2px)',
                                },
                              }}
                              onClick={() => setNewScene({ ...newScene, virtual_staging_id: staging.id, room_photo_id: null })}
                            >
                              {/* Before/After画像をサイドバイサイドで表示 */}
                              <Box sx={{ display: 'flex', height: 120 }}>
                                <Box sx={{ flex: 1, position: 'relative' }}>
                                  <CardMedia
                                    component="img"
                                    height="120"
                                    image={staging.before_photo_url}
                                    alt={`${staging.title} - Before`}
                                    sx={{ objectFit: 'cover' }}
                                  />
                                  <Chip
                                    label="Before"
                                    size="small"
                                    color="info"
                                    sx={{ position: 'absolute', top: 4, left: 4 }}
                                  />
                                </Box>
                                <Box sx={{ flex: 1, position: 'relative' }}>
                                  <CardMedia
                                    component="img"
                                    height="120"
                                    image={staging.after_photo_url}
                                    alt={`${staging.title} - After`}
                                    sx={{ objectFit: 'cover' }}
                                  />
                                  <Chip
                                    label="After"
                                    size="small"
                                    color="success"
                                    sx={{ position: 'absolute', top: 4, right: 4 }}
                                  />
                                </Box>
                              </Box>
                              <CardContent sx={{ p: 1 }}>
                                <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                  {staging.title}
                                </Typography>
                                {staging.description && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                                    {staging.description}
                                  </Typography>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </>
              )}
            </Box>

            <Alert severity="info">
              {photoSourceTab === 0
                ? '部屋に登録されている360度パノラマ写真から選択します。'
                : 'バーチャルステージングを選択すると、VRツアーでBefore/Afterをスライダーで比較できます。'}
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
            disabled={!newScene.title || (!newScene.room_photo_id && !newScene.virtual_staging_id)}
          >
            追加
          </Button>
        </DialogActions>
      </Dialog>

      {/* シーン名編集ダイアログ */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>シーン名を編集</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="シーン名"
              value={editingScene?.title || ''}
              onChange={(e) => setEditingScene({ ...editingScene, title: e.target.value })}
              required
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleUpdateScene}
            variant="contained"
            disabled={!editingScene?.title}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
