import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Public as PublicIcon,
  PublicOff as PublicOffIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Description as DraftIcon
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

  const handleView = () => {
    if (selectedPublication) {
      navigate(`/property/${selectedPublication.publication_id}?preview=true&roomId=${roomId}`);
    }
    handleMenuClose();
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

  const handleTogglePublish = async (publication, e) => {
    if (e) {
      e.stopPropagation();
    }
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

  const handleRowClick = (publication) => {
    navigate(`/property/${publication.publication_id}?preview=true&roomId=${roomId}`);
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
        <Typography variant="body1" color="text.secondary">
          物件公開ページがまだ作成されていません
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          「物件公開ページ作成」ボタンから作成できます
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer>
        <Table
          size="small"
          stickyHeader
          sx={{
            tableLayout: 'fixed',
            '& .MuiTableCell-root': {
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '45%' }}>タイトル</TableCell>
              <TableCell sx={{ width: '25%' }}>状態</TableCell>
              <TableCell sx={{ width: '20%' }}>公開操作</TableCell>
              <TableCell sx={{ width: '10%' }} align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {propertyPublications.map((publication) => (
              <TableRow
                key={publication.id}
                hover
                onClick={() => handleRowClick(publication)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Tooltip title={publication.title || '-'} placement="top">
                    <Typography variant="body2" fontWeight="500" noWrap>
                      {publication.title || '-'}
                    </Typography>
                  </Tooltip>
                  {publication.catch_copy && (
                    <Tooltip title={publication.catch_copy} placement="top">
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {publication.catch_copy}
                      </Typography>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>
                  <Tooltip title={publication.status === 'published' ? '公開中' : '下書き'} placement="top">
                    <Chip
                      label={publication.status === 'published' ? '公開中' : '下書き'}
                      size="small"
                      color={publication.status === 'published' ? 'success' : 'default'}
                      icon={publication.status === 'published' ? <PublicIcon /> : <DraftIcon />}
                      sx={{ maxWidth: '100%' }}
                    />
                  </Tooltip>
                </TableCell>
                <TableCell>
                  {publication.status === 'published' ? (
                    <Tooltip title="非公開にする">
                      <IconButton
                        size="small"
                        onClick={(e) => handleTogglePublish(publication, e)}
                      >
                        <PublicOffIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="公開する">
                      <IconButton
                        size="small"
                        onClick={(e) => handleTogglePublish(publication, e)}
                      >
                        <PublicIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, publication);
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* アクションメニュー */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <VisibilityIcon sx={{ mr: 1 }} fontSize="small" />
          表示
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          編集
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          削除
        </MenuItem>
      </Menu>
    </>
  );
}
