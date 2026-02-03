import React, { useRef, useEffect } from 'react';
import {
  Box,
  Typography
} from '@mui/material';
import {
  Chat as ChatIcon
} from '@mui/icons-material';
import { getActivityIcon, filterActivities, CHAT_ACTIVITY_TYPES } from './activityUtils';

export default function ActivityChatView({
  activities,
  selectedInquiryId,
  selectedPropertyInquiryId,
  onAddActivity,
  onViewActivity
}) {
  const scrollRef = useRef(null);

  const filtered = filterActivities(activities, selectedInquiryId, selectedPropertyInquiryId);
  const chatActivities = filtered
    .filter(a => CHAT_ACTIVITY_TYPES.includes(a.activity_type))
    .slice()
    .reverse(); // API returns DESC, reverse to ASC (oldest first, newest at bottom)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatActivities.length]);

  if (chatActivities.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <ChatIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
        <Typography color="text.secondary">
          コミュニケーション履歴はありません
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={scrollRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        height: '100%',
        overflowY: 'auto'
      }}
    >
      {chatActivities.map((activity, index) => {
        const currentDate = activity.formatted_date || activity.formatted_created_at?.split(' ')[0];
        const prevActivity = index > 0 ? chatActivities[index - 1] : null;
        const prevDate = prevActivity ? (prevActivity.formatted_date || prevActivity.formatted_created_at?.split(' ')[0]) : null;
        const showDateSeparator = currentDate !== prevDate;
        const direction = activity.direction;
        const isOutbound = direction === 'outbound';
        const isInbound = direction === 'inbound';
        const isInternal = !isOutbound && !isInbound;

        // Alignment
        const justifyContent = isOutbound ? 'flex-end' : isInbound ? 'flex-start' : 'center';

        // Bubble styles
        const bubbleSx = isOutbound
          ? {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              borderRadius: '16px 16px 4px 16px',
              maxWidth: '75%',
            }
          : isInbound
            ? {
                bgcolor: 'grey.100',
                color: 'text.primary',
                borderRadius: '16px 16px 16px 4px',
                maxWidth: '75%',
              }
            : {
                bgcolor: 'background.paper',
                color: 'text.primary',
                border: '1px dashed',
                borderColor: 'grey.400',
                borderRadius: '12px',
                maxWidth: '85%',
              };

        const timestampColor = isOutbound ? 'rgba(255,255,255,0.7)' : 'text.secondary';

        return (
          <React.Fragment key={activity.id}>
            {showDateSeparator && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 0.5 }}>
                <Box sx={{ flex: 1, borderBottom: '1px solid', borderColor: 'divider' }} />
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem', flexShrink: 0 }}>
                  {currentDate}
                </Typography>
                <Box sx={{ flex: 1, borderBottom: '1px solid', borderColor: 'divider' }} />
              </Box>
            )}
          <Box
            sx={{ display: 'flex', justifyContent, alignItems: 'flex-end', gap: 0.5 }}
          >
            {isOutbound && (
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', mb: 0.5, flexShrink: 0 }}>
                {activity.formatted_created_at?.split(' ').slice(1).join(' ')}
              </Typography>
            )}
            <Box
              onClick={() => onViewActivity?.(activity)}
              sx={{
                ...bubbleSx,
                px: 2,
                py: 1,
                position: 'relative',
                cursor: 'pointer',
                '&:hover': { opacity: 0.85 },
              }}
            >
              {/* Type icon + label */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <Box sx={{ display: 'flex', fontSize: 16, opacity: 0.7 }}>
                  {getActivityIcon(activity.activity_type, activity.direction)}
                </Box>
                <Typography variant="caption" sx={{ opacity: 0.7, fontWeight: 500 }}>
                  {activity.activity_type_label}
                </Typography>
              </Box>

              {/* Subject */}
              {activity.subject && (
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>
                  {activity.subject}
                </Typography>
              )}

              {/* Content */}
              {activity.content && (
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {activity.content}
                </Typography>
              )}

              {/* User name */}
              {activity.user && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                  <Typography variant="caption" sx={{ color: timestampColor, fontSize: '0.65rem' }}>
                    {activity.user.name}
                  </Typography>
                </Box>
              )}

            </Box>
            {!isOutbound && (
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', mb: 0.5, flexShrink: 0 }}>
                {activity.formatted_created_at?.split(' ').slice(1).join(' ')}
              </Typography>
            )}
          </Box>
          </React.Fragment>
        );
      })}
    </Box>
  );
}
