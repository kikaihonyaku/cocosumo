import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { getActivityIcon, getActivityDotColor } from './activityUtils';

export default function ActivityDetailDialog({ open, onClose, activity }) {
  if (!activity) return null;

  const dotColor = getActivityDotColor(activity.activity_type);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
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
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.3 }}>
            {activity.subject || activity.activity_type_label}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
            <Chip size="small" label={activity.activity_type_label} sx={{ height: 20, fontSize: '0.7rem' }} />
            {activity.direction_label && (
              <Chip size="small" label={activity.direction_label} variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
            )}
          </Box>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        {activity.content ? (
          <Typography
            variant="body2"
            sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, mb: 2 }}
          >
            {activity.content}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            詳細内容なし
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

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
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
}
