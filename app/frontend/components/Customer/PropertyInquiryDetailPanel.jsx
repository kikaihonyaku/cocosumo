import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Button,
  CircularProgress
} from '@mui/material';
import {
  Home as HomeIcon,
  Close as CloseIcon,
  TouchApp as TouchAppIcon,
  OpenInNew as OpenInNewIcon,
  ContentCopy as ContentCopyIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Key as KeyIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon
} from '@mui/icons-material';
import axios from 'axios';

const DEAL_STATUS_MAP = {
  new_inquiry: { label: '新規反響', color: 'info' },
  contacting: { label: '対応中', color: 'primary' },
  viewing_scheduled: { label: '内見予約', color: 'secondary' },
  viewing_done: { label: '内見済', color: 'warning' },
  application: { label: '申込', color: 'success' },
  contracted: { label: '成約', color: 'success' },
  lost: { label: '失注', color: 'error' }
};

const getDealStatusInfo = (status) =>
  DEAL_STATUS_MAP[status] || { label: status, color: 'default' };

const getPIStatusInfo = (status) => {
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

const getAccessStatusInfo = (status) => {
  const statusMap = {
    active: { label: '有効', color: 'success' },
    revoked: { label: '取消済', color: 'error' },
    expired: { label: '期限切れ', color: 'default' }
  };
  return statusMap[status] || { label: status, color: 'default' };
};

const PRIORITY_MAP = {
  low: '低',
  normal: '普通',
  high: '高',
  urgent: '緊急'
};

export default function PropertyInquiryDetailPanel({
  propertyInquiry,
  accesses,
  customer,
  onAccessCreated,
  onClose
}) {
  const [issuing, setIssuing] = useState(false);

  if (!propertyInquiry) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 3 }}>
        <TouchAppIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1.5 }} />
        <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
          物件を選択してください
        </Typography>
      </Box>
    );
  }

  const pi = propertyInquiry;
  const dealStatusInfo = getDealStatusInfo(pi.deal_status);
  const piStatusInfo = getPIStatusInfo(pi.status);

  // Find access for this PI
  const piAccess = accesses.find(a => a.property_inquiry_id === pi.id);

  const handleCopyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      alert('URLをコピーしました');
    } catch {
      // Fallback for non-HTTPS (localhost)
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('URLをコピーしました');
    }
  };

  const handleIssueAccess = async () => {
    if (!pi.property_publication_id || !customer) return;
    setIssuing(true);
    try {
      await axios.post(
        `/api/v1/property_publications/${pi.property_publication_id}/customer_accesses`,
        {
          customer_access: {
            customer_name: customer.name,
            customer_email: customer.email,
            customer_phone: customer.phone,
            property_inquiry_id: pi.id,
            customer_id: customer.id,
            inquiry_id: pi.inquiry_id
          }
        }
      );
      if (onAccessCreated) onAccessCreated();
    } catch (err) {
      console.error('Failed to issue access:', err);
      alert(err.response?.data?.error || 'マイページの発行に失敗しました');
    } finally {
      setIssuing(false);
    }
  };

  // Determine inquiry_id from PI (it's nested in the inquiry)
  // We need to pass it from the parent or infer it

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'grey.50',
          flexShrink: 0
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            bgcolor: 'primary.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'primary.main',
            flexShrink: 0
          }}
        >
          <HomeIcon fontSize="small" />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.3 }} noWrap>
            {pi.property_title || '物件名なし'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25 }}>
            <Chip size="small" label={pi.deal_status_label || dealStatusInfo.label} color={dealStatusInfo.color} sx={{ height: 18, fontSize: '0.65rem' }} />
            <Chip size="small" label={pi.status_label || piStatusInfo.label} color={piStatusInfo.color} sx={{ height: 18, fontSize: '0.65rem' }} />
          </Box>
        </Box>
        <Tooltip title="閉じる">
          <IconButton size="small" onClick={onClose} sx={{ flexShrink: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {/* Property Info */}
        {pi.room && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {pi.room.building_name} {pi.room.room_number}
            </Typography>
            <Tooltip title="部屋詳細を別タブで開く">
              <IconButton
                size="small"
                component="a"
                href={`/room/${pi.room.id}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ p: 0.25 }}
              >
                <OpenInNewIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Detail rows */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {pi.priority && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>優先度:</Typography>
              <Typography variant="body2">{pi.priority_label || PRIORITY_MAP[pi.priority] || pi.priority}</Typography>
            </Box>
          )}
          {pi.assigned_user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">担当:</Typography>
              <Typography variant="body2">{pi.assigned_user.name}</Typography>
            </Box>
          )}
          {pi.media_type_label && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>媒体:</Typography>
              <Typography variant="body2">{pi.media_type_label}</Typography>
            </Box>
          )}
          {pi.origin_type_label && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>チャネル:</Typography>
              <Typography variant="body2">{pi.origin_type_label}</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">登録:</Typography>
            <Typography variant="body2">{pi.created_at}</Typography>
          </Box>
        </Box>

        {/* Message */}
        {pi.message && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>メッセージ</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, bgcolor: 'grey.50', p: 1.5, borderRadius: 1 }}>
              {pi.message}
            </Typography>
          </>
        )}

        {/* Mypage Section */}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <KeyIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            顧客マイページ
          </Typography>
        </Box>

        {piAccess ? (
          // Access exists - show details
          <Box sx={{ bgcolor: 'grey.50', borderRadius: 1, p: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip
                size="small"
                label={getAccessStatusInfo(piAccess.status).label}
                color={getAccessStatusInfo(piAccess.status).color}
                sx={{ height: 22 }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <VisibilityIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {piAccess.view_count}回閲覧
                </Typography>
              </Box>
            </Box>
            {piAccess.expires_at && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                有効期限: {piAccess.expires_at}
                {piAccess.days_until_expiry != null && piAccess.days_until_expiry >= 0 && (
                  <> (残り{piAccess.days_until_expiry}日)</>
                )}
              </Typography>
            )}
            {piAccess.access_token && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={() => handleCopyUrl(`${window.location.origin}/c/${piAccess.access_token}`)}
                sx={{ mt: 0.5 }}
              >
                URLをコピー
              </Button>
            )}
          </Box>
        ) : pi.property_publication_id ? (
          // No access but publication exists - can issue
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              マイページが未発行です
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={issuing ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
              onClick={handleIssueAccess}
              disabled={issuing}
            >
              マイページを発行
            </Button>
          </Box>
        ) : (
          // No publication at all
          <Typography variant="body2" color="text.secondary">
            マイページ公開設定がありません
          </Typography>
        )}
      </Box>
    </Box>
  );
}
