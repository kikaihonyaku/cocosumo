import React from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Note as NoteIcon,
  Home as HomeIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { getActivityIcon, getActivityDotColor, filterActivities } from './activityUtils';
import TrackingStatusChips from './TrackingStatusChips';

export default function ActivityTimeline({
  activities,
  selectedInquiryId,
  selectedPropertyInquiryId,
  onAddActivity,
  onViewActivity,
  hasMore,
  onLoadMore,
  loadingMore
}) {
  const filteredActivities = filterActivities(activities, selectedInquiryId, selectedPropertyInquiryId);

  if (filteredActivities.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <NoteIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
        <Typography color="text.secondary">
          {selectedPropertyInquiryId ? 'この問い合わせに関連する対応履歴はありません' : selectedInquiryId ? 'この案件に関連する対応履歴はありません' : '対応履歴はありません'}
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={onAddActivity}
          sx={{ mt: 2 }}
        >
          最初の対応を記録
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <List sx={{ py: 0 }}>
        {filteredActivities.map((activity, index) => (
          <ListItem
            key={activity.id}
            onClick={() => onViewActivity?.(activity)}
            sx={{
              px: 0,
              py: 1.5,
              borderBottom: index < filteredActivities.length - 1 ? '1px solid' : 'none',
              borderColor: 'divider',
              alignItems: 'flex-start',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' },
              borderRadius: 1
            }}
          >
            <ListItemIcon sx={{ minWidth: 44, mt: 0.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: `${getActivityDotColor(activity.activity_type)}.light`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: `${getActivityDotColor(activity.activity_type)}.main`
                }}
              >
                {getActivityIcon(activity.activity_type, activity.direction)}
              </Box>
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{ component: 'div' }}
              secondaryTypographyProps={{ component: 'div' }}
              primary={
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {activity.subject || activity.activity_type_label}
                    </Typography>
                    <Chip
                      size="small"
                      label={activity.activity_type_label}
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                    {activity.direction && activity.direction !== 'internal' && (
                      <Chip
                        size="small"
                        label={activity.direction_label}
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                  {!selectedPropertyInquiryId && !selectedInquiryId && activity.property_inquiry_id && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <HomeIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                      <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500 }}>
                        {activity.property_publication?.title || activity.property_title || '案件'}
                      </Typography>
                    </Box>
                  )}
                </Box>
              }
              secondary={
                <Box sx={{ mt: 0.5 }}>
                  {activity.content && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        maxHeight: 80,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        mb: 0.5
                      }}
                    >
                      {activity.content_format === 'html'
                        ? activity.content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
                        : activity.content}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      {activity.formatted_date || activity.formatted_created_at}
                    </Typography>
                    {activity.user && (
                      <Typography variant="caption" color="text.secondary">
                        {activity.user.name}
                      </Typography>
                    )}
                  </Box>
                  {activity.direction === 'outbound' && activity.metadata && (
                    <TrackingStatusChips
                      metadata={activity.metadata}
                      activityType={activity.activity_type}
                      variant="timeline"
                    />
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
      {hasMore && !selectedInquiryId && !selectedPropertyInquiryId && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={loadingMore ? <CircularProgress size={16} /> : <ExpandMoreIcon />}
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? '読み込み中...' : 'もっと読み込む'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
