import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Popover,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  Divider,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Email as EmailIcon,
  Chat as ChatIcon,
  QuestionAnswer as QuestionAnswerIcon,
  DoneAll as DoneAllIcon,
  Person as PersonIcon,
  RadioButtonUnchecked as UnreadDotIcon
} from '@mui/icons-material';
import { useToast } from '../../contexts/ToastContext';

const activityTypeIcon = {
  line_message: <ChatIcon fontSize="small" color="success" />,
  email: <EmailIcon fontSize="small" color="primary" />,
  inquiry: <QuestionAnswerIcon fontSize="small" color="warning" />
};

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'たった今';
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHour < 24) return `${diffHour}時間前`;
  if (diffDay < 7) return `${diffDay}日前`;
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

export default function UnreadNotificationDropdown({
  anchorEl,
  open,
  onClose,
  inquiries,
  loading,
  onMarkRead,
  onMarkUnread,
  onMarkAllRead
}) {
  const navigate = useNavigate();
  const toast = useToast();

  // クリックで遷移 + 自動既読 + undoスナックバー
  const handleInquiryClick = (inquiry) => {
    onClose();
    onMarkRead(inquiry.id);
    navigate(`/customers/${inquiry.customer.id}`);

    toast.info(`${inquiry.customer.name} の通知を既読にしました`, {
      actionLabel: '元に戻す',
      onAction: () => onMarkUnread(inquiry.id),
      duration: 5000
    });
  };

  // 遷移せずに既読にする（ドットボタン）
  const handleMarkReadOnly = (e, inquiry) => {
    e.stopPropagation();
    onMarkRead(inquiry.id);

    toast.info(`${inquiry.customer.name} の通知を既読にしました`, {
      actionLabel: '元に戻す',
      onAction: () => onMarkUnread(inquiry.id),
      duration: 5000
    });
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      slotProps={{
        paper: {
          sx: { width: 380, maxHeight: 480 }
        }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" fontWeight="bold">
          未読の問い合わせ
        </Typography>
        {inquiries.length > 0 && (
          <Button
            size="small"
            startIcon={<DoneAllIcon />}
            onClick={onMarkAllRead}
          >
            すべて既読
          </Button>
        )}
      </Box>

      <Divider />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : inquiries.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            未読の問い合わせはありません
          </Typography>
        </Box>
      ) : (
        <List sx={{ py: 0, maxHeight: 360, overflow: 'auto' }}>
          {inquiries.map((inquiry) => (
            <ListItemButton
              key={inquiry.id}
              onClick={() => handleInquiryClick(inquiry)}
              sx={{
                py: 1.5,
                '&:hover': { bgcolor: 'action.hover' },
                '&:hover .mark-read-btn': { opacity: 1 }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {activityTypeIcon[inquiry.last_activity?.activity_type] || <QuestionAnswerIcon fontSize="small" />}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" fontWeight="bold" noWrap sx={{ flex: 1 }}>
                      {inquiry.customer.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1, whiteSpace: 'nowrap' }}>
                      {formatTimeAgo(inquiry.last_inbound_at)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" color="text.secondary" noWrap component="div">
                      {inquiry.last_activity?.content || inquiry.last_activity?.subject || '新しいアクティビティ'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, alignItems: 'center' }}>
                      {inquiry.assigned_user && (
                        <Chip
                          size="small"
                          icon={<PersonIcon sx={{ fontSize: 12 }} />}
                          label={inquiry.assigned_user.name}
                          sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                      )}
                      <Chip
                        size="small"
                        label={inquiry.status_label}
                        color={inquiry.status === 'active' ? 'primary' : 'default'}
                        variant="outlined"
                        sx={{ height: 18, fontSize: '0.65rem' }}
                      />
                    </Box>
                  </Box>
                }
              />
              <Tooltip title="既読にする" placement="left">
                <IconButton
                  size="small"
                  className="mark-read-btn"
                  onClick={(e) => handleMarkReadOnly(e, inquiry)}
                  sx={{
                    ml: 0.5,
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    color: 'primary.main',
                    '&:hover': { bgcolor: 'primary.50' }
                  }}
                >
                  <UnreadDotIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </ListItemButton>
          ))}
        </List>
      )}

      {inquiries.length > 0 && (
        <>
          <Divider />
          <Box sx={{ p: 1, textAlign: 'center' }}>
            <Button
              size="small"
              onClick={() => {
                onClose();
                navigate('/admin/inquiries');
              }}
            >
              すべての問い合わせを見る
            </Button>
          </Box>
        </>
      )}
    </Popover>
  );
}
