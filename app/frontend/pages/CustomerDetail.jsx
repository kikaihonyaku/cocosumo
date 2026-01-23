import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  TextField,
  Card,
  CardContent,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Key as KeyIcon,
  Edit as EditIcon,
  OpenInNew as OpenInNewIcon,
  Chat as ChatIcon,
  Home as HomeIcon,
  ContentCopy as ContentCopyIcon,
  Flag as FlagIcon,
  Add as AddIcon,
  Note as NoteIcon,
  Visibility as VisibilityIcon,
  CallMade as CallMadeIcon,
  CallReceived as CallReceivedIcon,
  PriorityHigh as PriorityHighIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import axios from 'axios';
import ActivityDialog from '../components/Customer/ActivityDialog';
import StatusChangeDialog from '../components/Customer/StatusChangeDialog';
import CreateInquiryDialog from '../components/Customer/CreateInquiryDialog';

// Status label mapping
const getStatusInfo = (status) => {
  const statusMap = {
    active: { label: 'アクティブ', color: 'success' },
    archived: { label: 'アーカイブ', color: 'default' }
  };
  return statusMap[status] || { label: status || 'アクティブ', color: 'success' };
};

// Deal status mapping
const DEAL_STATUS_MAP = {
  new_inquiry: { label: '新規反響', color: 'info' },
  contacting: { label: '対応中', color: 'primary' },
  viewing_scheduled: { label: '内見予約', color: 'secondary' },
  viewing_done: { label: '内見済', color: 'warning' },
  application: { label: '申込', color: 'success' },
  contracted: { label: '成約', color: 'success' },
  lost: { label: '失注', color: 'error' }
};

const getDealStatusInfo = (status) => {
  return DEAL_STATUS_MAP[status] || { label: status, color: 'default' };
};

// Priority mapping
const PRIORITY_MAP = {
  low: { label: '低', color: 'default', icon: null },
  normal: { label: '通常', color: 'default', icon: null },
  high: { label: '高', color: 'warning', icon: <PriorityHighIcon fontSize="small" /> },
  urgent: { label: '緊急', color: 'error', icon: <WarningIcon fontSize="small" /> }
};

const getPriorityInfo = (priority) => {
  return PRIORITY_MAP[priority] || PRIORITY_MAP.normal;
};

// Activity type icons
const getActivityIcon = (activityType, direction) => {
  const iconMap = {
    phone_call: direction === 'outbound' ? <CallMadeIcon /> : direction === 'inbound' ? <CallReceivedIcon /> : <PhoneIcon />,
    email: <EmailIcon />,
    visit: <PersonIcon />,
    viewing: <VisibilityIcon />,
    note: <NoteIcon />,
    line_message: <ChatIcon />,
    inquiry: <QuestionAnswerIcon />,
    access_issued: <KeyIcon />,
    status_change: <FlagIcon />,
    assigned_user_change: <PersonIcon />
  };
  return iconMap[activityType] || <NoteIcon />;
};

// Activity dot color
const getActivityDotColor = (activityType) => {
  const colorMap = {
    phone_call: 'primary',
    email: 'info',
    visit: 'success',
    viewing: 'secondary',
    note: 'grey',
    line_message: 'success',
    inquiry: 'warning',
    access_issued: 'info',
    status_change: 'primary',
    assigned_user_change: 'secondary'
  };
  return colorMap[activityType] || 'grey';
};

