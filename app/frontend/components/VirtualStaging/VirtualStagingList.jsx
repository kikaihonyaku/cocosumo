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
  MenuItem
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  Public as PublicIcon,
  Description as DraftIcon
} from "@mui/icons-material";

export default function VirtualStagingList({ roomId }) {
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
              <TableCell sx={{ width: '50%' }}>タイトル</TableCell>
              <TableCell sx={{ width: '35%' }}>状態</TableCell>
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
