import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Chat as ChatIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { getActivityIcon, filterActivities, CHAT_ACTIVITY_TYPES } from './activityUtils';

export default function ActivityChatView({
  activities,
  selectedInquiryId,
  selectedPropertyInquiryId,
  onAddActivity,
  onEditActivity
}) {
  const scrollRef = useRef(null);
  const [hoveredId, setHoveredId] = useState(null);

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
      {chatActivities.map((activity) => {
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
          <Box
            key={activity.id}
            sx={{ display: 'flex', justifyContent }}
            onMouseEnter={() => setHoveredId(activity.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <Box
              sx={{
                ...bubbleSx,
                px: 2,
                py: 1,
                position: 'relative',
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

              {/* Timestamp + user */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="caption" sx={{ color: timestampColor, fontSize: '0.7rem' }}>
                  {activity.formatted_date || activity.formatted_created_at}
                </Typography>
                {activity.user && (
                  <Typography variant="caption" sx={{ color: timestampColor, fontSize: '0.7rem' }}>
                    {activity.user.name}
                  </Typography>
                )}
              </Box>

              {/* Edit button on hover */}
              {hoveredId === activity.id && (
                <Tooltip title="編集">
                  <IconButton
                    size="small"
                    onClick={() => onEditActivity(activity)}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: isOutbound ? undefined : 4,
                      left: isOutbound ? -36 : undefined,
                      bgcolor: 'background.paper',
                      boxShadow: 1,
                      '&:hover': { bgcolor: 'grey.100' },
                      width: 28,
                      height: 28,
                    }}
                  >
                    <EditIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
