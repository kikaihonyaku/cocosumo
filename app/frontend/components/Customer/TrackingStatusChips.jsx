import React from 'react';
import { Box, Typography } from '@mui/material';

// Email tracking status chips
function EmailTrackingChips({ metadata, variant, isOutbound }) {
  const chips = [];
  const fontSize = variant === 'chat' ? '0.6rem' : '0.7rem';
  const textColor = isOutbound ? 'rgba(255,255,255,0.8)' : 'text.secondary';

  // Bounce/drop (error state)
  if (metadata.email_bounced_at) {
    chips.push({ icon: '⚠', label: '配信失敗', color: 'error.main' });
  } else if (metadata.email_dropped_at) {
    chips.push({ icon: '⚠', label: '配信失敗', color: 'error.main' });
  } else {
    if (metadata.email_delivered_at) {
      chips.push({ icon: '✓', label: '配信済み' });
    }
    if (metadata.email_opened_at) {
      const count = metadata.email_open_count || 1;
      chips.push({ icon: '👁', label: `開封${count}回` });
    }
    if (metadata.email_clicked_at) {
      const count = metadata.email_click_count || 1;
      chips.push({ icon: '🔗', label: `クリック${count}回` });
    }
  }

  if (chips.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 0.5 }}>
      {chips.map((chip, i) => (
        <Typography
          key={i}
          variant="caption"
          sx={{
            fontSize,
            color: chip.color || textColor,
            fontWeight: chip.color ? 600 : 400,
          }}
        >
          {chip.icon} {chip.label}
        </Typography>
      ))}
    </Box>
  );
}

// LINE tracking status chips
function LineTrackingChips({ metadata, variant, isOutbound }) {
  const fontSize = variant === 'chat' ? '0.6rem' : '0.7rem';
  const textColor = isOutbound ? 'rgba(255,255,255,0.8)' : 'text.secondary';

  if (!metadata.line_link_clicked_at) return null;

  const count = metadata.line_click_count || 1;
  return (
    <Box sx={{ display: 'flex', gap: 0.75, mt: 0.5 }}>
      <Typography variant="caption" sx={{ fontSize, color: textColor }}>
        🔗 リンククリック{count}回
      </Typography>
    </Box>
  );
}

export default function TrackingStatusChips({ metadata, activityType, variant = 'timeline', isOutbound = false }) {
  if (!metadata) return null;

  if (activityType === 'email' || activityType === 'inquiry_replied') {
    return <EmailTrackingChips metadata={metadata} variant={variant} isOutbound={isOutbound} />;
  }

  if (activityType === 'line_message') {
    return <LineTrackingChips metadata={metadata} variant={variant} isOutbound={isOutbound} />;
  }

  return null;
}
