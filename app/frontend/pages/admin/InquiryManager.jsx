import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Divider,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Refresh as RefreshIcon,
  Public as PublicIcon,
  Campaign as CampaignIcon,
  Link as LinkIcon,
  Share as ShareIcon,
  OpenInNew as OpenInNewIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  PersonOutline as PersonOutlineIcon,
  Close as CloseIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import axios from 'axios';
import CustomerAccessDialog from '../../components/CustomerAccess/CustomerAccessDialog';
import PublicationSelectDialog from '../../components/CustomerAccess/PublicationSelectDialog';

// Status label mapping (new status values)
const getStatusInfo = (status) => {
  const statusMap = {
    pending: { label: '未対応', color: 'error' },
    status_pending: { label: '未対応', color: 'error' },
    in_progress: { label: '対応中', color: 'warning' },
    status_in_progress: { label: '対応中', color: 'warning' },
    completed: { label: '完了', color: 'success' },
    status_completed: { label: '完了', color: 'success' }
  };
  return statusMap[status] || { label: status || '未対応', color: 'default' };
};

// Status options for filter
const STATUS_OPTIONS = [
  { value: '', label: 'すべて' },
  { value: 'pending', label: '未対応' },
  { value: 'in_progress', label: '対応中' },
  { value: 'completed', label: '完了' }
];

