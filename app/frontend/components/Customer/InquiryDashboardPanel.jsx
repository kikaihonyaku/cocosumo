import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Flag as FlagIcon,
  Close as CloseIcon,
  TouchApp as TouchAppIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Key as KeyIcon,
  Visibility as VisibilityIcon,
  Note as NoteIcon
} from '@mui/icons-material';
import { getActivityIcon, getActivityDotColor } from './activityUtils';

const INQUIRY_STATUS_MAP = {
  active: { label: 'アクティブ', color: 'success' },
  on_hold: { label: '保留中', color: 'warning' },
  closed: { label: 'クローズ', color: 'default' }
};

const getInquiryStatusInfo = (status) =>
  INQUIRY_STATUS_MAP[status] || { label: status || 'アクティブ', color: 'default' };

const DEAL_STATUS_MAP = {
  new_inquiry: { label: '新規反響', color: 'info' },
  contacting: { label: '対応中', color: 'primary' },
  viewing_scheduled: { label: '内見予約', color: 'secondary' },
  viewing_done: { label: '内見済', color: 'warning' },
  application: { label: '申込', color: 'success' },
  contracted: { label: '成約', color: 'success' },
  lost: { label: '失注', color: 'error' }
};

export default function InquiryDashboardPanel({ inquiry, accesses, activities, onClose }) {
  // Filter accesses and activities for this inquiry
  const inquiryAccesses = useMemo(() => {
    if (!inquiry) return [];
    return accesses.filter(a => a.inquiry_id === inquiry.id);
  }, [inquiry, accesses]);

  const inquiryActivities = useMemo(() => {
    if (!inquiry) return [];
    return activities.filter(a => a.inquiry_id === inquiry.id);
  }, [inquiry, activities]);

  // deal_status pipeline counts
  const dealStatusCounts = useMemo(() => {
    if (!inquiry) return [];
    const pis = inquiry.property_inquiries || [];
    const counts = {};
    for (const pi of pis) {
      const status = pi.deal_status || 'new_inquiry';
      counts[status] = (counts[status] || 0) + 1;
    }
    return Object.entries(counts).map(([status, count]) => ({
      status,
      count,
      ...(DEAL_STATUS_MAP[status] || { label: status, color: 'default' })
    }));
  }, [inquiry]);

  // Access summary
  const accessSummary = useMemo(() => {
    const total = inquiryAccesses.length;
    const active = inquiryAccesses.filter(a => a.status === 'active').length;
    const totalViews = inquiryAccesses.reduce((sum, a) => sum + (a.view_count || 0), 0);
    return { total, active, totalViews };
  }, [inquiryAccesses]);

  // Recent 5 activities
  const recentActivities = inquiryActivities.slice(0, 5);
  const remainingCount = Math.max(0, inquiryActivities.length - 5);

  if (!inquiry) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 3 }}>
        <TouchAppIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1.5 }} />
        <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
          案件または物件を選択してください
        </Typography>
      </Box>
    );
  }

  const statusInfo = getInquiryStatusInfo(inquiry.status);
  const propertyInquiries = inquiry.property_inquiries || [];

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
          <FlagIcon fontSize="small" />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.3 }} noWrap>
            案件 #{inquiry.id}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25 }}>
            <Chip
              size="small"
              label={inquiry.status_label || statusInfo.label}
              color={statusInfo.color}
              sx={{ height: 18, fontSize: '0.65rem' }}
            />
            {propertyInquiries.length > 0 && (
              <Chip
                size="small"
                label={`物件 ${propertyInquiries.length}件`}
                variant="outlined"
                sx={{ height: 18, fontSize: '0.65rem' }}
              />
            )}
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
        {/* Inquiry Info */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {inquiry.assigned_user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">担当:</Typography>
              <Typography variant="body2">{inquiry.assigned_user.name}</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">作成日:</Typography>
            <Typography variant="body2">{inquiry.created_at}</Typography>
          </Box>
        </Box>

        {inquiry.notes && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>メモ</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, bgcolor: 'grey.50', p: 1.5, borderRadius: 1 }}>
              {inquiry.notes}
            </Typography>
          </>
        )}

        {/* Deal Status Pipeline */}
        {dealStatusCounts.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <FlagIcon sx={{ fontSize: 18, color: 'primary.main' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                物件パイプライン
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {dealStatusCounts.map(({ status, count, label, color }) => (
                <Chip
                  key={status}
                  size="small"
                  label={`${label} ×${count}`}
                  color={color}
                  variant="outlined"
                  sx={{ height: 24, fontSize: '0.75rem' }}
                />
              ))}
            </Box>
          </>
        )}

        {/* Access Summary */}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <KeyIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            マイページ集計
          </Typography>
        </Box>
        {accessSummary.total > 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'grey.50', p: 1.5, borderRadius: 1 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>{accessSummary.total}</Typography>
              <Typography variant="caption" color="text.secondary">発行</Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1, color: 'success.main' }}>{accessSummary.active}</Typography>
              <Typography variant="caption" color="text.secondary">有効</Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, textAlign: 'center' }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <VisibilityIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>{accessSummary.totalViews}</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">閲覧</Typography>
              </Box>
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            マイページの発行はありません
          </Typography>
        )}

        {/* Recent Activities */}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <NoteIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            最近の対応履歴
          </Typography>
          {inquiryActivities.length > 0 && (
            <Chip label={`${inquiryActivities.length}件`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
          )}
        </Box>
        {recentActivities.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {recentActivities.map((act) => {
              const dotColor = getActivityDotColor(act.activity_type);
              return (
                <Box
                  key={act.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 0.75,
                    px: 1,
                    borderRadius: 1,
                    bgcolor: 'grey.50'
                  }}
                >
                  <Box sx={{ color: `${dotColor}.main`, display: 'flex', flexShrink: 0 }}>
                    {React.cloneElement(getActivityIcon(act.activity_type, act.direction), { sx: { fontSize: 16 } })}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" fontWeight={600} noWrap>
                      {act.activity_type_label}
                    </Typography>
                    {act.subject && (
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                        {act.subject}
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, fontSize: '0.65rem' }}>
                    {act.formatted_created_at || act.created_at}
                  </Typography>
                </Box>
              );
            })}
            {remainingCount > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 0.5 }}>
                他 {remainingCount} 件
              </Typography>
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            対応履歴はありません
          </Typography>
        )}
      </Box>
    </Box>
  );
}
