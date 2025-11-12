import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Checkbox,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  TextField
} from '@mui/material';
import {
  DragIndicator as DragIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon
} from '@mui/icons-material';
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
import axios from 'axios';

function SortablePhotoItem({ photo, index, comment, onRemove, onCommentChange }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPhotoTypeLabel = (type) => {
    const labels = {
      interior: '室内',
      living: 'リビング',
      kitchen: 'キッチン',
      bathroom: '浴室',
      floor_plan: '間取り図',
      exterior: '外観',
      other: 'その他'
    };
    return labels[type] || type;
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 2,
        border: '2px solid',
        borderColor: 'primary.main',
        bgcolor: 'background.paper',
        position: 'relative'
      }}
    >
      <Box sx={{ display: 'flex' }}>
        <Box
          {...attributes}
          {...listeners}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            bgcolor: 'primary.main',
            color: 'white',
            cursor: 'grab',
            '&:active': { cursor: 'grabbing' }
          }}
        >
          <DragIcon />
        </Box>

        <CardMedia
          component="img"
          sx={{ width: 120, height: 120, objectFit: 'cover' }}
          image={photo.photo_url}
          alt={photo.caption || `写真 ${index + 1}`}
        />

        <CardContent sx={{ flex: 1, py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Chip
              label={`${index + 1}`}
              size="small"
              color="primary"
            />
            <Chip
              label={getPhotoTypeLabel(photo.photo_type)}
              size="small"
              variant="outlined"
            />
          </Box>
          {photo.caption && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {photo.caption}
            </Typography>
          )}
          <TextField
            fullWidth
            size="small"
            label="写真のコメント（公開ページに表示）"
            value={comment || ''}
            onChange={(e) => onCommentChange(photo.id, e.target.value)}
            placeholder="この写真の説明を入力..."
            multiline
            rows={2}
            sx={{ mt: 1 }}
          />
        </CardContent>

        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onRemove(photo.id);
          }}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': {
              bgcolor: 'error.main',
              color: 'white'
            }
          }}
          size="small"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Card>
  );
}

export default function PhotoSelector({ roomId, selectedPhotos, onSelectionChange }) {
  const [availablePhotos, setAvailablePhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadPhotos();
  }, [roomId]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/rooms/${roomId}/room_photos`);
      setAvailablePhotos(response.data);
    } catch (error) {
      console.error('Error loading photos:', error);
      setError('写真の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoToggle = (photoId) => {
    const isSelected = selectedPhotos.some(p => p.photo_id === photoId);
    const newSelection = isSelected
      ? selectedPhotos.filter(p => p.photo_id !== photoId)
      : [...selectedPhotos, { photo_id: photoId, comment: '' }];
    onSelectionChange(newSelection);
  };

  const handleCommentChange = (photoId, comment) => {
    const newSelection = selectedPhotos.map(p =>
      p.photo_id === photoId ? { ...p, comment } : p
    );
    onSelectionChange(newSelection);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = selectedPhotos.findIndex(p => p.photo_id === active.id);
      const newIndex = selectedPhotos.findIndex(p => p.photo_id === over.id);
      const newOrder = arrayMove(selectedPhotos, oldIndex, newIndex);
      onSelectionChange(newOrder);
    }
  };

  const getPhotoTypeLabel = (type) => {
    const labels = {
      interior: '室内',
      living: 'リビング',
      kitchen: 'キッチン',
      bathroom: '浴室',
      floor_plan: '間取り図',
      exterior: '外観',
      other: 'その他'
    };
    return labels[type] || type;
  };

  const photoCategories = [
    { value: 'all', label: 'すべて' },
    { value: 'interior', label: '室内' },
    { value: 'living', label: 'リビング' },
    { value: 'kitchen', label: 'キッチン' },
    { value: 'bathroom', label: '浴室' },
    { value: 'floor_plan', label: '間取り図' },
    { value: 'exterior', label: '外観' },
    { value: 'other', label: 'その他' }
  ];

  const selectedPhotoIds = selectedPhotos.map(p => p.photo_id);

  const selectedPhotoObjects = selectedPhotos
    .map(({ photo_id }) => availablePhotos.find(p => p.id === photo_id))
    .filter(Boolean);

  const unselectedPhotos = availablePhotos
    .filter(photo => !selectedPhotoIds.includes(photo.id))
    .filter(photo => categoryFilter === 'all' || photo.photo_type === categoryFilter);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (availablePhotos.length === 0) {
    return (
      <Alert severity="info">
        この部屋にはまだ写真が登録されていません。先に部屋詳細画面から写真をアップロードしてください。
      </Alert>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* 左側: 選択可能な写真 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              写真を選択
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              公開ページに表示する写真を選択してください
            </Typography>

            {/* カテゴリフィルター */}
            <Box sx={{ mt: 2, mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                カテゴリで絞り込み
              </Typography>
              <ToggleButtonGroup
                value={categoryFilter}
                exclusive
                onChange={(e, newValue) => {
                  if (newValue !== null) {
                    setCategoryFilter(newValue);
                  }
                }}
                size="small"
                sx={{ flexWrap: 'wrap' }}
              >
                {photoCategories.map((category) => (
                  <ToggleButton key={category.value} value={category.value}>
                    {category.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <Box sx={{ mt: 2 }}>
              {unselectedPhotos.length === 0 ? (
                <Alert severity="info">
                  {categoryFilter === 'all'
                    ? 'すべての写真が選択されています'
                    : `${photoCategories.find(c => c.value === categoryFilter)?.label}の写真がありません`
                  }
                </Alert>
              ) : (
                unselectedPhotos.map((photo) => (
                  <Card
                    key={photo.id}
                    sx={{
                      display: 'flex',
                      mb: 2,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => handlePhotoToggle(photo.id)}
                  >
                    <Checkbox
                      checked={false}
                      sx={{ alignSelf: 'center', ml: 1 }}
                    />
                    <CardMedia
                      component="img"
                      sx={{ width: 120, height: 120, objectFit: 'cover' }}
                      image={photo.photo_url}
                      alt={photo.caption}
                    />
                    <CardContent sx={{ flex: 1 }}>
                      <Chip
                        label={getPhotoTypeLabel(photo.photo_type)}
                        size="small"
                        variant="outlined"
                      />
                      {photo.caption && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {photo.caption}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
          </Paper>
        </Grid>

        {/* 右側: 選択された写真（並び替え可能） */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              選択済み写真（{selectedPhotos.length}枚）
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              ドラッグ&ドロップで表示順を変更できます。右上の×ボタンで選択を解除できます。
            </Typography>

            {selectedPhotos.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                左側から写真を選択してください
              </Alert>
            ) : (
              <Box sx={{ mt: 2 }}>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedPhotoIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {selectedPhotoObjects.map((photo, index) => {
                      const photoData = selectedPhotos.find(p => p.photo_id === photo.id);
                      return (
                        <SortablePhotoItem
                          key={photo.id}
                          photo={photo}
                          index={index}
                          comment={photoData?.comment || ''}
                          onRemove={handlePhotoToggle}
                          onCommentChange={handleCommentChange}
                        />
                      );
                    })}
                  </SortableContext>
                </DndContext>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
