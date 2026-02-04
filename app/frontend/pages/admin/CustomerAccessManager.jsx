import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Tooltip,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Block as BlockIcon,
  Schedule as ScheduleIcon,
  MoreVert as MoreVertIcon,
  OpenInNew as OpenInNewIcon,
  ContentCopy as ContentCopyIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import CustomerAccessDetailDialog from '../../components/CustomerAccess/CustomerAccessDetailDialog';

export default function CustomerAccessManager() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accesses, setAccesses] = useState([]);
  const [filteredAccesses, setFilteredAccesses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // 詳細ダイアログ
  const [selectedAccess, setSelectedAccess] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // アクションメニュー
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuAccess, setMenuAccess] = useState(null);

  const loadAccesses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/v1/customer_accesses');
      setAccesses(response.data.customer_accesses || []);
    } catch (err) {
      console.error('Failed to load customer accesses:', err);
      setError('顧客アクセス情報の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccesses();
  }, [loadAccesses]);

  // 検索フィルタ
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAccesses(accesses);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredAccesses(accesses.filter(access =>
        access.customer_name?.toLowerCase().includes(query) ||
        access.customer_email?.toLowerCase().includes(query) ||
        access.property_publication?.title?.toLowerCase().includes(query) ||
        access.property_publication?.room?.building?.name?.toLowerCase().includes(query)
      ));
    }
    setPage(0);
  }, [searchQuery, accesses]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, access) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuAccess(access);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuAccess(null);
  };

  const handleViewDetail = (access) => {
    setSelectedAccess(access);
    setDetailDialogOpen(true);
    handleMenuClose();
  };

  const handleCopyUrl = async (access) => {
    const url = access.public_url || `${window.location.origin}/customer/${access.access_token}`;
    handleMenuClose();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      alert('URLをコピーしました');
    } catch (err) {
      console.error('Failed to copy URL:', err);
      prompt('URLをコピーしてください:', url);
    }
  };

  const handleOpenCustomerPage = (access) => {
    window.open(`/customer/${access.access_token}`, '_blank');
    handleMenuClose();
  };

  const handleEditPublication = (access) => {
    if (access.property_publication?.room?.id && access.property_publication?.id) {
      navigate(`/room/${access.property_publication.room.id}/property-publication/${access.property_publication.id}/edit`);
    }
    handleMenuClose();
  };

  const handleRevoke = async (access) => {
    if (!window.confirm(`${access.customer_name}様のアクセス権を取り消しますか？`)) {
      handleMenuClose();
      return;
    }

    try {
      await axios.post(`/api/v1/customer_accesses/${access.id}/revoke`);
      loadAccesses();
    } catch (err) {
      console.error('Failed to revoke access:', err);
      alert('アクセス権の取り消しに失敗しました');
    }
    handleMenuClose();
  };

  const getStatusChip = (access) => {
    if (access.status === 'revoked') {
      return <Chip label="取消済" size="small" color="error" />;
    }
    if (access.status === 'expired' || (access.expires_at && new Date(access.expires_at) < new Date())) {
      return <Chip label="期限切れ" size="small" color="warning" />;
    }
    return <Chip label="有効" size="small" color="success" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const paginatedAccesses = filteredAccesses.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          顧客マイページ管理
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadAccesses}
        >
          更新
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 2, p: 2 }}>
        <TextField
          fullWidth
          placeholder="顧客名、メール、物件名で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          size="small"
        />
      </Paper>

      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ステータス</TableCell>
                <TableCell>顧客名</TableCell>
                <TableCell>メールアドレス</TableCell>
                <TableCell>物件</TableCell>
                <TableCell>公開ページ</TableCell>
                <TableCell align="center">閲覧数</TableCell>
                <TableCell>有効期限</TableCell>
                <TableCell>作成日</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAccesses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {searchQuery ? '検索結果がありません' : '顧客アクセスがありません'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAccesses.map((access) => (
                  <TableRow
                    key={access.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleViewDetail(access)}
                  >
                    <TableCell>{getStatusChip(access)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {access.customer_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {access.customer_email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                        {access.property_publication?.room?.building?.name || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                        {access.property_publication?.title || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={access.view_count || 0}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ScheduleIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {access.formatted_expires_at || '無期限'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(access.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, access)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredAccesses.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="表示件数:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}件`}
        />
      </Paper>

      {/* アクションメニュー */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewDetail(menuAccess)}>
          <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
          <ListItemText>詳細を見る</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleOpenCustomerPage(menuAccess)}>
          <ListItemIcon><OpenInNewIcon fontSize="small" /></ListItemIcon>
          <ListItemText>顧客ページを開く</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleCopyUrl(menuAccess)}>
          <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
          <ListItemText>URLをコピー</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleEditPublication(menuAccess)}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>公開ページを編集</ListItemText>
        </MenuItem>
        {menuAccess?.status === 'active' && (
          <MenuItem onClick={() => handleRevoke(menuAccess)} sx={{ color: 'error.main' }}>
            <ListItemIcon><BlockIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>アクセス権を取り消し</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* 詳細ダイアログ */}
      <CustomerAccessDetailDialog
        open={detailDialogOpen}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedAccess(null);
        }}
        customerAccess={selectedAccess}
        onUpdated={loadAccesses}
      />
    </Box>
  );
}
