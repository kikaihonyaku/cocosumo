import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
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

export default function VirtualStagingList({ roomId }) {
  const navigate = useNavigate();
  const [virtualStagings, setVirtualStagings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVirtualStagings();
  }, [roomId]);

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
        setVirtualStagings(data);
      } else {
        setError('バーチャルステージングの取得に失敗しました');
      }
    } catch (err) {
      console.error('取得エラー:', err);
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (stagingId) => {
    if (!confirm('このバーチャルステージングを削除してもよろしいですか?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/rooms/${roomId}/virtual_stagings/${stagingId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchVirtualStagings();
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

  if (virtualStagings.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          まだバーチャルステージングが作成されていません
        </Typography>
        <Typography variant="body2" color="text.secondary">
          「バーチャルステージング作成」ボタンから作成を開始してください
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {virtualStagings.map((staging) => (
        <ListItem
          key={staging.id}
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
                <Typography variant="h6">{staging.title}</Typography>
                <Chip
                  size="small"
                  label={staging.status === 'published' ? '公開' : '下書き'}
                  color={staging.status === 'published' ? 'success' : 'default'}
                  icon={staging.status === 'published' ? <PublicIcon /> : <DraftIcon />}
                />
              </Box>
            }
            secondary={
              staging.description && (
                <Typography variant="body2" color="text.secondary" component="span">
                  {staging.description}
                </Typography>
              )
            }
          />
          <ListItemSecondaryAction>
            <IconButton
              edge="end"
              aria-label="view"
              onClick={() => navigate(`/room/${roomId}/virtual-staging/${staging.id}/viewer`)}
              sx={{ mr: 1 }}
            >
              <VisibilityIcon />
            </IconButton>
            <IconButton
              edge="end"
              aria-label="edit"
              onClick={() => navigate(`/room/${roomId}/virtual-staging/${staging.id}/edit`)}
              sx={{ mr: 1 }}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              edge="end"
              aria-label="delete"
              onClick={() => handleDelete(staging.id)}
            >
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );
}
