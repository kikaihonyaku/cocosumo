import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  Menu,
  MenuItem,
  Card,
  CardContent,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  Public as PublicIcon,
  Description as DraftIcon,
  CompareArrows as CompareArrowsIcon,
} from "@mui/icons-material";

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

export default function VirtualStagingList({ roomId, isMobile = false }) {
  const navigate = useNavigate();
  const [virtualStagings, setVirtualStagings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedStaging, setSelectedStaging] = useState(null);

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

  const handleMenuOpen = (event, staging) => {
    setMenuAnchor(event.currentTarget);
    setSelectedStaging(staging);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedStaging(null);
  };

  const handleView = () => {
    if (selectedStaging) {
      navigate(`/room/${roomId}/virtual-staging/${selectedStaging.id}/viewer`);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedStaging) {
      navigate(`/room/${roomId}/virtual-staging/${selectedStaging.id}/edit`);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedStaging) return;

    if (!confirm('このバーチャルステージングを削除してもよろしいですか?')) {
      handleMenuClose();
      return;
    }

    try {
      const response = await fetch(`/api/v1/rooms/${roomId}/virtual_stagings/${selectedStaging.id}`, {
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
    handleMenuClose();
  };

  const handleRowClick = (staging) => {
    navigate(`/room/${roomId}/virtual-staging/${staging.id}/viewer`);
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
          「VS作成」ボタンから作成を開始してください
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {isMobile ? (
        // モバイル用カード形式
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 2 }}>
          {virtualStagings.map((staging) => (
            <Card
              key={staging.id}
              variant="outlined"
              sx={{ cursor: 'pointer' }}
              onClick={() => handleRowClick(staging)}
            >
              <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <CompareArrowsIcon fontSize="small" color="action" />
                      <Typography variant="subtitle2" fontWeight={600} noWrap>
                        {staging.title || '無題のステージング'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={staging.status === 'published' ? '公開' : '下書き'}
                        size="small"
                        color={staging.status === 'published' ? 'success' : 'default'}
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        更新: {formatDate(staging.updated_at)}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, staging);
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
              {virtualStagings.map((staging) => (
                <TableRow
                  key={staging.id}
                  hover
                  onClick={() => handleRowClick(staging)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Tooltip title={staging.title || '-'} placement="top">
                      <Typography variant="body2" fontWeight="500" noWrap>
                        {staging.title || '-'}
                      </Typography>
                    </Tooltip>
                    {staging.description && (
                      <Tooltip title={staging.description} placement="top">
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {staging.description}
                        </Typography>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={staging.status === 'published' ? '公開' : '下書き'} placement="top">
                      <Chip
                        label={staging.status === 'published' ? '公開' : '下書き'}
                        size="small"
                        color={staging.status === 'published' ? 'success' : 'default'}
                        icon={staging.status === 'published' ? <PublicIcon /> : <DraftIcon />}
                        sx={{ maxWidth: '100%' }}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={formatDateFull(staging.created_at, staging.created_by?.name)} placement="top">
                      <Typography variant="body2">{formatDate(staging.created_at)}</Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={formatDateFull(staging.updated_at, staging.updated_by?.name)} placement="top">
                      <Typography variant="body2">{formatDate(staging.updated_at)}</Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, staging);
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
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <VisibilityIcon sx={{ mr: 1 }} fontSize="small" />
          表示
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          編集
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          削除
        </MenuItem>
      </Menu>
    </>
  );
}
