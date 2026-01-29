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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
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
import EditInquiryDialog from '../components/Customer/EditInquiryDialog';
import EditPropertyInquiryDialog from '../components/Customer/EditPropertyInquiryDialog';
import AddPropertyDialog from '../components/Customer/AddPropertyDialog';

// Customer status mapping
const getStatusInfo = (status) => {
  const statusMap = {
    active: { label: 'アクティブ', color: 'success' },
    archived: { label: 'アーカイブ', color: 'default' }
  };
  return statusMap[status] || { label: status || 'アクティブ', color: 'success' };
};

// Inquiry status mapping (active/on_hold/closed)
const INQUIRY_STATUS_MAP = {
  active: { label: 'アクティブ', color: 'success' },
  on_hold: { label: '保留中', color: 'warning' },
  closed: { label: 'クローズ', color: 'default' }
};

const getInquiryStatusInfo = (status) => {
  return INQUIRY_STATUS_MAP[status] || { label: status || 'アクティブ', color: 'default' };
};

// Deal status mapping (on PropertyInquiry)
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

// PI status mapping (pending/in_progress/completed)
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

  // Dialog states
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusDialogInquiry, setStatusDialogInquiry] = useState(null);
  const [createInquiryDialogOpen, setCreateInquiryDialogOpen] = useState(false);
  const [editingInquiry, setEditingInquiry] = useState(null);
  const [editingPropertyInquiry, setEditingPropertyInquiry] = useState(null);
  const [editingActivity, setEditingActivity] = useState(null);
  const [addPropertyDialogOpen, setAddPropertyDialogOpen] = useState(false);

  // Case (inquiry) selector state
  const [selectedInquiryId, setSelectedInquiryId] = useState(null);
  const [selectedPropertyInquiryId, setSelectedPropertyInquiryId] = useState(null);

  // PI status change menu states
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [statusMenuPIId, setStatusMenuPIId] = useState(null);

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

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
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
    setSelectedPropertyInquiryId(null);
  };

  // Handler for property inquiry card click (toggle selection)
  const handlePropertyInquiryClick = (piId) => {
    setSelectedPropertyInquiryId(prev => prev === piId ? null : piId);
  };

  // PI status menu handlers (for pending/in_progress/completed)
  const handlePIStatusClick = (event, piId) => {
    event.stopPropagation();
    setStatusMenuAnchor(event.currentTarget);
    setStatusMenuPIId(piId);
  };

  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
    setStatusMenuPIId(null);
  };

  const handlePIStatusChange = async (newStatus) => {
    if (!statusMenuPIId) return;

    try {
      const response = await axios.patch(`/api/v1/property_inquiries/${statusMenuPIId}`, {
        property_inquiry: { status: newStatus }
      });

      // Update local state
      setInquiries(prev => prev.map(inquiry => ({
        ...inquiry,
        property_inquiries: (inquiry.property_inquiries || []).map(pi =>
          pi.id === statusMenuPIId
            ? { ...pi, status: newStatus, status_label: response.data.inquiry?.status_label }
            : pi
        )
      })));

      loadActivities();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      handleStatusMenuClose();
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
        {/* Row 1: Customer info + contact */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
          <IconButton onClick={() => navigate('/customers')} size="small" sx={{ alignSelf: 'center' }}>
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
            {/* 顧客レベルの最新deal_status（PI由来） */}
            {customer.deal_status && (
              <Chip
                size="small"
                icon={<FlagIcon />}
                label={customer.deal_status_label || dealStatusInfo.label}
                color={dealStatusInfo.color}
                sx={{ height: 22 }}
              />
            )}
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

          {/* Contact info in header */}
          {customer.email && (
            <Tooltip title={customer.email}>
              <Chip
                size="small"
                icon={<EmailIcon />}
                label={customer.email}
                component="a"
                href={`mailto:${customer.email}`}
                clickable
                variant="outlined"
                sx={{ height: 24, maxWidth: 200, fontSize: '0.75rem' }}
              />
            </Tooltip>
          )}
          {customer.phone && (
            <Tooltip title={customer.phone}>
              <Chip
                size="small"
                icon={<PhoneIcon />}
                label={customer.phone}
                component="a"
                href={`tel:${customer.phone}`}
                clickable
                variant="outlined"
                sx={{ height: 24, fontSize: '0.75rem' }}
              />
            </Tooltip>
          )}
        </Box>

        {/* Row 2: Dates + stats */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 5.5 }}>
          <Typography variant="caption" color="text.secondary">
            登録日: {customer.created_at}
            {customer.deal_status_changed_at && (
              <> | ステータス更新: {customer.deal_status_changed_at}</>
            )}
            {customer.last_contacted_at && (
              <> | 最終連絡: {customer.last_contacted_at}</>
            )}
            {customer.last_inquiry_at && (
              <> | 最終問合せ: {customer.last_inquiry_at}</>
            )}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Chip
            size="small"
            icon={<QuestionAnswerIcon />}
            label={`問い合わせ ${customer.inquiry_count || 0}件`}
            variant="outlined"
            sx={{ height: 22, fontSize: '0.7rem' }}
          />
          <Chip
            size="small"
            icon={<KeyIcon />}
            label={`アクセス権 ${customer.access_count || 0}件`}
            variant="outlined"
            sx={{ height: 22, fontSize: '0.7rem' }}
          />
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
        {/* Left Column - Inquiry List */}
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
              <FlagIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                案件一覧
              </Typography>
              <Chip label={inquiries.length} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.75rem' }} />
            </Box>
            <Tooltip title="案件を作成">
              <IconButton size="small" color="primary" onClick={() => setCreateInquiryDialogOpen(true)}>
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ p: 1.5, overflow: 'auto', flex: 1 }}>
            {inquiries.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <FlagIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                        {/* Inquiry Header: Status */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <FlagIcon sx={{ fontSize: 16, color: `${inquiryStatusInfo.color}.main` }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                              案件 #{inquiry.id}
                            </Typography>
                          </Box>
                          <Tooltip title="クリックしてステータスを変更">
                            <Chip
                              size="small"
                              label={inquiry.status_label || inquiryStatusInfo.label}
                              color={inquiryStatusInfo.color}
                              onClick={(e) => {
                                e.stopPropagation();
                                setStatusDialogInquiry(inquiry);
                                setStatusDialogOpen(true);
                              }}
                              sx={{ height: 18, fontSize: '0.65rem', cursor: 'pointer' }}
                            />
                          </Tooltip>
                        </Box>

                        {/* PI count */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <HomeIcon sx={{ fontSize: 14, color: 'action.active' }} />
                          <Typography variant="caption" color="text.secondary">
                            物件: {(inquiry.property_inquiries || []).length}件
                          </Typography>
                        </Box>

                        {/* Notes */}
                        {inquiry.notes && (
                          <Typography
                            variant="body2"
                            sx={{
                              whiteSpace: 'pre-wrap',
                              bgcolor: 'white',
                              p: 1,
                              borderRadius: 1,
                              maxHeight: 40,
                              overflow: 'auto',
                              fontSize: '0.8rem',
                              mb: 0.5
                            }}
                          >
                            {inquiry.notes}
                          </Typography>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {inquiry.created_at}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Tooltip title="案件を編集">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingInquiry(inquiry);
                                }}
                                sx={{ p: 0.25 }}
                              >
                                <EditIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
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
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
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
              // Filter activities if a specific inquiry or property inquiry is selected
              const filteredActivities = selectedPropertyInquiryId
                ? activities.filter(a => a.property_inquiry_id === selectedPropertyInquiryId)
                : selectedInquiryId
                  ? activities.filter(a => a.inquiry_id === selectedInquiryId)
                  : activities;

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

            {/* Inquiries Tab Panel - Selected inquiry's PropertyInquiries */}
            <Box sx={{ p: 2, flex: 1, overflow: 'auto', display: rightTab === 0 ? 'block' : 'none' }}>
              {!selectedInquiryId ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <QuestionAnswerIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                  <Typography color="text.secondary">
                    左の案件一覧から案件を選択してください
                  </Typography>
                </Box>
              ) : (() => {
                const selectedInquiry = inquiries.find(i => i.id === selectedInquiryId);
                const propertyInquiries = selectedInquiry?.property_inquiries || [];
                return (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => setAddPropertyDialogOpen(true)}
                      fullWidth
                    >
                      物件を追加
                    </Button>
                    {propertyInquiries.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <HomeIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                        <Typography color="text.secondary">
                          この案件に紐づく物件問い合わせはありません
                        </Typography>
                      </Box>
                    ) : (<>
                    {propertyInquiries.map((pi) => {
                      const piStatusInfo = getPIStatusInfo(pi.status);
                      const piDealStatusInfo = getDealStatusInfo(pi.deal_status);
                      const piPriorityInfo = getPriorityInfo(pi.priority);
                      const isPiSelected = selectedPropertyInquiryId === pi.id;
                      return (
                        <Card
                          key={pi.id}
                          variant="outlined"
                          onClick={() => handlePropertyInquiryClick(pi.id)}
                          sx={{
                            bgcolor: isPiSelected ? 'primary.50' : 'grey.50',
                            cursor: 'pointer',
                            borderLeft: isPiSelected ? '3px solid' : '1px solid',
                            borderLeftColor: isPiSelected ? 'primary.main' : 'divider',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: isPiSelected ? 'primary.100' : 'grey.100',
                              borderLeftColor: isPiSelected ? 'primary.dark' : 'primary.light'
                            }
                          }}
                        >
                          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <HomeIcon sx={{ fontSize: 16, color: 'action.active' }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                  {pi.property_title || '物件名なし'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                <Tooltip title="クリックしてステータスを変更">
                                  <Chip
                                    size="small"
                                    label={pi.status_label || piStatusInfo.label}
                                    color={piStatusInfo.color}
                                    onClick={(e) => handlePIStatusClick(e, pi.id)}
                                    sx={{ height: 20, fontSize: '0.65rem', cursor: 'pointer' }}
                                  />
                                </Tooltip>
                                {pi.room?.id && (
                                  <Tooltip title="部屋詳細を開く">
                                    <IconButton
                                      size="small"
                                      component={RouterLink}
                                      to={`/room/${pi.room.id}`}
                                      sx={{ p: 0.25 }}
                                    >
                                      <OpenInNewIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </Box>
                            {/* Deal status + Priority + Assigned user (now on PI) */}
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5, alignItems: 'center' }}>
                              <Chip
                                size="small"
                                icon={<FlagIcon />}
                                label={pi.deal_status_label || piDealStatusInfo.label}
                                color={piDealStatusInfo.color}
                                sx={{ height: 18, fontSize: '0.65rem' }}
                              />
                              {pi.priority && pi.priority !== 'normal' && (
                                <Chip
                                  size="small"
                                  label={pi.priority_label || piPriorityInfo.label}
                                  color={piPriorityInfo.color}
                                  sx={{ height: 18, fontSize: '0.65rem' }}
                                />
                              )}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                <PersonIcon sx={{ fontSize: 14, color: pi.assigned_user ? 'primary.main' : 'action.disabled' }} />
                                <Typography variant="caption" color={pi.assigned_user ? 'text.secondary' : 'text.disabled'} sx={{ fontSize: '0.65rem' }}>
                                  {pi.assigned_user?.name || '未設定'}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                              <Chip size="small" label={pi.origin_type_label || pi.origin_type} variant="outlined" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                              <Chip size="small" label={pi.media_type_label || pi.media_type} variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                                {pi.created_at}
                              </Typography>
                              <Box sx={{ flex: 1 }} />
                              <Tooltip title="商談情報を編集">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingPropertyInquiry(pi);
                                  }}
                                  sx={{ p: 0.25 }}
                                >
                                  <EditIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </>
                    )}
                  </Box>
                );
              })()}
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
        propertyInquiries={inquiries.flatMap(i => i.property_inquiries || [])}
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

      {/* Status Change Dialog (Inquiry status: active/on_hold/closed) */}
      <StatusChangeDialog
        open={statusDialogOpen}
        onClose={() => {
          setStatusDialogOpen(false);
          setStatusDialogInquiry(null);
        }}
        inquiryId={statusDialogInquiry?.id}
        currentStatus={statusDialogInquiry?.status || 'active'}
        onChanged={loadCustomer}
      />

      {/* Edit Inquiry Dialog (notes only) */}
      <EditInquiryDialog
        open={Boolean(editingInquiry)}
        onClose={() => setEditingInquiry(null)}
        inquiry={editingInquiry}
        onUpdated={loadCustomer}
      />

      {/* Edit Property Inquiry Dialog (deal_status/priority/assigned_user) */}
      <EditPropertyInquiryDialog
        open={Boolean(editingPropertyInquiry)}
        onClose={() => setEditingPropertyInquiry(null)}
        propertyInquiry={editingPropertyInquiry}
        users={users}
        onUpdated={loadCustomer}
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

      {/* Add Property Dialog */}
      <AddPropertyDialog
        open={addPropertyDialogOpen}
        onClose={() => setAddPropertyDialogOpen(false)}
        inquiryId={selectedInquiryId}
        onAdded={() => {
          loadCustomer();
        }}
      />

      {/* PropertyInquiry Status Menu (pending/in_progress/completed) */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleStatusMenuClose}
      >
        {(() => {
          const allPIs = inquiries.flatMap(i => i.property_inquiries || []);
          const currentPI = allPIs.find(pi => pi.id === statusMenuPIId);
          return ['pending', 'in_progress', 'completed'].map(s => {
            const labels = { pending: '未対応', in_progress: '対応中', completed: '完了' };
            const colors = { pending: 'error', in_progress: 'warning', completed: 'success' };
            return (
              <MenuItem
                key={s}
                onClick={() => handlePIStatusChange(s)}
                selected={currentPI?.status === s}
              >
                <Chip size="small" label={labels[s]} color={colors[s]} sx={{ mr: 1 }} />
                {labels[s]}
              </MenuItem>
            );
          });
        })()}
      </Menu>
    </Box>
  );
}