// Inquiry status mapping
const getInquiryStatusInfo = (status) => {
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

// Access status mapping
const getAccessStatusInfo = (status) => {
  const statusMap = {
    active: { label: '有効', color: 'success' },
    revoked: { label: '取消済', color: 'error' },
    expired: { label: '期限切れ', color: 'default' }
  };
  return statusMap[status] || { label: status, color: 'default' };
};

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [accesses, setAccesses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ notes: '' });
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [createInquiryDialogOpen, setCreateInquiryDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);

  // Case (inquiry) selector state
  const [selectedInquiryId, setSelectedInquiryId] = useState(null);

  // Inquiry status/user change menu states
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [statusMenuInquiryId, setStatusMenuInquiryId] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [userMenuInquiryId, setUserMenuInquiryId] = useState(null);

  // Tab state for right column
  const [rightTab, setRightTab] = useState(0);

  // Pane width management for resizable layout
  const [leftPaneWidth, setLeftPaneWidth] = useState(280);
  const [rightPaneWidth, setRightPaneWidth] = useState(380);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  // Resize handlers
  const handleLeftMouseDown = (e) => {
    setIsResizingLeft(true);
    e.preventDefault();
  };

  const handleRightMouseDown = (e) => {
    setIsResizingRight(true);
    e.preventDefault();
  };

  // Mouse move/up effect for resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      const containerRect = document.querySelector('.customer-layout-container')?.getBoundingClientRect();
      if (!containerRect) return;

      if (isResizingLeft) {
        const newWidth = e.clientX - containerRect.left - 8;
        const clampedWidth = Math.max(220, Math.min(450, newWidth));
        setLeftPaneWidth(clampedWidth);
      }

      if (isResizingRight) {
        const newWidth = containerRect.right - e.clientX - 8;
        const clampedWidth = Math.max(300, Math.min(550, newWidth));
        setRightPaneWidth(clampedWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizingLeft, isResizingRight]);

  const loadCustomer = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [customerRes, inquiriesRes, accessesRes, activitiesRes, usersRes] = await Promise.all([
        axios.get(`/api/v1/customers/${id}`),
        axios.get(`/api/v1/customers/${id}/inquiries`),
        axios.get(`/api/v1/customers/${id}/accesses`),
        axios.get(`/api/v1/customers/${id}/activities`),
        axios.get('/api/v1/admin/users').catch(() => ({ data: [] }))
      ]);

      setCustomer(customerRes.data);
      setInquiries(Array.isArray(inquiriesRes.data) ? inquiriesRes.data : []);
      setAccesses(Array.isArray(accessesRes.data) ? accessesRes.data : []);
      setActivities(Array.isArray(activitiesRes.data) ? activitiesRes.data : []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setEditForm({ notes: customerRes.data.notes || '' });
    } catch (err) {
      console.error('Failed to load customer:', err);
      if (err.response?.status === 404) {
        setError('顧客が見つかりませんでした');
      } else if (err.response?.status === 401) {
        setError('顧客情報を表示するにはログインが必要です');
      } else {
        setError('顧客情報の読み込みに失敗しました');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadActivities = useCallback(async () => {
    try {
      const res = await axios.get(`/api/v1/customers/${id}/activities`);
      setActivities(res.data);
    } catch (err) {
      console.error('Failed to load activities:', err);
    }
  }, [id]);

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.patch(`/api/v1/customers/${id}`, {
        customer: { notes: editForm.notes }
      });
      setCustomer(prev => ({ ...prev, notes: editForm.notes }));
      setEditing(false);
    } catch (err) {
      console.error('Failed to save customer:', err);
      setError('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    // Simple feedback - could be improved with a snackbar
    alert('URLをコピーしました');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/customers')}
          sx={{ mt: 2 }}
        >
          顧客一覧に戻る
        </Button>
      </Box>
    );
  }

  if (!customer) {
    return null;
  }

  const statusInfo = getStatusInfo(customer.status);
  const dealStatusInfo = getDealStatusInfo(customer.deal_status);
  const priorityInfo = getPriorityInfo(customer.priority);

  // Handler for inquiry card click (toggle selection)
  const handleInquiryClick = (inquiryId) => {
    setSelectedInquiryId(prev => prev === inquiryId ? null : inquiryId);
  };

  // Inquiry status menu handlers
  const handleStatusClick = (event, inquiryId) => {
    event.stopPropagation();
    setStatusMenuAnchor(event.currentTarget);
    setStatusMenuInquiryId(inquiryId);
  };

  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
    setStatusMenuInquiryId(null);
  };

  const handleStatusChange = async (newStatus) => {
    if (!statusMenuInquiryId) return;

    try {
      const response = await axios.patch(`/api/v1/inquiries/${statusMenuInquiryId}`, {
        property_inquiry: { status: newStatus }
      });

      // Update local state
      setInquiries(prev => prev.map(inquiry =>
        inquiry.id === statusMenuInquiryId
          ? { ...inquiry, status: newStatus, status_label: response.data.inquiry?.status_label }
          : inquiry
      ));

      // Reload activities to show the new status change activity
      loadActivities();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      handleStatusMenuClose();
    }
  };

  // Inquiry assigned user menu handlers
  const handleUserClick = (event, inquiryId) => {
    event.stopPropagation();
    setUserMenuAnchor(event.currentTarget);
    setUserMenuInquiryId(inquiryId);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
    setUserMenuInquiryId(null);
  };

  const handleUserChange = async (userId) => {
    if (!userMenuInquiryId) return;

    try {
      const response = await axios.patch(`/api/v1/inquiries/${userMenuInquiryId}`, {
        property_inquiry: { assigned_user_id: userId || null }
      });

      // Update local state
      setInquiries(prev => prev.map(inquiry =>
        inquiry.id === userMenuInquiryId
          ? { ...inquiry, assigned_user: response.data.inquiry?.assigned_user }
          : inquiry
      ));

      // Reload activities to show the new assigned user change activity
      loadActivities();
    } catch (err) {
      console.error('Failed to update assigned user:', err);
    } finally {
      handleUserMenuClose();
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh * var(--vh-correction, 1) - 64px)', bgcolor: 'grey.50' }}>
      {/* Header - 2 rows */}
      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'white',
          flexShrink: 0
        }}
      >
        {/* Row 1: Customer info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
          <IconButton onClick={() => navigate('/customers')} size="small">
            <ArrowBackIcon />
          </IconButton>
          <PersonIcon color="primary" sx={{ fontSize: 24 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              {customer.name}
            </Typography>
            {customer.line_user_id && (
              <Tooltip title="LINE連携済み">
                <ChatIcon color="success" fontSize="small" />
              </Tooltip>
            )}
            <Tooltip title="クリックしてステータスを変更">
              <Chip
                size="small"
                icon={<FlagIcon />}
                label={customer.deal_status_label || dealStatusInfo.label}
                color={dealStatusInfo.color}
                onClick={() => setStatusDialogOpen(true)}
                sx={{ cursor: 'pointer', height: 22 }}
              />
            </Tooltip>
            {(customer.priority === 'high' || customer.priority === 'urgent') && (
              <Chip
                size="small"
                icon={priorityInfo.icon}
                label={customer.priority_label || priorityInfo.label}
                color={priorityInfo.color}
                sx={{ height: 22 }}
              />
            )}
            <Chip
              size="small"
              label={statusInfo.label}
              color={statusInfo.color}
              variant="outlined"
              sx={{ height: 22 }}
            />
          </Box>

          <Box sx={{ flex: 1 }} />

          {/* Create inquiry button */}
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setCreateInquiryDialogOpen(true)}
          >
            案件作成
          </Button>
        </Box>

        {/* Row 2: Dates */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 5.5 }}>
          <Typography variant="caption" color="text.secondary">
            登録日: {customer.created_at}
            {customer.deal_status_changed_at && (
              <> | ステータス更新: {customer.deal_status_changed_at}</>
            )}
          </Typography>
        </Box>
      </Paper>

      {/* Main Content - Resizable 3-column layout */}
      <Box
        className="customer-layout-container"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          gap: 0,
          overflow: 'hidden',
          p: 1
        }}
      >
        {/* Left Column - Customer Info */}
        <Paper
          elevation={2}
          sx={{
            width: isMdUp ? leftPaneWidth : '100%',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 2
          }}
        >
          {/* Panel Header */}
          <Box
            sx={{
              px: 2,
              py: 1,
              minHeight: 48,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'grey.50',
              flexShrink: 0
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                顧客情報
              </Typography>
            </Box>
          </Box>

          <Box sx={{ p: 2, overflow: 'auto', flex: 1 }}>
            {/* Contact Info */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {customer.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon color="action" fontSize="small" />
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    <a href={`mailto:${customer.email}`} style={{ color: 'inherit' }}>
                      {customer.email}
                    </a>
                  </Typography>
                </Box>
              )}

              {customer.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon color="action" fontSize="small" />
                  <Typography variant="body2">
                    <a href={`tel:${customer.phone}`} style={{ color: 'inherit' }}>
                      {customer.phone}
                    </a>
                  </Typography>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 1.5 }} />

            {/* Stats */}
            <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="h5" color="primary" sx={{ fontWeight: 600 }}>
                  {customer.inquiry_count}
                </Typography>
                <Typography variant="caption" color="text.secondary">問い合わせ</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="h5" color="info.main" sx={{ fontWeight: 600 }}>
                  {customer.access_count}
                </Typography>
                <Typography variant="caption" color="text.secondary">アクセス権</Typography>
              </Box>
            </Box>

            {/* Dates */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1.5 }}>
              {customer.last_contacted_at && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">最終連絡</Typography>
                  <Typography variant="caption">{customer.last_contacted_at}</Typography>
                </Box>
              )}
              {customer.last_inquiry_at && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">最終問合せ</Typography>
                  <Typography variant="caption">{customer.last_inquiry_at}</Typography>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 1.5 }} />

            {/* Notes Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                メモ
              </Typography>
              {!editing && (
                <IconButton size="small" onClick={() => setEditing(true)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
            </Box>

            {editing ? (
              <Box>
                <TextField
                  multiline
                  rows={3}
                  fullWidth
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ notes: e.target.value })}
                  placeholder="社内メモを入力..."
                  size="small"
                />
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    保存
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setEditing(false);
                      setEditForm({ notes: customer.notes || '' });
                    }}
                    disabled={saving}
                  >
                    取消
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography
                variant="body2"
                color={customer.notes ? 'text.primary' : 'text.secondary'}
                sx={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}
              >
                {customer.notes || 'メモなし'}
              </Typography>
            )}

            {/* Inquired Properties */}
            {customer.inquired_properties && customer.inquired_properties.length > 0 && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem', mb: 1 }}>
                  問い合わせ物件
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {customer.inquired_properties.map((title, index) => (
                    <Chip
                      key={index}
                      size="small"
                      label={title}
                      sx={{ height: 22, fontSize: '0.7rem' }}
                    />
                  ))}
                </Box>
              </>
            )}
          </Box>
        </Paper>

        {/* Left Splitter */}
        {isMdUp && (
          <Box
            onMouseDown={handleLeftMouseDown}
            sx={{
              width: 8,
              cursor: 'col-resize',
              bgcolor: isResizingLeft ? 'primary.light' : 'transparent',
              '&:hover': { bgcolor: 'action.hover' },
              transition: 'background-color 0.2s',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&::before': {
                content: '""',
                width: 3,
                height: 40,
                bgcolor: isResizingLeft ? 'primary.main' : 'grey.400',
                borderRadius: 1
              }
            }}
          />
        )}

        {/* Center Column - Activity Timeline (Main) */}
        <Paper
          elevation={2}
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 2
          }}
        >
          {/* Panel Header */}
          <Box
            sx={{
              px: 2,
              py: 1,
              minHeight: 48,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'grey.50',
              flexShrink: 0
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NoteIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                対応履歴
              </Typography>
              <Chip label={`${activities.length}件`} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.75rem' }} />
            </Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingActivity(null);
                setActivityDialogOpen(true);
              }}
            >
              追加
            </Button>
          </Box>

          <Box sx={{ p: 2, overflow: 'auto', flex: 1 }}>
            {(() => {
              // Filter activities if a specific inquiry is selected
              const filteredActivities = selectedInquiryId
                ? activities.filter(a => a.property_inquiry_id === selectedInquiryId)
                : activities;

              if (filteredActivities.length === 0) {
                return (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <NoteIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                    <Typography color="text.secondary">
                      {selectedInquiryId ? 'この案件に関連する対応履歴はありません' : '対応履歴はありません'}
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => setActivityDialogOpen(true)}
                      sx={{ mt: 2 }}
                    >
                      最初の対応を記録
                    </Button>
                  </Box>
                );
              }

              return (
                <List sx={{ py: 0 }}>
                  {filteredActivities.map((activity, index) => (
                    <ListItem
                      key={activity.id}
                      sx={{
                        px: 0,
                        py: 1.5,
                        borderBottom: index < filteredActivities.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                        alignItems: 'flex-start'
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
                            {/* Case label - only show when not filtered and there's a linked inquiry */}
                            {!selectedInquiryId && activity.property_inquiry_id && (
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
                                {activity.content}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                              <Typography variant="caption" color="text.secondary">
                                {activity.formatted_date || activity.formatted_created_at}
                              </Typography>
                              {activity.user && (
                                <Typography variant="caption" color="text.secondary">
                                  {activity.user.name}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        }
                      />
                      <Tooltip title="編集">
                        <IconButton
                          size="small"
                          sx={{ ml: 1, alignSelf: 'flex-start', mt: 0.5 }}
                          onClick={() => {
                            setEditingActivity(activity);
                            setActivityDialogOpen(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </ListItem>
                  ))}
                </List>
              );
            })()}
          </Box>
        </Paper>

        {/* Right Splitter */}
        {isMdUp && (
          <Box
            onMouseDown={handleRightMouseDown}
            sx={{
              width: 8,
              cursor: 'col-resize',
              bgcolor: isResizingRight ? 'primary.light' : 'transparent',
              '&:hover': { bgcolor: 'action.hover' },
              transition: 'background-color 0.2s',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&::before': {
                content: '""',
                width: 3,
                height: 40,
                bgcolor: isResizingRight ? 'primary.main' : 'grey.400',
                borderRadius: 1
              }
            }}
          />
        )}

        {/* Right Column - Tabs (Inquiries / Accesses) */}
        <Paper
          elevation={2}
          sx={{
            width: isMdUp ? rightPaneWidth : '100%',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 2
          }}
        >
            <Tabs
              value={rightTab}
              onChange={(e, v) => setRightTab(v)}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <QuestionAnswerIcon fontSize="small" />
                    <span>問い合わせ</span>
                    <Chip label={inquiries.length} size="small" sx={{ height: 18, fontSize: '0.7rem' }} />
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <KeyIcon fontSize="small" />
                    <span>アクセス権</span>
                    <Chip label={accesses.length} size="small" sx={{ height: 18, fontSize: '0.7rem' }} />
                  </Box>
                }
              />
            </Tabs>

            {/* Inquiries Tab Panel */}
            <Box sx={{ p: 2, flex: 1, overflow: 'auto', display: rightTab === 0 ? 'block' : 'none' }}>
              {inquiries.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    案件はありません
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateInquiryDialogOpen(true)}
                  >
                    案件を作成
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {inquiries.map((inquiry) => {
                    const inquiryStatusInfo = getInquiryStatusInfo(inquiry.status);
                    const isSelected = selectedInquiryId === inquiry.id;
                    return (
                      <Card
                        key={inquiry.id}
                        variant="outlined"
                        onClick={() => handleInquiryClick(inquiry.id)}
                        sx={{
                          bgcolor: isSelected ? 'primary.50' : 'grey.50',
                          cursor: 'pointer',
                          borderLeft: isSelected ? '3px solid' : '1px solid',
                          borderLeftColor: isSelected ? 'primary.main' : 'divider',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: isSelected ? 'primary.100' : 'grey.100',
                            borderLeftColor: isSelected ? 'primary.dark' : 'primary.light'
                          }
                        }}
                      >
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                              {inquiry.property_title || '物件名なし'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                              <Tooltip title="クリックしてステータスを変更">
                                <Chip
                                  size="small"
                                  label={inquiry.status_label || inquiryStatusInfo.label}
                                  color={inquiryStatusInfo.color}
                                  onClick={(e) => handleStatusClick(e, inquiry.id)}
                                  sx={{ height: 18, fontSize: '0.65rem', cursor: 'pointer' }}
                                />
                              </Tooltip>
                              {inquiry.room?.id && (
                                <Tooltip title="部屋詳細を開く">
                                  <IconButton
                                    size="small"
                                    component={RouterLink}
                                    to={`/room/${inquiry.room.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    sx={{ p: 0.25 }}
                                  >
                                    <OpenInNewIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </Box>
                          {/* Origin & Media Type Row */}
                          <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, flexWrap: 'wrap' }}>
                            <Chip
                              size="small"
                              label={inquiry.origin_type_label || inquiry.origin_type}
                              variant="outlined"
                              color="primary"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                            <Chip
                              size="small"
                              label={inquiry.media_type_label || inquiry.media_type}
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          </Box>
                          {/* Assigned User - always show, clickable */}
                          <Tooltip title="クリックして担当者を変更">
                            <Box
                              onClick={(e) => handleUserClick(e, inquiry.id)}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                mb: 0.5,
                                cursor: 'pointer',
                                p: 0.5,
                                borderRadius: 1,
                                '&:hover': { bgcolor: 'action.hover' }
                              }}
                            >
                              <PersonIcon sx={{ fontSize: 14, color: inquiry.assigned_user ? 'primary.main' : 'action.disabled' }} />
                              <Typography variant="caption" color={inquiry.assigned_user ? 'text.secondary' : 'text.disabled'}>
                                担当: {inquiry.assigned_user?.name || '未設定'}
                              </Typography>
                            </Box>
                          </Tooltip>
                          {/* Message if exists */}
                          {inquiry.message && (
                            <Typography
                              variant="body2"
                              sx={{
                                whiteSpace: 'pre-wrap',
                                bgcolor: 'white',
                                p: 1,
                                borderRadius: 1,
                                maxHeight: 60,
                                overflow: 'auto',
                                fontSize: '0.8rem',
                                mt: 0.5
                              }}
                            >
                              {inquiry.message}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {inquiry.created_at}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                              <Tooltip title="この案件に対応履歴を追加">
                                <Button
                                  size="small"
                                  startIcon={<AddIcon />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedInquiryId(inquiry.id);
                                    setEditingActivity(null);
                                    setActivityDialogOpen(true);
                                  }}
                                  sx={{ minWidth: 'auto', px: 1, py: 0.25, fontSize: '0.65rem' }}
                                >
                                  履歴追加
                                </Button>
                              </Tooltip>
                              <Chip
                                size="small"
                                label={inquiry.channel === 'line' ? 'LINE' : 'Web'}
                                variant="outlined"
                                sx={{ height: 18, fontSize: '0.65rem' }}
                              />
                            </Box>
                          </Box>
                          {inquiry.customer_accesses && inquiry.customer_accesses.length > 0 && (
                            <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {inquiry.customer_accesses.map((access) => (
                                  <Chip
                                    key={access.id}
                                    size="small"
                                    icon={<KeyIcon sx={{ fontSize: '12px !important' }} />}
                                    label={access.status === 'active' ? '有効' : '無効'}
                                    color={access.status === 'active' ? 'info' : 'default'}
                                    variant="outlined"
                                    sx={{ height: 18, fontSize: '0.65rem' }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </Box>

            {/* Accesses Tab Panel */}
            <Box sx={{ p: 2, flex: 1, overflow: 'auto', display: rightTab === 1 ? 'block' : 'none' }}>
              {accesses.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  発行済みアクセス権はありません
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {accesses.map((access) => {
                    const accessStatusInfo = getAccessStatusInfo(access.status);
                    return (
                      <Card key={access.id} variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                              {access.property_publication?.title || '物件名なし'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                              <Chip
                                size="small"
                                label={accessStatusInfo.label}
                                color={accessStatusInfo.color}
                                sx={{ height: 18, fontSize: '0.65rem' }}
                              />
                              {access.property_publication?.id && access.property_publication?.room_id && (
                                <Tooltip title="顧客アクセスタブを開く">
                                  <IconButton
                                    size="small"
                                    component={RouterLink}
                                    to={`/room/${access.property_publication.room_id}/property-publication/${access.property_publication.id}/edit?tab=access`}
                                    sx={{ p: 0.25 }}
                                  >
                                    <OpenInNewIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            {access.property_publication?.building_name} {access.property_publication?.room_number}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>発行日</Typography>
                              <Typography variant="caption">{access.created_at}</Typography>
                            </Box>
                            {access.expires_at && (
                              <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>有効期限</Typography>
                                <Typography variant="caption">
                                  {access.expires_at}
                                  {access.days_until_expiry !== null && access.days_until_expiry > 0 && (
                                    <Typography component="span" variant="caption" color="warning.main">
                                      {' '}(残{access.days_until_expiry}日)
                                    </Typography>
                                  )}
                                </Typography>
                              </Box>
                            )}
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>閲覧</Typography>
                              <Typography variant="caption">{access.view_count}回</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            {access.from_inquiry ? (
                              <Chip
                                size="small"
                                label="問い合わせから"
                                variant="outlined"
                                sx={{ height: 18, fontSize: '0.65rem' }}
                              />
                            ) : (
                              <Box />
                            )}
                            {access.access_token && (
                              <Tooltip title="URLをコピー">
                                <IconButton
                                  size="small"
                                  onClick={() => handleCopyUrl(`${window.location.origin}/c/${access.access_token}`)}
                                  sx={{ p: 0.25 }}
                                >
                                  <ContentCopyIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </Box>
        </Paper>
      </Box>

      {/* Activity Dialog */}
      <ActivityDialog
        open={activityDialogOpen}
        onClose={() => {
          setActivityDialogOpen(false);
          setEditingActivity(null);
        }}
        customerId={id}
        activity={editingActivity}
        inquiries={inquiries}
        selectedInquiryId={selectedInquiryId}
        onCreated={() => {
          loadActivities();
          loadCustomer();
        }}
        onUpdated={() => {
          loadActivities();
          loadCustomer();
        }}
      />

      {/* Status Change Dialog */}
      <StatusChangeDialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        customerId={id}
        currentStatus={customer.deal_status}
        onChanged={loadCustomer}
      />

      {/* Create Inquiry Dialog */}
      <CreateInquiryDialog
        open={createInquiryDialogOpen}
        onClose={() => setCreateInquiryDialogOpen(false)}
        customerId={id}
        users={users}
        onCreated={() => {
          loadCustomer();
        }}
      />

      {/* Inquiry Status Menu */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleStatusMenuClose}
      >
        <MenuItem
          onClick={() => handleStatusChange('pending')}
          selected={inquiries.find(i => i.id === statusMenuInquiryId)?.status === 'pending'}
        >
          <Chip size="small" label="未対応" color="error" sx={{ mr: 1 }} />
          未対応
        </MenuItem>
        <MenuItem
          onClick={() => handleStatusChange('in_progress')}
          selected={inquiries.find(i => i.id === statusMenuInquiryId)?.status === 'in_progress'}
        >
          <Chip size="small" label="対応中" color="warning" sx={{ mr: 1 }} />
          対応中
        </MenuItem>
        <MenuItem
          onClick={() => handleStatusChange('completed')}
          selected={inquiries.find(i => i.id === statusMenuInquiryId)?.status === 'completed'}
        >
          <Chip size="small" label="完了" color="success" sx={{ mr: 1 }} />
          完了
        </MenuItem>
      </Menu>

      {/* Inquiry Assigned User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
      >
        <MenuItem onClick={() => handleUserChange(null)}>
          <Typography color="text.secondary">担当者なし</Typography>
        </MenuItem>
        <Divider />
        {users.map((user) => (
          <MenuItem
            key={user.id}
            onClick={() => handleUserChange(user.id)}
            selected={inquiries.find(i => i.id === userMenuInquiryId)?.assigned_user?.id === user.id}
          >
            <PersonIcon sx={{ mr: 1, fontSize: 18 }} />
            {user.name}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
