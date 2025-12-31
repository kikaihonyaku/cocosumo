import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  CircularProgress,
  Alert,
  Tooltip,
  Grid
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  ContentCopy as CopyIcon,
  Block as BlockIcon,
  AccessTime as AccessTimeIcon,
  DevicesOther as DevicesIcon,
  Close as CloseIcon,
  QrCode as QrCodeIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import axios from 'axios';

export default function CustomerAccessDetailDialog({
  open,
  onClose,
  accessId,
  onUpdate,
  // Alternative props for pre-loaded data
  customerAccess,
  onUpdated
}) {
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Normalize callback prop names
  const handleUpdate = onUpdate || onUpdated;

  useEffect(() => {
    if (open) {
      if (customerAccess) {
        // Use pre-loaded data
        setAccess(customerAccess);
        setLoading(false);
      } else if (accessId) {
        loadAccessDetails();
      }
    }
  }, [open, accessId, customerAccess]);

  const loadAccessDetails = async () => {
    const id = accessId || customerAccess?.id;
    if (!id) return;

    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/customer_accesses/${id}`);
      setAccess(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load access details:', err);
      setError('詳細の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!access) return;
    const url = `${window.location.origin}${access.public_url}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('URLをコピーしました');
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleRevoke = async () => {
    if (!access) return;
    if (!confirm(`${access.customer_name}様のアクセス権を取り消しますか？`)) return;

    try {
      await axios.post(`/api/v1/customer_accesses/${access.id}/revoke`);
      loadAccessDetails();
      handleUpdate?.();
    } catch (err) {
      console.error('Failed to revoke access:', err);
      alert('アクセス権の取り消しに失敗しました');
    }
  };

  const handleExtendExpiry = async () => {
    if (!access) return;
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 14);

    try {
      await axios.post(`/api/v1/customer_accesses/${access.id}/extend_expiry`, {
        expires_at: newExpiry.toISOString()
      });
      loadAccessDetails();
      handleUpdate?.();
      alert('有効期限を延長しました');
    } catch (err) {
      console.error('Failed to extend expiry:', err);
      alert('有効期限の延長に失敗しました');
    }
  };

  const getStatusChip = () => {
    if (!access) return null;
    if (access.status === 'revoked') {
      return <Chip label="取消済み" size="small" color="error" />;
    }
    if (access.status === 'expired' || !access['accessible?']) {
      return <Chip label="期限切れ" size="small" color="warning" />;
    }
    return <Chip label="有効" size="small" color="success" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'mobile':
        return '📱';
      case 'tablet':
        return '📱';
      case 'desktop':
        return '💻';
      default:
        return '🖥️';
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          顧客アクセス詳細
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : access ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* 基本情報 */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6">{access.customer_name}</Typography>
                {getStatusChip()}
              </Box>

              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2">{access.customer_email}</Typography>
                  </Box>
                </Grid>
                {access.customer_phone && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2">{access.customer_phone}</Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* アクセスURL */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>アクセスURL</Typography>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: 'grey.100',
                p: 1,
                borderRadius: 1
              }}>
                <Typography
                  variant="body2"
                  sx={{
                    flex: 1,
                    wordBreak: 'break-all',
                    fontFamily: 'monospace'
                  }}
                >
                  {window.location.origin}{access.public_url}
                </Typography>
                <Tooltip title="URLをコピー">
                  <IconButton size="small" onClick={handleCopyUrl}>
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>

            {/* 有効期限・統計 */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <ScheduleIcon fontSize="small" color="action" />
                    <Typography variant="subtitle2">有効期限</Typography>
                  </Box>
                  <Typography variant="body2" color={access['accessible?'] ? 'text.primary' : 'error'}>
                    {access.formatted_expires_at || '無期限'}
                  </Typography>
                  {access.days_until_expiry !== null && access['accessible?'] && (
                    <Typography variant="caption" color="text.secondary">
                      残り {access.days_until_expiry} 日
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <VisibilityIcon fontSize="small" color="action" />
                    <Typography variant="subtitle2">閲覧回数</Typography>
                  </Box>
                  <Typography variant="h5" color="primary">
                    {access.view_count}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">初回アクセス</Typography>
                  <Typography variant="body2">
                    {access.first_accessed_at ? formatDate(access.first_accessed_at) : '未アクセス'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">最終アクセス</Typography>
                  <Typography variant="body2">
                    {access.last_accessed_at ? formatDate(access.last_accessed_at) : '未アクセス'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* アクセス履歴 */}
            {access.access_history && access.access_history.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AccessTimeIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2">アクセス履歴（直近10件）</Typography>
                </Box>
                <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {access.access_history.slice(0, 10).map((entry, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{getDeviceIcon(entry.device_type)}</span>
                            <Typography variant="body2">
                              {formatDate(entry.accessed_at)}
                            </Typography>
                          </Box>
                        }
                        secondary={entry.device_type || 'Unknown device'}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            {/* お客様への申し送り事項 */}
            {access.customer_message && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.50', borderColor: 'primary.200' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <MessageIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle2" color="primary.main">お客様への申し送り事項</Typography>
                </Box>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {access.customer_message}
                </Typography>
              </Paper>
            )}

            {/* メモ */}
            {access.notes && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>メモ（管理用）</Typography>
                <Typography variant="body2" color="text.secondary">
                  {access.notes}
                </Typography>
              </Paper>
            )}

            {/* 物件情報 */}
            {access.property_publication && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>対象物件</Typography>
                <Typography variant="body2">
                  {access.property_publication.room?.building?.name} {access.property_publication.room?.room_number}号室
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {access.property_publication.title}
                </Typography>
              </Paper>
            )}
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
        <Box>
          {access?.['accessible?'] && (
            <Button
              color="error"
              startIcon={<BlockIcon />}
              onClick={handleRevoke}
            >
              アクセス取消
            </Button>
          )}
          {access && !access['accessible?'] && access.status !== 'revoked' && (
            <Button
              color="primary"
              startIcon={<ScheduleIcon />}
              onClick={handleExtendExpiry}
            >
              期限延長 (+14日)
            </Button>
          )}
        </Box>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
}
