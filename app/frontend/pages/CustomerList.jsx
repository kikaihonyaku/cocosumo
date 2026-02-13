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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActionArea,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Key as KeyIcon,
  Visibility as VisibilityIcon,
  Chat as ChatIcon,
  Flag as FlagIcon,
  PriorityHigh as PriorityHighIcon,
  Warning as WarningIcon,
  People as PeopleIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import axios from 'axios';
import MergeHistoryDialog from '../components/Customer/MergeHistoryDialog';

// Status label mapping
const getStatusInfo = (status) => {
  const statusMap = {
    active: { label: 'アクティブ', color: 'success' },
    archived: { label: 'アーカイブ', color: 'default' }
  };
  return statusMap[status] || { label: status || 'アクティブ', color: 'success' };
};

// Deal status mapping
const DEAL_STATUS_MAP = {
  new_inquiry: { label: '新規反響', color: 'info' },
  contacting: { label: '対応中', color: 'primary' },
  viewing_scheduled: { label: '内見予約', color: 'secondary' },
  viewing_done: { label: '内見済', color: 'warning' },
  application: { label: '申込', color: 'success' },
  contracted: { label: '成約', color: 'success' },
  lost: { label: '失注', color: 'error' }
};

const getDealStatusInfo = (status) => {
  return DEAL_STATUS_MAP[status] || { label: status, color: 'default' };
};

// Priority mapping
const PRIORITY_MAP = {
  low: { label: '低', color: 'default', icon: null },
  normal: { label: '通常', color: 'default', icon: null },
  high: { label: '高', color: 'warning', icon: <PriorityHighIcon fontSize="small" /> },
  urgent: { label: '緊急', color: 'error', icon: <WarningIcon fontSize="small" /> }
};

const getPriorityInfo = (priority) => {
  return PRIORITY_MAP[priority] || PRIORITY_MAP.normal;
};

