import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Key as KeyIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  OpenInNew as OpenInNewIcon,
  Chat as ChatIcon,
  Home as HomeIcon,
  ContentCopy as ContentCopyIcon
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

// Inquiry status mapping
const getInquiryStatusInfo = (status) => {
  const statusMap = {
    status_unreplied: { label: '未返信', color: 'error' },
    status_replied: { label: '返信済み', color: 'success' },
    status_no_reply_needed: { label: '返信不要', color: 'default' }
  };
  return statusMap[status] || { label: '未返信', color: 'error' };
};

// Access status mapping
const getAccessStatusInfo = (status) => {
  const statusMap = {
    active: { label: '有効', color: 'success' },
    revoked: { label: '取消済', color: 'error' },
    expired: { label: '期限切れ', color: 'default' }
  };
  return statusMap[status] || { label: status, color: 'default' };
};

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [accesses, setAccesses] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ notes: '' });
  const [saving, setSaving] = useState(false);

  const loadCustomer = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [customerRes, inquiriesRes, accessesRes] = await Promise.all([
        axios.get(`/api/v1/customers/${id}`),
        axios.get(`/api/v1/customers/${id}/inquiries`),
        axios.get(`/api/v1/customers/${id}/accesses`)
      ]);

      setCustomer(customerRes.data);
      setInquiries(inquiriesRes.data);
      setAccesses(accessesRes.data);
      setEditForm({ notes: customerRes.data.notes || '' });
    } catch (err) {
      console.error('Failed to load customer:', err);
      if (err.response?.status === 404) {
        setError('顧客が見つかりませんでした');
      } else if (err.response?.status === 401) {
        setError('顧客情報を表示するにはログインが必要です');
      } else {
        setError('顧客情報の読み込みに失敗しました');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.patch(`/api/v1/customers/${id}`, {
        customer: { notes: editForm.notes }
      });
      setCustomer(prev => ({ ...prev, notes: editForm.notes }));
      setEditing(false);
    } catch (err) {
      console.error('Failed to save customer:', err);
      setError('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    // Simple feedback - could be improved with a snackbar
    alert('URLをコピーしました');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/customers')}
          sx={{ mt: 2 }}
        >
          顧客一覧に戻る
        </Button>
      </Box>
    );
  }

  if (!customer) {
    return null;
  }

  const statusInfo = getStatusInfo(customer.status);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/customers')}>
          <ArrowBackIcon />
        </IconButton>
        <PersonIcon color="primary" sx={{ fontSize: 32 }} />
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {customer.name}
            </Typography>
            {customer.line_user_id && (
              <Tooltip title="LINE連携済み">
                <ChatIcon color="success" />
              </Tooltip>
            )}
            <Chip
              size="small"
              label={statusInfo.label}
              color={statusInfo.color}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            登録日: {customer.created_at}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Customer Info Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              顧客情報
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {customer.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">メール</Typography>
                    <Typography variant="body2">
                      <a href={`mailto:${customer.email}`} style={{ color: 'inherit' }}>
                        {customer.email}
                      </a>
                    </Typography>
                  </Box>
                </Box>
              )}

              {customer.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">電話番号</Typography>
                    <Typography variant="body2">
                      <a href={`tel:${customer.phone}`} style={{ color: 'inherit' }}>
                        {customer.phone}
                      </a>
                    </Typography>
                  </Box>
                </Box>
              )}

              <Divider />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography variant="h4" color="primary">
                    {customer.inquiry_count}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">問い合わせ</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography variant="h4" color="info.main">
                    {customer.access_count}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">アクセス権</Typography>
                </Box>
              </Box>

              {customer.last_inquiry_at && (
                <Box>
                  <Typography variant="caption" color="text.secondary">最終問い合わせ</Typography>
                  <Typography variant="body2">{customer.last_inquiry_at}</Typography>
                </Box>
              )}

              {customer.last_contacted_at && (
                <Box>
                  <Typography variant="caption" color="text.secondary">最終連絡日</Typography>
                  <Typography variant="body2">{customer.last_contacted_at}</Typography>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Notes Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                メモ
              </Typography>
              {!editing && (
                <IconButton size="small" onClick={() => setEditing(true)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
            </Box>

            {editing ? (
              <Box>
                <TextField
                  multiline
                  rows={4}
                  fullWidth
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ notes: e.target.value })}
                  placeholder="社内メモを入力..."
                  size="small"
                />
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    保存
                  </Button>
                  <Button
                    size="small"
                    startIcon={<CancelIcon />}
                    onClick={() => {
                      setEditing(false);
                      setEditForm({ notes: customer.notes || '' });
                    }}
                    disabled={saving}
                  >
                    キャンセル
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color={customer.notes ? 'text.primary' : 'text.secondary'}>
                {customer.notes || 'メモなし'}
              </Typography>
            )}

            {/* Inquired Properties */}
            {customer.inquired_properties && customer.inquired_properties.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  問い合わせ物件
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {customer.inquired_properties.map((title, index) => (
                    <Chip
                      key={index}
                      size="small"
                      label={title}
                      icon={<HomeIcon fontSize="small" />}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </>
            )}
          </Paper>
        </Grid>

        {/* Inquiries Section */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <QuestionAnswerIcon color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                問い合わせ履歴
              </Typography>
              <Chip label={`${inquiries.length}件`} size="small" />
            </Box>

            {inquiries.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                問い合わせ履歴はありません
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {inquiries.map((inquiry) => {
                  const statusInfo = getInquiryStatusInfo(inquiry.status);
                  return (
                    <Card key={inquiry.id} variant="outlined">
                      <CardContent sx={{ pb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {inquiry.property_publication?.title || '物件名なし'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {inquiry.property_publication?.building_name} {inquiry.property_publication?.room_number}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Chip
                              size="small"
                              label={statusInfo.label}
                              color={statusInfo.color}
                              sx={{ height: 20 }}
                            />
                            <Chip
                              size="small"
                              label={inquiry.channel === 'channel_line' ? 'LINE' : 'Web'}
                              variant="outlined"
                              sx={{ height: 20 }}
                            />
                          </Box>
                        </Box>
                        <Typography variant="body2" sx={{
                          whiteSpace: 'pre-wrap',
                          bgcolor: 'grey.50',
                          p: 1.5,
                          borderRadius: 1,
                          maxHeight: 100,
                          overflow: 'auto'
                        }}>
                          {inquiry.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          {inquiry.created_at}
                        </Typography>

                        {/* Customer Accesses for this inquiry */}
                        {inquiry.customer_accesses && inquiry.customer_accesses.length > 0 && (
                          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="caption" color="text.secondary">
                              発行済みアクセス:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                              {inquiry.customer_accesses.map((access) => (
                                <Chip
                                  key={access.id}
                                  size="small"
                                  icon={<KeyIcon fontSize="small" />}
                                  label={`${access.created_at} (${access.status === 'active' ? '有効' : '無効'})`}
                                  color={access.status === 'active' ? 'info' : 'default'}
                                  variant="outlined"
                                  sx={{ height: 22 }}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            )}
          </Paper>

          {/* Accesses Section */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <KeyIcon color="info" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                発行済みアクセス権
              </Typography>
              <Chip label={`${accesses.length}件`} size="small" />
            </Box>

            {accesses.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                発行済みアクセス権はありません
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {accesses.map((access) => {
                  const statusInfo = getAccessStatusInfo(access.status);
                  return (
                    <Card key={access.id} variant="outlined">
                      <CardContent sx={{ pb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {access.property_publication?.title || '物件名なし'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {access.property_publication?.building_name} {access.property_publication?.room_number}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Chip
                              size="small"
                              label={statusInfo.label}
                              color={statusInfo.color}
                              sx={{ height: 20 }}
                            />
                            {access.from_inquiry && (
                              <Chip
                                size="small"
                                label="問い合わせから"
                                variant="outlined"
                                sx={{ height: 20 }}
                              />
                            )}
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 3, mt: 1.5, flexWrap: 'wrap' }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">発行日</Typography>
                            <Typography variant="body2">{access.created_at}</Typography>
                          </Box>
                          {access.expires_at && (
                            <Box>
                              <Typography variant="caption" color="text.secondary">有効期限</Typography>
                              <Typography variant="body2">{access.expires_at}</Typography>
                              {access.days_until_expiry !== null && access.days_until_expiry > 0 && (
                                <Typography variant="caption" color="warning.main">
                                  (残り{access.days_until_expiry}日)
                                </Typography>
                              )}
                            </Box>
                          )}
                          <Box>
                            <Typography variant="caption" color="text.secondary">閲覧回数</Typography>
                            <Typography variant="body2">{access.view_count}回</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                      <CardActions sx={{ pt: 0 }}>
                        <Button
                          size="small"
                          startIcon={<OpenInNewIcon />}
                          component={RouterLink}
                          to={`/admin/customer-access`}
                        >
                          アクセス管理へ
                        </Button>
                      </CardActions>
                    </Card>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
