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
  Divider,
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
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Public as PublicIcon,
  Campaign as CampaignIcon,
  Link as LinkIcon,
  Share as ShareIcon,
  OpenInNew as OpenInNewIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Lock as LockIcon,
  Reply as ReplyIcon,
  Send as SendIcon,
  Close as CloseIcon
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

// Source type label mapping
const getSourceTypeInfo = (sourceType) => {
  if (sourceType === 'customer_limited') {
    return { label: '顧客限定', icon: <LockIcon fontSize="small" />, color: 'warning' };
  }
  return { label: '公開', icon: <PublicIcon fontSize="small" />, color: 'info' };
};

// Status label mapping
const getStatusInfo = (status) => {
  const statusMap = {
    unreplied: { label: '未返信', color: 'error' },
    replied: { label: '返信済み', color: 'success' },
    no_reply_needed: { label: '返信不要', color: 'default' }
  };
  return statusMap[status] || { label: status || '未返信', color: 'error' };
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

  // Status menu state
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [statusMenuInquiryId, setStatusMenuInquiryId] = useState(null);

  // Reply dialog state
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyInquiry, setReplyInquiry] = useState(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [replySending, setReplySending] = useState(false);

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
      window.open(`/property/${inquiry.property_publication.publication_id}`, '_blank');
    }
  };

  const handleExportCsv = () => {
    window.open('/api/v1/inquiries/export_csv', '_blank');
  };

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
      await axios.patch(`/api/v1/inquiries/${statusMenuInquiryId}`, {
        property_inquiry: { status: newStatus }
      });

      // Update local state
      setInquiries(prev => prev.map(inquiry =>
        inquiry.id === statusMenuInquiryId
          ? { ...inquiry, status: newStatus }
          : inquiry
      ));
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('ステータスの更新に失敗しました');
    } finally {
      handleStatusMenuClose();
    }
  };

  // Reply dialog handlers
  const handleOpenReplyDialog = (inquiry) => {
    setReplyInquiry(inquiry);
    setReplySubject(`Re: ${inquiry.property_publication?.room?.building?.name || ''} についてのお問い合わせ`);
    setReplyBody('');
    setReplyDialogOpen(true);
  };

  const handleCloseReplyDialog = () => {
    setReplyDialogOpen(false);
    setReplyInquiry(null);
    setReplySubject('');
    setReplyBody('');
  };

  const handleSendReply = async () => {
    if (!replyInquiry || !replySubject.trim() || !replyBody.trim()) return;

    try {
      setReplySending(true);
      await axios.post(`/api/v1/inquiries/${replyInquiry.id}/reply`, {
        subject: replySubject,
        body: replyBody
      });

      // Update local state
      setInquiries(prev => prev.map(inquiry =>
        inquiry.id === replyInquiry.id
          ? { ...inquiry, status: 'replied', replied_at: new Date().toISOString() }
          : inquiry
      ));

      handleCloseReplyDialog();
    } catch (err) {
      console.error('Failed to send reply:', err);
      setError('返信メールの送信に失敗しました');
    } finally {
      setReplySending(false);
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
                <TableCell>種別</TableCell>
                <TableCell>ステータス</TableCell>
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
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {searchQuery ? '検索結果がありません' : '問い合わせがありません'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInquiries.map((inquiry) => {
                  const sourceInfo = getSourceInfo(inquiry.source);
                  const sourceTypeInfo = getSourceTypeInfo(inquiry.source_type);
                  const statusInfo = getStatusInfo(inquiry.status);
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
                          <Tooltip title={sourceTypeInfo.label}>
                            <Chip
                              size="small"
                              icon={sourceTypeInfo.icon}
                              label={sourceTypeInfo.label}
                              color={sourceTypeInfo.color}
                              variant="outlined"
                              sx={{ height: 24 }}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={statusInfo.label}
                            color={statusInfo.color}
                            onClick={(e) => handleStatusClick(e, inquiry.id)}
                            sx={{ height: 24, cursor: 'pointer' }}
                          />
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
                        <TableCell colSpan={8} sx={{ py: 0, borderBottom: isExpanded ? undefined : 'none' }}>
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

                              {/* 返信済みの場合、返信内容を表示 */}
                              {inquiry.status === 'replied' && inquiry.reply_message && (
                                <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'success.50', borderColor: 'success.main' }}>
                                  <Typography variant="subtitle2" gutterBottom color="success.dark">
                                    返信内容 ({inquiry.formatted_replied_at || formatDate(inquiry.replied_at)})
                                  </Typography>
                                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {inquiry.reply_message}
                                  </Typography>
                                </Paper>
                              )}

                              {/* 登録元URL */}
                              {inquiry.source_url && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                    登録元URL
                                  </Typography>
                                  <Tooltip title={inquiry.source_url}>
                                    <Chip
                                      size="small"
                                      icon={<LinkIcon fontSize="small" />}
                                      label={(() => { try { return new URL(inquiry.source_url).pathname; } catch { return inquiry.source_url; } })()}
                                      variant="outlined"
                                      sx={{ height: 22, fontSize: '0.7rem', maxWidth: 300 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(inquiry.source_url, '_blank');
                                      }}
                                    />
                                  </Tooltip>
                                </Box>
                              )}

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
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  startIcon={<ReplyIcon />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenReplyDialog(inquiry);
                                  }}
                                >
                                  返信する
                                </Button>
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
                                  メールクライアント
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

      {/* Status change menu */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleStatusMenuClose}
      >
        <MenuItem onClick={() => handleStatusChange('unreplied')}>
          <ListItemIcon>
            <Chip size="small" label="未返信" color="error" sx={{ height: 20 }} />
          </ListItemIcon>
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('replied')}>
          <ListItemIcon>
            <Chip size="small" label="返信済み" color="success" sx={{ height: 20 }} />
          </ListItemIcon>
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('no_reply_needed')}>
          <ListItemIcon>
            <Chip size="small" label="返信不要" color="default" sx={{ height: 20 }} />
          </ListItemIcon>
        </MenuItem>
      </Menu>

      {/* Reply dialog */}
      <Dialog
        open={replyDialogOpen}
        onClose={handleCloseReplyDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReplyIcon />
            問い合わせへの返信
          </Box>
          <IconButton onClick={handleCloseReplyDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {replyInquiry && (
            <Box>
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  元のお問い合わせ
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {replyInquiry.name} 様 ({replyInquiry.email})
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                  {replyInquiry.message}
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="宛先"
                value={replyInquiry.email}
                disabled
                margin="normal"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="件名"
                value={replySubject}
                onChange={(e) => setReplySubject(e.target.value)}
                margin="normal"
                size="small"
                required
              />

              <TextField
                fullWidth
                label="本文"
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                margin="normal"
                multiline
                rows={8}
                required
                placeholder="返信内容を入力してください..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReplyDialog}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSendReply}
            disabled={replySending || !replySubject.trim() || !replyBody.trim()}
            startIcon={replySending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
          >
            {replySending ? '送信中...' : '送信'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
