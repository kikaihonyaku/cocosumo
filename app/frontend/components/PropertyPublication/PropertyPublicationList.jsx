import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Public as PublicIcon,
  PublicOff as PublicOffIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function PropertyPublicationList({ roomId }) {
  const navigate = useNavigate();
  const [propertyPublications, setPropertyPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPublication, setSelectedPublication] = useState(null);

  useEffect(() => {
    loadPropertyPublications();
  }, [roomId]);

  const loadPropertyPublications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/rooms/${roomId}/property_publications`);
      setPropertyPublications(response.data);
    } catch (error) {
      console.error('Error loading property publications:', error);
      setError('物件公開ページの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, publication) => {
    setAnchorEl(event.currentTarget);
    setSelectedPublication(publication);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPublication(null);
  };

  const handleEdit = () => {
    if (selectedPublication) {
      navigate(`/room/${roomId}/property-publication/${selectedPublication.id}/edit`);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedPublication && window.confirm('この物件公開ページを削除してもよろしいですか？')) {
      try {
        await axios.delete(`/api/v1/rooms/${roomId}/property_publications/${selectedPublication.id}`);
        loadPropertyPublications();
      } catch (error) {
        console.error('Error deleting property publication:', error);
        alert('削除に失敗しました');
      }
    }
    handleMenuClose();
  };

  const handleTogglePublish = async (publication) => {
    try {
      const endpoint = publication.status === 'published'
        ? `/api/v1/rooms/${roomId}/property_publications/${publication.id}/unpublish`
        : `/api/v1/rooms/${roomId}/property_publications/${publication.id}/publish`;

      await axios.post(endpoint);
      loadPropertyPublications();
    } catch (error) {
      console.error('Error toggling publish status:', error);
      alert('公開状態の変更に失敗しました');
    }
  };

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

  if (propertyPublications.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          物件公開ページがまだ作成されていません。
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          「物件公開ページ作成」ボタンから作成できます。
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {propertyPublications.map((publication) => (
        <Card
          key={publication.id}
          sx={{
            mb: 2,
            cursor: 'pointer',
            '&:hover': { boxShadow: 3 }
          }}
          onClick={() => navigate(`/room/${roomId}/property-publication/${publication.id}/edit`)}
        >
          <Box sx={{ display: 'flex' }}>
            {publication.thumbnail_url && (
              <CardMedia
                component="img"
                sx={{ width: 120, height: 120, objectFit: 'cover' }}
                image={publication.thumbnail_url}
                alt={publication.title}
              />
            )}

            <CardContent sx={{ flex: 1, p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {publication.title}
                  </Typography>

                  {publication.catch_copy && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {publication.catch_copy}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      size="small"
                      label={publication.status === 'published' ? '公開中' : '下書き'}
                      color={publication.status === 'published' ? 'success' : 'default'}
                    />

                    {publication.status === 'published' && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePublish(publication);
                        }}
                        title="非公開にする"
                      >
                        <PublicOffIcon fontSize="small" />
                      </IconButton>
                    )}

                    {publication.status === 'draft' && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePublish(publication);
                        }}
                        title="公開する"
                      >
                        <PublicIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>

                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuOpen(e, publication);
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Box>
        </Card>
      ))}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          編集
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          削除
        </MenuItem>
      </Menu>
    </Box>
  );
}
