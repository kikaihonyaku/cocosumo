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
  ListItemText,
  Collapse,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Public as PublicIcon,
  Campaign as CampaignIcon,
  Link as LinkIcon,
  Share as ShareIcon,
  OpenInNew as OpenInNewIcon,
  Edit as EditIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import axios from 'axios';

// Source label mapping
const getSourceInfo = (source) => {
  const sourceMap = {
    direct: { label: 'ダイレクト', icon: <LinkIcon fontSize="small" />, color: 'default' },
    organic_search: { label: '検索', icon: <SearchIcon fontSize="small" />, color: 'primary' },
    social: { label: 'SNS', icon: <ShareIcon fontSize="small" />, color: 'secondary' },
    referral: { label: '参照', icon: <PublicIcon fontSize="small" />, color: 'info' },
    campaign: { label: 'キャンペーン', icon: <CampaignIcon fontSize="small" />, color: 'success' }
  };
  return sourceMap[source] || { label: source || '不明', icon: <PublicIcon fontSize="small" />, color: 'default' };
};

export default function InquiryManager() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [filteredInquiries, setFilteredInquiries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [expandedId, setExpandedId] = useState(null);

  const loadInquiries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/v1/inquiries');
      setInquiries(response.data.inquiries || []);
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

  // 検索フィルタ
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredInquiries(inquiries);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredInquiries(inquiries.filter(inquiry =>
        inquiry.name?.toLowerCase().includes(query) ||
        inquiry.email?.toLowerCase().includes(query) ||
        inquiry.phone?.includes(query) ||
        inquiry.message?.toLowerCase().includes(query) ||
        inquiry.property_publication?.title?.toLowerCase().includes(query) ||
        inquiry.property_publication?.room?.building?.name?.toLowerCase().includes(query)
      ));
    }
    setPage(0);
  }, [searchQuery, inquiries]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleToggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleEditPublication = (inquiry) => {
    if (inquiry.property_publication?.room?.id && inquiry.property_publication?.id) {
      navigate(`/room/${inquiry.property_publication.room.id}/property-publication/${inquiry.property_publication.id}/edit`);
    }
  };

  const handleOpenPublicPage = (inquiry) => {
    if (inquiry.property_publication?.publication_id) {
      window.open(`/p/${inquiry.property_publication.publication_id}`, '_blank');
    }
  };

  const handleExportCsv = () => {
    window.open('/api/v1/inquiries/export_csv', '_blank');
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

      <Paper sx={{ mb: 2, p: 2 }}>
        <TextField
          fullWidth
          placeholder="名前、メール、電話番号、メッセージ、物件名で検索..."
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
                <TableCell>日時</TableCell>
                <TableCell>名前</TableCell>
                <TableCell>連絡先</TableCell>
                <TableCell>物件</TableCell>
                <TableCell>流入元</TableCell>
                <TableCell align="center">詳細</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedInquiries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {searchQuery ? '検索結果がありません' : '問い合わせがありません'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInquiries.map((inquiry) => {
                  const sourceInfo = getSourceInfo(inquiry.source);
                  const isExpanded = expandedId === inquiry.id;

                  return (
                    <React.Fragment key={inquiry.id}>
                      <TableRow
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleToggleExpand(inquiry.id)}
                      >
                        <TableCell>
                          <Typography variant="body2">
                            {inquiry.formatted_created_at || formatDate(inquiry.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {inquiry.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <EmailIcon fontSize="small" color="action" sx={{ fontSize: 14 }} />
                              <Typography variant="caption">{inquiry.email}</Typography>
                            </Box>
                            {inquiry.phone && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PhoneIcon fontSize="small" color="action" sx={{ fontSize: 14 }} />
                                <Typography variant="caption">{inquiry.phone}</Typography>
                              </Box>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {inquiry.property_publication?.room?.building?.name || '-'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                              {inquiry.property_publication?.title}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Chip
                              size="small"
                              icon={sourceInfo.icon}
                              label={sourceInfo.label}
                              color={sourceInfo.color}
                              variant="outlined"
                              sx={{ height: 24 }}
                            />
                            {inquiry.utm_campaign && (
                              <Tooltip title={`キャンペーン: ${inquiry.utm_campaign}`}>
                                <Chip
                                  size="small"
                                  label={inquiry.utm_campaign}
                                  color="success"
                                  variant="filled"
                                  sx={{ height: 24, maxWidth: 80, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
                                />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small">
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={6} sx={{ py: 0, borderBottom: isExpanded ? undefined : 'none' }}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ py: 2, px: 1 }}>
                              {/* メッセージ */}
                              <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  メッセージ
                                </Typography>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                  {inquiry.message || '(メッセージなし)'}
                                </Typography>
                              </Paper>

                              {/* 流入詳細 */}
                              {(inquiry.utm_source || inquiry.utm_medium || inquiry.referrer) && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                    流入詳細
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {inquiry.utm_source && (
                                      <Chip
                                        size="small"
                                        label={`ソース: ${inquiry.utm_source}`}
                                        variant="outlined"
                                        sx={{ height: 22, fontSize: '0.7rem' }}
                                      />
                                    )}
                                    {inquiry.utm_medium && (
                                      <Chip
                                        size="small"
                                        label={`メディア: ${inquiry.utm_medium}`}
                                        variant="outlined"
                                        sx={{ height: 22, fontSize: '0.7rem' }}
                                      />
                                    )}
                                    {inquiry.referrer && (
                                      <Tooltip title={inquiry.referrer}>
                                        <Chip
                                          size="small"
                                          label={`参照元: ${(() => { try { return new URL(inquiry.referrer).hostname; } catch { return inquiry.referrer; } })()}`}
                                          variant="outlined"
                                          sx={{ height: 22, fontSize: '0.7rem', maxWidth: 200 }}
                                        />
                                      </Tooltip>
                                    )}
                                  </Box>
                                </Box>
                              )}

                              {/* アクションボタン */}
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<OpenInNewIcon />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenPublicPage(inquiry);
                                  }}
                                  disabled={!inquiry.property_publication?.publication_id}
                                >
                                  公開ページを見る
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<EditIcon />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditPublication(inquiry);
                                  }}
                                  disabled={!inquiry.property_publication?.room?.id}
                                >
                                  公開ページを編集
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<EmailIcon />}
                                  href={`mailto:${inquiry.email}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  メールを送信
                                </Button>
                                {inquiry.phone && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<PhoneIcon />}
                                    href={`tel:${inquiry.phone}`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    電話をかける
                                  </Button>
                                )}
                              </Box>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
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
    </Box>
  );
}
