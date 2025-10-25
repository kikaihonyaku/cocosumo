import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  CircularProgress,
  Alert
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Public as PublicIcon,
  Description as DraftIcon
} from "@mui/icons-material";

export default function VRTourList({ roomId }) {
  const navigate = useNavigate();
  const [vrTours, setVrTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVRTours();
  }, [roomId]);

  const fetchVRTours = async () => {
    try {
      const response = await fetch(`/api/v1/rooms/${roomId}/vr_tours`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVrTours(data);
      } else {
        setError('VRツアーの取得に失敗しました');
      }
    } catch (err) {
      console.error('取得エラー:', err);
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tourId) => {
    if (!confirm('このVRツアーを削除してもよろしいですか?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/rooms/${roomId}/vr_tours/${tourId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchVRTours();
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

  if (vrTours.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          まだVRツアーが作成されていません
        </Typography>
        <Typography variant="body2" color="text.secondary">
          「新規VRツアー作成」ボタンから作成を開始してください
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {vrTours.map((tour) => (
        <ListItem
          key={tour.id}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            mb: 1,
            '&:last-child': { mb: 0 }
          }}
        >
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">{tour.title}</Typography>
                <Chip
                  size="small"
                  label={tour.status === 'published' ? '公開' : '下書き'}
                  color={tour.status === 'published' ? 'success' : 'default'}
                  icon={tour.status === 'published' ? <PublicIcon /> : <DraftIcon />}
                />
              </Box>
            }
            secondary={
              <>
                {tour.description && (
                  <Typography variant="body2" color="text.secondary" component="span">
                    {tour.description}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'block' }}>
                  シーン数: {tour.vr_scenes?.length || 0}
                </Typography>
              </>
            }
          />
          <ListItemSecondaryAction>
            <IconButton
              edge="end"
              aria-label="view"
              onClick={() => navigate(`/room/${roomId}/vr-tour/${tour.id}/viewer`)}
              sx={{ mr: 1 }}
            >
              <VisibilityIcon />
            </IconButton>
            <IconButton
              edge="end"
              aria-label="edit"
              onClick={() => navigate(`/room/${roomId}/vr-tour/${tour.id}/edit`)}
              sx={{ mr: 1 }}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              edge="end"
              aria-label="delete"
              onClick={() => handleDelete(tour.id)}
            >
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );
}
