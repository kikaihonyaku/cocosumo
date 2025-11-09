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
  Chip
} from '@mui/material';
import {
  DragIndicator as DragIcon,
  CheckCircle as CheckCircleIcon
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

function SortablePhotoItem({ photo, index }) {
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
        display: 'flex',
        mb: 2,
        cursor: 'grab',
        '&:active': { cursor: 'grabbing' },
        border: '2px solid',
        borderColor: 'primary.main',
        bgcolor: 'background.paper'
      }}
    >
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {photo.caption}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function PhotoSelector({ roomId, selectedPhotoIds, onSelectionChange }) {
  const [availablePhotos, setAvailablePhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    const newSelection = selectedPhotoIds.includes(photoId)
      ? selectedPhotoIds.filter(id => id !== photoId)
      : [...selectedPhotoIds, photoId];
    onSelectionChange(newSelection);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = selectedPhotoIds.indexOf(active.id);
      const newIndex = selectedPhotoIds.indexOf(over.id);
      const newOrder = arrayMove(selectedPhotoIds, oldIndex, newIndex);
      onSelectionChange(newOrder);
    }
  };

  const selectedPhotos = selectedPhotoIds
    .map(id => availablePhotos.find(p => p.id === id))
    .filter(Boolean);

  const unselectedPhotos = availablePhotos.filter(
    photo => !selectedPhotoIds.includes(photo.id)
  );

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

            <Box sx={{ mt: 2 }}>
              {unselectedPhotos.map((photo) => (
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
                      label={photo.photo_type}
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
              ))}
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
              ドラッグ&ドロップで表示順を変更できます
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
                    {selectedPhotos.map((photo, index) => (
                      <SortablePhotoItem
                        key={photo.id}
                        photo={photo}
                        index={index}
                      />
                    ))}
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
