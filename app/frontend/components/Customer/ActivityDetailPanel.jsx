import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Close as CloseIcon,
  TouchApp as TouchAppIcon
} from '@mui/icons-material';
import { getActivityIcon, getActivityDotColor } from './activityUtils';
import DeliveryStatusSection from './DeliveryStatusSection';

export default function ActivityDetailPanel({ activity, onClose }) {
  if (!activity) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 3 }}>
        <TouchAppIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1.5 }} />
        <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
          対応履歴を選択してください
        </Typography>
      </Box>
    );
  }

  const dotColor = getActivityDotColor(activity.activity_type);
  const showTracking = activity.direction === 'outbound' &&
    (activity.activity_type === 'email' || activity.activity_type === 'line_message' || activity.activity_type === 'inquiry_replied');

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
            bgcolor: `${dotColor}.light`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: `${dotColor}.main`,
            flexShrink: 0
          }}
        >
          {getActivityIcon(activity.activity_type, activity.direction)}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.3 }} noWrap>
            {activity.subject || activity.activity_type_label}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25 }}>
            <Chip size="small" label={activity.activity_type_label} sx={{ height: 18, fontSize: '0.65rem' }} />
            {activity.direction_label && (
              <Chip size="small" label={activity.direction_label} variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
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
        {/* LINE image message */}
        {activity.activity_type === 'line_message' && activity.metadata?.image_url && (
          <Box sx={{ mb: 2 }}>
            <Box
              component="img"
              src={activity.metadata.image_url}
              alt="LINE画像"
              sx={{
                maxWidth: '100%',
                maxHeight: 300,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}
            />
          </Box>
        )}

        {/* Main content */}
        {activity.content ? (
          activity.content_format === 'html' ? (
            <Box
              sx={{
                '& p': { m: 0, mb: 1 },
                '& p:last-child': { mb: 0 },
                '& ul, & ol': { m: 0, pl: 2.5 },
                '& blockquote': { m: 0, pl: 1.5, borderLeft: '3px solid', borderColor: 'divider', color: 'text.secondary' },
                '& a': { color: 'primary.main' },
                fontSize: '0.875rem',
                lineHeight: 1.7,
                mb: 2,
              }}
              dangerouslySetInnerHTML={{ __html: activity.content }}
            />
          ) : (
            <Typography
              variant="body2"
              sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, mb: 2 }}
            >
              {activity.content}
            </Typography>
          )
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            詳細内容なし
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Meta info */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              登録日時:
            </Typography>
            <Typography variant="body2">
              {activity.formatted_created_at}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              登録者:
            </Typography>
            <Typography variant="body2">
              {activity.user?.name || '-'}
            </Typography>
          </Box>
        </Box>

        {/* Delivery status */}
        {showTracking && (
          <>
            <Divider sx={{ my: 2 }} />
            <DeliveryStatusSection
              metadata={activity.metadata || {}}
              activityType={activity.activity_type}
            />
          </>
        )}
      </Box>
    </Box>
  );
}