export default function CustomerList() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 50,
    total_count: 0,
    total_pages: 1
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dealStatusFilter, setDealStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [mergeHistoryOpen, setMergeHistoryOpen] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('page', page + 1);
      params.append('per_page', rowsPerPage);
      if (searchQuery) params.append('query', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      if (dealStatusFilter) params.append('deal_status', dealStatusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (activeOnly) params.append('active_only', 'true');

      const response = await axios.get(`/api/v1/customers?${params.toString()}`);
      setCustomers(response.data.customers);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Failed to load customers:', err);
      if (err.response?.status === 401) {
        setError('顧客一覧を表示するにはログインが必要です');
      } else {
        setError('顧客一覧の読み込みに失敗しました');
      }
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchQuery, statusFilter, dealStatusFilter, priorityFilter, activeOnly]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    const loadDuplicateCount = async () => {
      try {
        const res = await axios.get('/api/v1/customers/find_duplicates');
        setDuplicateCount((res.data.groups || []).length);
      } catch (err) {
        // Silently ignore - not critical
      }
    };
    loadDuplicateCount();
  }, []);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(0);
  };

  const handleDealStatusFilterChange = (e) => {
    setDealStatusFilter(e.target.value);
    setPage(0);
  };

  const handlePriorityFilterChange = (e) => {
    setPriorityFilter(e.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewCustomer = (customerId) => {
    navigate(`/customers/${customerId}`);
  };

  if (loading && customers.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 1.5, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" sx={{ fontSize: isMobile ? 24 : 32 }} />
          <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 600 }}>
            顧客管理
          </Typography>
          <Chip
            label={`${pagination.total_count}件`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {duplicateCount > 0 && !isMobile && (
            <Chip
              icon={<PeopleIcon />}
              label={`重複候補 ${duplicateCount}件`}
              color="warning"
              variant="outlined"
              sx={{ cursor: 'default' }}
            />
          )}
          {!isMobile && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<HistoryIcon />}
              onClick={() => setMergeHistoryOpen(true)}
            >
              統合履歴
            </Button>
          )}
          {isMobile ? (
            <IconButton onClick={loadCustomers} disabled={loading} color="primary">
              <RefreshIcon />
            </IconButton>
          ) : (
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadCustomers}
              disabled={loading}
            >
              更新
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="名前、メール、電話番号で検索..."
            value={searchQuery}
            onChange={handleSearch}
            sx={{ minWidth: isMobile ? undefined : 300, width: isMobile ? '100%' : undefined }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              )
            }}
          />
          <FormControl size="small" sx={{ minWidth: isMobile ? 0 : 130, flex: isMobile ? 1 : undefined }}>
            <InputLabel>商談ステータス</InputLabel>
            <Select
              value={dealStatusFilter}
              onChange={handleDealStatusFilterChange}
              label="商談ステータス"
            >
              <MenuItem value="">すべて</MenuItem>
              <MenuItem value="new_inquiry">新規反響</MenuItem>
              <MenuItem value="contacting">対応中</MenuItem>
              <MenuItem value="viewing_scheduled">内見予約</MenuItem>
              <MenuItem value="viewing_done">内見済</MenuItem>
              <MenuItem value="application">申込</MenuItem>
              <MenuItem value="contracted">成約</MenuItem>
              <MenuItem value="lost">失注</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: isMobile ? 0 : 100, flex: isMobile ? 1 : undefined }}>
            <InputLabel>優先度</InputLabel>
            <Select
              value={priorityFilter}
              onChange={handlePriorityFilterChange}
              label="優先度"
            >
              <MenuItem value="">すべて</MenuItem>
              <MenuItem value="urgent">緊急</MenuItem>
              <MenuItem value="high">高</MenuItem>
              <MenuItem value="normal">通常</MenuItem>
              <MenuItem value="low">低</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: isMobile ? 0 : 120, flex: isMobile ? 1 : undefined }}>
            <InputLabel>顧客状態</InputLabel>
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label="顧客状態"
            >
              <MenuItem value="">すべて</MenuItem>
              <MenuItem value="active">アクティブ</MenuItem>
              <MenuItem value="archived">アーカイブ</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Mobile: Card List / Desktop: Table */}
      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {customers.length === 0 ? (
            <Paper sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                顧客が見つかりませんでした
              </Typography>
            </Paper>
          ) : (
            customers.map((customer) => {
              const dealStatusInfo = getDealStatusInfo(customer.deal_status);
              const priorityInfo = getPriorityInfo(customer.priority);
              return (
                <Card key={customer.id} variant="outlined">
                  <CardActionArea onClick={() => handleViewCustomer(customer.id)}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      {/* Row 1: Name + Deal Status */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                            {customer.name}
                          </Typography>
                          {customer.has_line && (
                            <ChatIcon fontSize="small" color="success" sx={{ fontSize: 16, flexShrink: 0 }} />
                          )}
                          {(customer.priority === 'high' || customer.priority === 'urgent') && (
                            <Chip
                              size="small"
                              icon={priorityInfo.icon}
                              label={customer.priority_label || priorityInfo.label}
                              color={priorityInfo.color}
                              sx={{ height: 18, fontSize: '0.65rem', flexShrink: 0 }}
                            />
                          )}
                        </Box>
                        <Chip
                          icon={<FlagIcon fontSize="small" />}
                          label={customer.deal_status_label || dealStatusInfo.label}
                          size="small"
                          color={dealStatusInfo.color}
                          sx={{ height: 22, flexShrink: 0, ml: 1 }}
                        />
                      </Box>
                      {/* Row 2: Contact info */}
                      <Box sx={{ display: 'flex', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
                        {customer.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EmailIcon color="action" sx={{ fontSize: 14 }} />
                            <Typography variant="caption" noWrap sx={{ maxWidth: 160 }}>{customer.email}</Typography>
                          </Box>
                        )}
                        {customer.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon color="action" sx={{ fontSize: 14 }} />
                            <Typography variant="caption">{customer.phone}</Typography>
                          </Box>
                        )}
                      </Box>
                      {/* Row 3: Stats + Last Contact */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          icon={<QuestionAnswerIcon sx={{ fontSize: 14 }} />}
                          label={customer.inquiry_count}
                          size="small"
                          color={customer.inquiry_count > 0 ? 'primary' : 'default'}
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                        <Chip
                          icon={<KeyIcon sx={{ fontSize: 14 }} />}
                          label={customer.access_count}
                          size="small"
                          color={customer.access_count > 0 ? 'info' : 'default'}
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                        <Box sx={{ flex: 1 }} />
                        <Typography variant="caption" color="text.secondary">
                          {customer.last_contacted_at || customer.last_inquiry_at || '-'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })
          )}
          <TablePagination
            component="div"
            count={pagination.total_count}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[25, 50, 100]}
            labelRowsPerPage="件数:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 600 }}>顧客名</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>商談ステータス</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>連絡先</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">問い合わせ</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">アクセス権</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>最終連絡</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      顧客が見つかりませんでした
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => {
                  const statusInfo = getStatusInfo(customer.status);
                  const dealStatusInfo = getDealStatusInfo(customer.deal_status);
                  const priorityInfo = getPriorityInfo(customer.priority);
                  return (
                    <TableRow
                      key={customer.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleViewCustomer(customer.id)}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {customer.name}
                          </Typography>
                          {customer.has_line && (
                            <Tooltip title="LINE連携済み">
                              <ChatIcon fontSize="small" color="success" />
                            </Tooltip>
                          )}
                          {(customer.priority === 'high' || customer.priority === 'urgent') && (
                            <Tooltip title={`優先度: ${customer.priority_label || priorityInfo.label}`}>
                              <Chip
                                size="small"
                                icon={priorityInfo.icon}
                                label={customer.priority_label || priorityInfo.label}
                                color={priorityInfo.color}
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            </Tooltip>
                          )}
                          {customer.status === 'archived' && (
                            <Chip
                              size="small"
                              label={statusInfo.label}
                              color={statusInfo.color}
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<FlagIcon fontSize="small" />}
                          label={customer.deal_status_label || dealStatusInfo.label}
                          size="small"
                          color={dealStatusInfo.color}
                          sx={{ height: 24 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {customer.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <EmailIcon fontSize="small" color="action" sx={{ fontSize: 16 }} />
                              <Typography variant="caption">{customer.email}</Typography>
                            </Box>
                          )}
                          {customer.phone && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PhoneIcon fontSize="small" color="action" sx={{ fontSize: 16 }} />
                              <Typography variant="caption">{customer.phone}</Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<QuestionAnswerIcon fontSize="small" />}
                          label={customer.inquiry_count}
                          size="small"
                          color={customer.inquiry_count > 0 ? 'primary' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<KeyIcon fontSize="small" />}
                          label={customer.access_count}
                          size="small"
                          color={customer.access_count > 0 ? 'info' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {customer.last_contacted_at || customer.last_inquiry_at || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="詳細を見る">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewCustomer(customer.id);
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={pagination.total_count}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[25, 50, 100]}
            labelRowsPerPage="表示件数:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}件`}
          />
        </TableContainer>
      )}
      {/* Merge History Dialog */}
      <MergeHistoryDialog
        open={mergeHistoryOpen}
        onClose={() => setMergeHistoryOpen(false)}
        onUndone={loadCustomers}
      />
    </Box>
  );
}
