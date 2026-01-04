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
  Tooltip,
  Card,
  CardContent
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Public as PublicIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Description as DraftIcon,
  ContentCopy as ContentCopyIcon,
  Article as ArticleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${yy}/${mm}`;
};

const formatDateFull = (dateStr, userName) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const userPart = userName ? `（${userName}）` : '';
  return `${yyyy}/${mm}/${dd} ${hh}:${min}${userPart}`;
};

export default function PropertyPublicationList({ roomId, isMobile = false }) {
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

  const handleDuplicate = async () => {
    if (selectedPublication) {
      try {
        const response = await axios.post(`/api/v1/rooms/${roomId}/property_publications/${selectedPublication.id}/duplicate`);
        if (response.data.success) {
          loadPropertyPublications();
          alert('物件公開ページを複製しました');
        }
      } catch (error) {
        console.error('Error duplicating property publication:', error);
        alert('複製に失敗しました');
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
      {isMobile ? (
        // モバイル用カード形式
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 2 }}>
          {propertyPublications.map((publication) => (
            <Card
              key={publication.id}
              variant="outlined"
              sx={{ cursor: 'pointer' }}
              onClick={() => handleRowClick(publication)}
            >
              <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <ArticleIcon fontSize="small" color="action" />
                      <Typography variant="subtitle2" fontWeight={600} noWrap>
                        {publication.title || '無題のページ'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={publication.status === 'published' ? '公開中' : '下書き'}
                        size="small"
                        color={publication.status === 'published' ? 'success' : 'default'}
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        更新: {formatDate(publication.updated_at)}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, publication);
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        // デスクトップ用テーブル形式
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
                <TableCell sx={{ width: '35%' }}>タイトル</TableCell>
                <TableCell sx={{ width: '20%' }}>状態</TableCell>
                <TableCell sx={{ width: '15%' }}>作成日</TableCell>
                <TableCell sx={{ width: '15%' }}>更新日</TableCell>
                <TableCell sx={{ width: '15%' }} align="center">操作</TableCell>
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
                    <Tooltip title={formatDateFull(publication.created_at, publication.created_by?.name)} placement="top">
                      <Typography variant="body2">{formatDate(publication.created_at)}</Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={formatDateFull(publication.updated_at, publication.updated_by?.name)} placement="top">
                      <Typography variant="body2">{formatDate(publication.updated_at)}</Typography>
                    </Tooltip>
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
      )}

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
        <MenuItem onClick={handleDuplicate}>
          <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
          複製
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          削除
        </MenuItem>
      </Menu>
    </>
  );
}
