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
  MenuItem
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
  Chat as ChatIcon
} from '@mui/icons-material';
import axios from 'axios';

// Status label mapping
const getStatusInfo = (status) => {
  const statusMap = {
    active: { label: 'アクティブ', color: 'success' },
    archived: { label: 'アーカイブ', color: 'default' }
  };
  return statusMap[status] || { label: status || 'アクティブ', color: 'success' };
};

export default function CustomerList() {
  const navigate = useNavigate();
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('page', page + 1);
      params.append('per_page', rowsPerPage);
      if (searchQuery) params.append('query', searchQuery);
      if (statusFilter) params.append('status', statusFilter);

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
  }, [page, rowsPerPage, searchQuery, statusFilter]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            顧客管理
          </Typography>
          <Chip
            label={`${pagination.total_count}件`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadCustomers}
          disabled={loading}
        >
          更新
        </Button>
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
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              )
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>ステータス</InputLabel>
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label="ステータス"
            >
              <MenuItem value="">すべて</MenuItem>
              <MenuItem value="active">アクティブ</MenuItem>
              <MenuItem value="archived">アーカイブ</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 600 }}>顧客名</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>連絡先</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">問い合わせ</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">アクセス権</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>最終問い合わせ</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>登録日</TableCell>
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
                        <Chip
                          size="small"
                          label={statusInfo.label}
                          color={statusInfo.color}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
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
                        {customer.last_inquiry_at || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {customer.created_at}
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
    </Box>
  );
}