export default function InquiryManager() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [users, setUsers] = useState([]);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [assignedUserFilter, setAssignedUserFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');

  // Detail dialog state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedInquiryIndex, setSelectedInquiryIndex] = useState(-1);

  // Status menu state
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [statusMenuInquiryId, setStatusMenuInquiryId] = useState(null);

  // Assigned user menu state
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [userMenuInquiryId, setUserMenuInquiryId] = useState(null);

  // Customer access dialog state
  const [customerAccessDialogOpen, setCustomerAccessDialogOpen] = useState(false);
  const [customerAccessInquiry, setCustomerAccessInquiry] = useState(null);
  const [customerAccessPublicationId, setCustomerAccessPublicationId] = useState(null);

  // Publication select dialog state
  const [publicationSelectDialogOpen, setPublicationSelectDialogOpen] = useState(false);
  const [publicationSelectInquiry, setPublicationSelectInquiry] = useState(null);

  const loadInquiries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [inquiriesRes, usersRes] = await Promise.all([
        axios.get('/api/v1/property_inquiries'),
        axios.get('/api/v1/admin/users').catch(() => ({ data: [] }))
      ]);
      setInquiries(inquiriesRes.data.inquiries || []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
    } catch (err) {
      console.error('Failed to load inquiries:', err);
      if (err.response?.status === 401) {
        setError('認証が必要です');
      } else {
        setError('問い合わせ一覧の読み込みに失敗しました');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  // Get unique customers for filter dropdown
  const uniqueCustomers = useMemo(() => {
    const customerMap = new Map();
    inquiries.forEach(inquiry => {
      if (inquiry.customer?.id && inquiry.customer?.name) {
        customerMap.set(inquiry.customer.id, inquiry.customer.name);
      }
    });
    return Array.from(customerMap.entries()).map(([id, name]) => ({ id, name }));
  }, [inquiries]);

  // Filter inquiries
  const filteredInquiries = useMemo(() => {
    let result = inquiries;

    // Status filter
    if (statusFilter) {
      result = result.filter(inquiry => inquiry.status === statusFilter);
    }

    // Assigned user filter
    if (assignedUserFilter) {
      if (assignedUserFilter === 'unassigned') {
        result = result.filter(inquiry => !inquiry.assigned_user);
      } else {
        result = result.filter(inquiry => inquiry.assigned_user?.id === parseInt(assignedUserFilter));
      }
    }

    // Customer filter
    if (customerFilter) {
      result = result.filter(inquiry => inquiry.customer?.id === parseInt(customerFilter));
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(inquiry =>
        inquiry.name?.toLowerCase().includes(query) ||
        inquiry.email?.toLowerCase().includes(query) ||
        inquiry.phone?.includes(query) ||
        inquiry.message?.toLowerCase().includes(query) ||
        inquiry.property_title?.toLowerCase().includes(query) ||
        inquiry.room?.building_name?.toLowerCase().includes(query) ||
        inquiry.assigned_user?.name?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [inquiries, statusFilter, assignedUserFilter, customerFilter, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [statusFilter, assignedUserFilter, customerFilter, searchQuery]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Detail dialog handlers
  const handleOpenDetail = (inquiry) => {
    const index = filteredInquiries.findIndex(i => i.id === inquiry.id);
    setSelectedInquiryIndex(index);
    setDetailDialogOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
    setSelectedInquiryIndex(-1);
  };

  const handlePrevInquiry = () => {
    if (selectedInquiryIndex > 0) {
      setSelectedInquiryIndex(selectedInquiryIndex - 1);
    }
  };

  const handleNextInquiry = () => {
    if (selectedInquiryIndex < filteredInquiries.length - 1) {
      setSelectedInquiryIndex(selectedInquiryIndex + 1);
    }
  };

  const selectedInquiry = selectedInquiryIndex >= 0 ? filteredInquiries[selectedInquiryIndex] : null;

  const handleViewCustomer = (inquiry) => {
    if (inquiry.customer?.id) {
      navigate(`/customers/${inquiry.customer.id}`);
    }
  };

  const handleEditPublication = (inquiry) => {
    if (inquiry.property_publication?.room?.id && inquiry.property_publication?.id) {
      navigate(`/room/${inquiry.property_publication.room.id}/property-publication/${inquiry.property_publication.id}/edit`);
    }
  };

  const handleOpenPublicPage = (inquiry) => {
    if (inquiry.property_publication?.publication_id) {
      window.open(`/property/${inquiry.property_publication.publication_id}`, '_blank');
    }
  };

  const handleOpenCustomerAccessDialog = (inquiry) => {
    if (inquiry.property_publication?.id) {
      setCustomerAccessInquiry(inquiry);
      setCustomerAccessPublicationId(inquiry.property_publication.id);
      setCustomerAccessDialogOpen(true);
    } else {
      setPublicationSelectInquiry(inquiry);
      setPublicationSelectDialogOpen(true);
    }
  };

  const handleCloseCustomerAccessDialog = () => {
    setCustomerAccessDialogOpen(false);
    setCustomerAccessInquiry(null);
    setCustomerAccessPublicationId(null);
  };

  const handlePublicationSelected = (publication) => {
    setPublicationSelectDialogOpen(false);
    setCustomerAccessInquiry(publicationSelectInquiry);
    setCustomerAccessPublicationId(publication.id);
    setCustomerAccessDialogOpen(true);
    setPublicationSelectInquiry(null);
  };

  const handleClosePublicationSelectDialog = () => {
    setPublicationSelectDialogOpen(false);
    setPublicationSelectInquiry(null);
  };

  const handleExportCsv = () => {
    window.open('/api/v1/property_inquiries/export_csv', '_blank');
  };

  const handleClearFilters = () => {
    setStatusFilter('');
    setAssignedUserFilter('');
    setCustomerFilter('');
    setSearchQuery('');
  };

  const hasActiveFilters = statusFilter || assignedUserFilter || customerFilter || searchQuery;

  // Status menu handlers
  const handleStatusClick = (event, inquiryId) => {
    event.stopPropagation();
    setStatusMenuAnchor(event.currentTarget);
    setStatusMenuInquiryId(inquiryId);
  };

  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
    setStatusMenuInquiryId(null);
  };

  const handleStatusChange = async (newStatus) => {
    if (!statusMenuInquiryId) return;

    try {
      const response = await axios.patch(`/api/v1/property_inquiries/${statusMenuInquiryId}`, {
        property_inquiry: { status: newStatus }
      });

      setInquiries(prev => prev.map(inquiry =>
        inquiry.id === statusMenuInquiryId
          ? { ...inquiry, status: newStatus, status_label: response.data.inquiry?.status_label }
          : inquiry
      ));
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('ステータスの更新に失敗しました');
    } finally {
      handleStatusMenuClose();
    }
  };

  // Assigned user menu handlers
  const handleUserClick = (event, inquiryId) => {
    event.stopPropagation();
    setUserMenuAnchor(event.currentTarget);
    setUserMenuInquiryId(inquiryId);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
    setUserMenuInquiryId(null);
  };

  const handleUserChange = async (userId) => {
    if (!userMenuInquiryId) return;

    try {
      const response = await axios.patch(`/api/v1/property_inquiries/${userMenuInquiryId}`, {
        property_inquiry: { assigned_user_id: userId || null }
      });

      setInquiries(prev => prev.map(inquiry =>
        inquiry.id === userMenuInquiryId
          ? { ...inquiry, assigned_user: response.data.inquiry?.assigned_user }
          : inquiry
      ));
    } catch (err) {
      console.error('Failed to update assigned user:', err);
      setError('担当者の更新に失敗しました');
    } finally {
      handleUserMenuClose();
    }
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

  const paginatedInquiries = filteredInquiries.slice(
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
          問い合わせ管理
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportCsv}
          >
            CSVエクスポート
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadInquiries}
          >
            更新
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ mb: 2, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FilterListIcon color="action" />

          {/* Status Filter */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>ステータス</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="ステータス"
            >
              {STATUS_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.value ? (
                    <Chip
                      size="small"
                      label={option.label}
                      color={getStatusInfo(option.value).color}
                      sx={{ height: 20 }}
                    />
                  ) : option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Assigned User Filter */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>担当者</InputLabel>
            <Select
              value={assignedUserFilter}
              onChange={(e) => setAssignedUserFilter(e.target.value)}
              label="担当者"
            >
              <MenuItem value="">すべて</MenuItem>
              <MenuItem value="unassigned">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonOutlineIcon fontSize="small" />
                  未設定
                </Box>
              </MenuItem>
              <Divider />
              {users.map(user => (
                <MenuItem key={user.id} value={user.id.toString()}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" />
                    {user.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Customer Filter */}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>顧客</InputLabel>
            <Select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              label="顧客"
            >
              <MenuItem value="">すべて</MenuItem>
              <Divider />
              {uniqueCustomers.map(customer => (
                <MenuItem key={customer.id} value={customer.id.toString()}>
                  {customer.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Search */}
          <TextField
            placeholder="検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            size="small"
            sx={{ minWidth: 200 }}
          />

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
            >
              クリア
            </Button>
          )}

          <Box sx={{ flex: 1 }} />

          {/* Result count */}
          <Typography variant="body2" color="text.secondary">
            {filteredInquiries.length} 件
            {hasActiveFilters && ` / ${inquiries.length} 件中`}
          </Typography>
        </Box>
      </Paper>

      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>日時</TableCell>
                <TableCell>発生元</TableCell>
                <TableCell>媒体</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell>担当者</TableCell>
                <TableCell>顧客名</TableCell>
                <TableCell>物件</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedInquiries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {hasActiveFilters ? '該当する問い合わせがありません' : '問い合わせがありません'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInquiries.map((inquiry) => {
                  const statusInfo = getStatusInfo(inquiry.status);

                  return (
                    <TableRow
                      key={inquiry.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleOpenDetail(inquiry)}
                    >
                      <TableCell>
                        <Typography variant="body2">
                          {inquiry.formatted_created_at || formatDate(inquiry.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={inquiry.origin_type_label || inquiry.origin_type || '-'}
                          color="primary"
                          variant="outlined"
                          sx={{ height: 24 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={inquiry.media_type_label || inquiry.media_type || '-'}
                          variant="outlined"
                          sx={{ height: 24 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={inquiry.status_label || statusInfo.label}
                          color={statusInfo.color}
                          onClick={(e) => handleStatusClick(e, inquiry.id)}
                          sx={{ height: 24, cursor: 'pointer' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          icon={inquiry.assigned_user ? <PersonIcon fontSize="small" /> : <PersonOutlineIcon fontSize="small" />}
                          label={inquiry.assigned_user?.name || '未設定'}
                          variant={inquiry.assigned_user ? 'filled' : 'outlined'}
                          onClick={(e) => handleUserClick(e, inquiry.id)}
                          sx={{ height: 24, cursor: 'pointer' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {inquiry.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {inquiry.property_title || inquiry.room?.building_name || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredInquiries.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="表示件数:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}件`}
        />
      </Paper>

      {/* Status change menu */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleStatusMenuClose}
      >
        <MenuItem onClick={() => handleStatusChange('pending')}>
          <ListItemIcon>
            <Chip size="small" label="未対応" color="error" sx={{ height: 20 }} />
          </ListItemIcon>
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('in_progress')}>
          <ListItemIcon>
            <Chip size="small" label="対応中" color="warning" sx={{ height: 20 }} />
          </ListItemIcon>
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('completed')}>
          <ListItemIcon>
            <Chip size="small" label="完了" color="success" sx={{ height: 20 }} />
          </ListItemIcon>
        </MenuItem>
      </Menu>

      {/* Assigned user menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
      >
        <MenuItem onClick={() => handleUserChange(null)}>
          <ListItemIcon>
            <PersonOutlineIcon fontSize="small" />
          </ListItemIcon>
          未設定
        </MenuItem>
        <Divider />
        {users.map((user) => (
          <MenuItem key={user.id} onClick={() => handleUserChange(user.id)}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            {user.name}
          </MenuItem>
        ))}
      </Menu>

      {/* Customer Access Dialog */}
      {/* Publication Select Dialog */}
      <PublicationSelectDialog
        open={publicationSelectDialogOpen}
        onClose={handleClosePublicationSelectDialog}
        roomId={publicationSelectInquiry?.room?.id}
        onSelect={handlePublicationSelected}
      />

      {/* Customer Access Dialog */}
      <CustomerAccessDialog
        open={customerAccessDialogOpen}
        onClose={handleCloseCustomerAccessDialog}
        publicationId={customerAccessPublicationId}
        inquiry={customerAccessInquiry}
        onCreated={() => {
          // アクセス権発行後の処理（必要に応じてリロードなど）
        }}
      />

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
      >
        {selectedInquiry && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h6">問い合わせ詳細</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedInquiryIndex + 1} / {filteredInquiries.length}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  onClick={handlePrevInquiry}
                  disabled={selectedInquiryIndex <= 0}
                  size="small"
                >
                  <NavigateBeforeIcon />
                </IconButton>
                <IconButton
                  onClick={handleNextInquiry}
                  disabled={selectedInquiryIndex >= filteredInquiries.length - 1}
                  size="small"
                >
                  <NavigateNextIcon />
                </IconButton>
                <IconButton onClick={handleCloseDetail} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {/* Header info */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">日時</Typography>
                  <Typography variant="body2">
                    {selectedInquiry.formatted_created_at || formatDate(selectedInquiry.created_at)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">発生元</Typography>
                  <Box>
                    <Chip
                      size="small"
                      label={selectedInquiry.origin_type_label || selectedInquiry.origin_type || '-'}
                      color="primary"
                      variant="outlined"
                      sx={{ height: 24 }}
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">媒体</Typography>
                  <Box>
                    <Chip
                      size="small"
                      label={selectedInquiry.media_type_label || selectedInquiry.media_type || '-'}
                      variant="outlined"
                      sx={{ height: 24 }}
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">ステータス</Typography>
                  <Box>
                    <Chip
                      size="small"
                      label={selectedInquiry.status_label || getStatusInfo(selectedInquiry.status).label}
                      color={getStatusInfo(selectedInquiry.status).color}
                      sx={{ height: 24 }}
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">担当者</Typography>
                  <Box>
                    <Chip
                      size="small"
                      icon={selectedInquiry.assigned_user ? <PersonIcon fontSize="small" /> : <PersonOutlineIcon fontSize="small" />}
                      label={selectedInquiry.assigned_user?.name || '未設定'}
                      variant={selectedInquiry.assigned_user ? 'filled' : 'outlined'}
                      sx={{ height: 24 }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Customer & Property info */}
              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <Paper variant="outlined" sx={{ flex: 1, p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom color="primary">
                    顧客情報
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedInquiry.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2">{selectedInquiry.email}</Typography>
                  </Box>
                  {selectedInquiry.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2">{selectedInquiry.phone}</Typography>
                    </Box>
                  )}
                </Paper>
                <Paper variant="outlined" sx={{ flex: 1, p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom color="primary">
                    物件情報
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedInquiry.property_title || '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedInquiry.room?.building_name} {selectedInquiry.room?.room_number}
                  </Typography>
                </Paper>
              </Box>

              {/* Message */}
              <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>
                  メッセージ
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedInquiry.message || '(メッセージなし)'}
                </Typography>
              </Paper>

              {/* Source info */}
              {(selectedInquiry.source_url || selectedInquiry.utm_source || selectedInquiry.utm_medium || selectedInquiry.referrer) && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    流入情報
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedInquiry.source_url && (
                      <Tooltip title={selectedInquiry.source_url}>
                        <Chip
                          size="small"
                          icon={<LinkIcon fontSize="small" />}
                          label={`登録元: ${(() => { try { return new URL(selectedInquiry.source_url).pathname; } catch { return selectedInquiry.source_url; } })()}`}
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.7rem' }}
                          onClick={() => window.open(selectedInquiry.source_url, '_blank')}
                        />
                      </Tooltip>
                    )}
                    {selectedInquiry.utm_source && (
                      <Chip
                        size="small"
                        label={`ソース: ${selectedInquiry.utm_source}`}
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.7rem' }}
                      />
                    )}
                    {selectedInquiry.utm_medium && (
                      <Chip
                        size="small"
                        label={`メディア: ${selectedInquiry.utm_medium}`}
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.7rem' }}
                      />
                    )}
                    {selectedInquiry.utm_campaign && (
                      <Chip
                        size="small"
                        label={`キャンペーン: ${selectedInquiry.utm_campaign}`}
                        variant="outlined"
                        color="success"
                        sx={{ height: 22, fontSize: '0.7rem' }}
                      />
                    )}
                    {selectedInquiry.referrer && (
                      <Tooltip title={selectedInquiry.referrer}>
                        <Chip
                          size="small"
                          label={`参照元: ${(() => { try { return new URL(selectedInquiry.referrer).hostname; } catch { return selectedInquiry.referrer; } })()}`}
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.7rem' }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PersonIcon />}
                  onClick={() => {
                    handleViewCustomer(selectedInquiry);
                    handleCloseDetail();
                  }}
                  disabled={!selectedInquiry.customer?.id}
                >
                  顧客情報を見る
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<PersonAddIcon />}
                  onClick={() => handleOpenCustomerAccessDialog(selectedInquiry)}
                  disabled={!selectedInquiry.room?.id && !selectedInquiry.property_publication?.id}
                >
                  顧客ページ発行
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<OpenInNewIcon />}
                  onClick={() => handleOpenPublicPage(selectedInquiry)}
                  disabled={!selectedInquiry.property_publication?.publication_id}
                >
                  公開ページ
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => handleEditPublication(selectedInquiry)}
                  disabled={!selectedInquiry.property_publication?.room?.id}
                >
                  編集
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<EmailIcon />}
                  href={`mailto:${selectedInquiry.email}`}
                >
                  メール
                </Button>
                {selectedInquiry.phone && (
                  <Button
                    variant="outlined"
                    startIcon={<PhoneIcon />}
                    href={`tel:${selectedInquiry.phone}`}
                  >
                    電話
                  </Button>
                )}
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
