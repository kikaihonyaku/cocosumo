import React, { useState, useEffect, useCallback } from 'react';
import { getZoomFactor } from '../utils/zoomUtils';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  Chat as ChatIcon,
  Flag as FlagIcon,
  Add as AddIcon,
  Note as NoteIcon,
  ViewList as ViewListIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  Send as SendIcon,
  EditNote as EditNoteIcon,
  Edit as EditIcon,
  MergeType as MergeTypeIcon,
  TouchApp as TouchAppIcon
} from '@mui/icons-material';
import axios from 'axios';
import ActivityDialog from '../components/Customer/ActivityDialog';
import StatusChangeDialog from '../components/Customer/StatusChangeDialog';
import CreateInquiryDialog from '../components/Customer/CreateInquiryDialog';
import EditInquiryDialog from '../components/Customer/EditInquiryDialog';
import EditPropertyInquiryDialog from '../components/Customer/EditPropertyInquiryDialog';
import AddPropertyDialog from '../components/Customer/AddPropertyDialog';
import ActivityTimeline from '../components/Customer/ActivityTimeline';
import ActivityChatView from '../components/Customer/ActivityChatView';
import EmailComposeDialog from '../components/Customer/EmailComposeDialog';
import LineComposeDialog from '../components/Customer/LineComposeDialog';
import EditCustomerDialog from '../components/Customer/EditCustomerDialog';
import MergeCustomerDialog from '../components/Customer/MergeCustomerDialog';
import DuplicateDetectionPanel from '../components/Customer/DuplicateDetectionPanel';
import InquiryTreePanel from '../components/Customer/InquiryTreePanel';
import ActivityDetailPanel from '../components/Customer/ActivityDetailPanel';

// Customer status mapping
const getStatusInfo = (status) => {
  const statusMap = {
    active: { label: 'アクティブ', color: 'success' },
    archived: { label: 'アーカイブ', color: 'default' }
  };
  return statusMap[status] || { label: status || 'アクティブ', color: 'success' };
};

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isMobile = !isMdUp;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [accesses, setAccesses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [hasMoreActivities, setHasMoreActivities] = useState(false);
  const [activitiesTotalCount, setActivitiesTotalCount] = useState(0);
  const [loadingMoreActivities, setLoadingMoreActivities] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoaded, setUsersLoaded] = useState(false);

  // Dialog states
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusDialogInquiry, setStatusDialogInquiry] = useState(null);
  const [createInquiryDialogOpen, setCreateInquiryDialogOpen] = useState(false);
  const [editingInquiry, setEditingInquiry] = useState(null);
  const [editingPropertyInquiry, setEditingPropertyInquiry] = useState(null);
  const [editingActivity, setEditingActivity] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [addPropertyDialogOpen, setAddPropertyDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [lineGuidanceEmailOpen, setLineGuidanceEmailOpen] = useState(false);
  const [lineDialogOpen, setLineDialogOpen] = useState(false);
  const [editCustomerDialogOpen, setEditCustomerDialogOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeSecondaryId, setMergeSecondaryId] = useState(null);

  // Case (inquiry) selector state
  const [selectedInquiryId, setSelectedInquiryId] = useState(null);
  const [selectedPropertyInquiryId, setSelectedPropertyInquiryId] = useState(null);

  // PI status change menu states
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [statusMenuPIId, setStatusMenuPIId] = useState(null);

  // Activity view mode toggle (timeline vs chat)
  const [activityViewMode, setActivityViewMode] = useState('timeline');

  // Mobile panel tab (0=案件, 1=履歴, 2=詳細)
  const [mobilePanelIndex, setMobilePanelIndex] = useState(1);

  // Pane width management for resizable layout
  const [leftPaneWidth, setLeftPaneWidth] = useState(300);
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
      const zoom = getZoomFactor();

      if (isResizingLeft) {
        const newWidth = (e.clientX - containerRect.left) / zoom - 8;
        const clampedWidth = Math.max(250, Math.min(450, newWidth));
        setLeftPaneWidth(clampedWidth);
      }

      if (isResizingRight) {
        const newWidth = (containerRect.right - e.clientX) / zoom - 8;
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

      const [customerRes, inquiriesRes, accessesRes, activitiesRes] = await Promise.all([
        axios.get(`/api/v1/customers/${id}`),
        axios.get(`/api/v1/customers/${id}/inquiries`),
        axios.get(`/api/v1/customers/${id}/accesses`),
        axios.get(`/api/v1/customers/${id}/activities`, { params: { limit: 30 } })
      ]);

      setCustomer(customerRes.data);
      setInquiries(Array.isArray(inquiriesRes.data) ? inquiriesRes.data : []);
      setAccesses(Array.isArray(accessesRes.data) ? accessesRes.data : []);

      const activitiesData = activitiesRes.data;
      setActivities(Array.isArray(activitiesData.activities) ? activitiesData.activities : []);
      setActivitiesTotalCount(activitiesData.total_count || 0);
      setHasMoreActivities(activitiesData.has_more || false);
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

  const loadInquiries = useCallback(async () => {
    try {
      const res = await axios.get(`/api/v1/customers/${id}/inquiries`);
      setInquiries(Array.isArray(res.data) ? res.data : []);
    } catch {
      // Silent failure
    }
  }, [id]);

  const loadActivities = useCallback(async () => {
    try {
      const currentCount = Math.max(activities.length, 30);
      const res = await axios.get(`/api/v1/customers/${id}/activities`, {
        params: { limit: currentCount }
      });
      setActivities(res.data.activities || []);
      setHasMoreActivities(res.data.has_more || false);
      setActivitiesTotalCount(res.data.total_count || 0);
    } catch (err) {
      console.error('Failed to load activities:', err);
    }
  }, [id, activities.length]);

  const loadMoreActivities = useCallback(async () => {
    try {
      setLoadingMoreActivities(true);
      const res = await axios.get(`/api/v1/customers/${id}/activities`, {
        params: { offset: activities.length, limit: 30 }
      });
      setActivities(prev => [...prev, ...(res.data.activities || [])]);
      setHasMoreActivities(res.data.has_more || false);
      setActivitiesTotalCount(res.data.total_count || 0);
    } catch (err) {
      console.error('Failed to load more activities:', err);
    } finally {
      setLoadingMoreActivities(false);
    }
  }, [id, activities.length]);

  const loadUsers = useCallback(async () => {
    if (usersLoaded) return;
    try {
      const res = await axios.get('/api/v1/admin/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
      setUsersLoaded(true);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }, [usersLoaded]);

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  // Lazy load users when a dialog that needs users is opened
  useEffect(() => {
    if (editingInquiry || editingPropertyInquiry || createInquiryDialogOpen || addPropertyDialogOpen) {
      loadUsers();
    }
  }, [editingInquiry, editingPropertyInquiry, createInquiryDialogOpen, addPropertyDialogOpen, loadUsers]);

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

  // Handler for inquiry card click (toggle selection)
  const handleInquiryClick = (inquiryId) => {
    setSelectedInquiryId(prev => prev === inquiryId ? null : inquiryId);
    setSelectedPropertyInquiryId(null);
    setSelectedActivity(null);
  };

  // Handler for property inquiry card click (toggle selection)
  const handlePropertyInquiryClick = (piId) => {
    setSelectedPropertyInquiryId(prev => prev === piId ? null : piId);
    setSelectedActivity(null);
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

  // --- Render functions for panels ---

  const renderActivityPanel = () => (
    <>
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
          <Chip label={`${activitiesTotalCount}件`} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.75rem' }} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ToggleButtonGroup
            value={activityViewMode}
            exclusive
            onChange={(e, v) => { if (v) setActivityViewMode(v); }}
            size="small"
            sx={{ height: 28 }}
          >
            <ToggleButton value="timeline" sx={{ px: 1, py: 0.25 }}>
              <Tooltip title="タイムライン表示">
                <ViewListIcon sx={{ fontSize: 18 }} />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="chat" sx={{ px: 1, py: 0.25 }}>
              <Tooltip title="チャット表示">
                <ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
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
      </Box>

      <Box sx={{ p: 2, overflow: 'auto', flex: 1 }}>
        {activityViewMode === 'chat' ? (
          <ActivityChatView
            activities={activities}
            selectedInquiryId={selectedInquiryId}
            selectedPropertyInquiryId={selectedPropertyInquiryId}
            onAddActivity={() => {
              setEditingActivity(null);
              setActivityDialogOpen(true);
            }}
            onViewActivity={(activity) => {
              setSelectedActivity(activity);
              if (isMobile) setMobilePanelIndex(2);
            }}
            hasMore={hasMoreActivities}
            onLoadMore={loadMoreActivities}
            loadingMore={loadingMoreActivities}
          />
        ) : (
          <ActivityTimeline
            activities={activities}
            selectedInquiryId={selectedInquiryId}
            selectedPropertyInquiryId={selectedPropertyInquiryId}
            onAddActivity={() => {
              setEditingActivity(null);
              setActivityDialogOpen(true);
            }}
            onViewActivity={(activity) => {
              setSelectedActivity(activity);
              if (isMobile) setMobilePanelIndex(2);
            }}
            hasMore={hasMoreActivities}
            onLoadMore={loadMoreActivities}
            loadingMore={loadingMoreActivities}
          />
        )}
      </Box>
    </>
  );


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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 2, mb: 0.5 }}>
          <IconButton onClick={() => navigate('/customers')} size="small" sx={{ alignSelf: 'center' }}>
            <ArrowBackIcon />
          </IconButton>
          {!isMobile && <PersonIcon color="primary" sx={{ fontSize: 24 }} />}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: isMobile ? '0.95rem' : '1.1rem' }} noWrap>
              {customer.name}
            </Typography>
            {customer.line_user_id && (
              <Tooltip title="LINE連携済み">
                <ChatIcon color="success" fontSize="small" />
              </Tooltip>
            )}
            <Chip
              size="small"
              label={statusInfo.label}
              color={statusInfo.color}
              variant="outlined"
              sx={{ height: 22 }}
            />
            <Tooltip title="顧客情報を編集">
              <IconButton size="small" onClick={() => setEditCustomerDialogOpen(true)} sx={{ ml: 0.5 }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="顧客を統合">
              <IconButton size="small" onClick={() => { setMergeSecondaryId(null); setMergeDialogOpen(true); }}>
                <MergeTypeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ flex: 1 }} />

          {isMobile ? (
            <>
              {customer.email && (
                <Tooltip title={customer.email}>
                  <IconButton size="small" component="a" href={`mailto:${customer.email}`}>
                    <EmailIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="簡易メール送信">
                <IconButton size="small" onClick={() => setEmailDialogOpen(true)}>
                  <SendIcon fontSize="small" color="primary" />
                </IconButton>
              </Tooltip>
              <Tooltip title="リッチメール作成">
                <IconButton
                  size="small"
                  onClick={() => {
                    const url = `/email/compose?customerId=${id}${selectedInquiryId ? `&inquiryId=${selectedInquiryId}` : ''}`;
                    window.open(url, '_blank');
                  }}
                >
                  <EditNoteIcon fontSize="small" color="primary" />
                </IconButton>
              </Tooltip>
              {customer.line_user_id ? (
                <Tooltip title="LINE送信">
                  <IconButton size="small" onClick={() => setLineDialogOpen(true)}>
                    <ChatIcon fontSize="small" sx={{ color: '#06C755' }} />
                  </IconButton>
                </Tooltip>
              ) : customer.email && (
                <Tooltip title="LINE案内メール">
                  <IconButton size="small" onClick={() => setLineGuidanceEmailOpen(true)}>
                    <ChatIcon fontSize="small" sx={{ color: '#06C755', opacity: 0.7 }} />
                  </IconButton>
                </Tooltip>
              )}
              {customer.phone && (
                <Tooltip title={customer.phone}>
                  <IconButton size="small" component="a" href={`tel:${customer.phone}`}>
                    <PhoneIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </>
          ) : (
            <>
              <Button
                size="small"
                variant="outlined"
                startIcon={<SendIcon />}
                onClick={() => setEmailDialogOpen(true)}
              >
                メール
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<EditNoteIcon />}
                onClick={() => {
                  const url = `/email/compose?customerId=${id}${selectedInquiryId ? `&inquiryId=${selectedInquiryId}` : ''}`;
                  window.open(url, '_blank');
                }}
              >
                リッチメール
              </Button>
              {customer.line_user_id ? (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<ChatIcon />}
                  onClick={() => setLineDialogOpen(true)}
                  sx={{ bgcolor: '#06C755', '&:hover': { bgcolor: '#05b04c' } }}
                >
                  LINE
                </Button>
              ) : customer.email && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ChatIcon />}
                  onClick={() => setLineGuidanceEmailOpen(true)}
                  sx={{ borderColor: '#06C755', color: '#06C755', '&:hover': { borderColor: '#05b04c', bgcolor: 'rgba(6,199,85,0.04)' } }}
                >
                  LINE案内
                </Button>
              )}
            </>
          )}
        </Box>

        {/* Row 2: Dates + stats */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: isMobile ? 0 : 5.5 }}>
          <Typography variant="caption" color="text.secondary">
            登録日: {customer.created_at}
            {!isMobile && customer.last_contacted_at && (
              <> | 最終連絡: {customer.last_contacted_at}</>
            )}
            {!isMobile && customer.last_inquiry_at && (
              <> | 最終問合せ: {customer.last_inquiry_at}</>
            )}
          </Typography>
          <Box sx={{ flex: 1 }} />
          {!isMobile && (
            <>
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
                    sx={{ height: 22, maxWidth: 200, fontSize: '0.7rem' }}
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
                    sx={{ height: 22, fontSize: '0.7rem' }}
                  />
                </Tooltip>
              )}
            </>
          )}
        </Box>
      </Paper>

      {/* Duplicate Detection Banner */}
      <DuplicateDetectionPanel
        customerId={id}
        onMergeClick={(secondaryId) => {
          setMergeSecondaryId(secondaryId);
          setMergeDialogOpen(true);
        }}
      />

      {/* Main Content */}
      {isMobile ? (
        /* Mobile: Tab-based single panel navigation */
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Tabs
            value={mobilePanelIndex}
            onChange={(e, v) => setMobilePanelIndex(v)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white', flexShrink: 0 }}
          >
            <Tab icon={<FlagIcon sx={{ fontSize: 18 }} />} label="案件" sx={{ minHeight: 48, py: 0.5, fontSize: '0.75rem' }} />
            <Tab icon={<NoteIcon sx={{ fontSize: 18 }} />} label="履歴" sx={{ minHeight: 48, py: 0.5, fontSize: '0.75rem' }} />
            <Tab icon={<TouchAppIcon sx={{ fontSize: 18 }} />} label="詳細" sx={{ minHeight: 48, py: 0.5, fontSize: '0.75rem' }} />
          </Tabs>
          <Box sx={{ flex: 1, overflow: 'auto', display: mobilePanelIndex === 0 ? 'flex' : 'none', flexDirection: 'column' }}>
            <InquiryTreePanel
              inquiries={inquiries}
              accesses={accesses}
              selectedInquiryId={selectedInquiryId}
              selectedPropertyInquiryId={selectedPropertyInquiryId}
              onInquirySelect={handleInquiryClick}
              onPropertyInquirySelect={handlePropertyInquiryClick}
              onCreateInquiry={() => setCreateInquiryDialogOpen(true)}
              onEditInquiry={(inquiry) => setEditingInquiry(inquiry)}
              onAddActivity={(inquiryId) => {
                setSelectedInquiryId(inquiryId);
                setEditingActivity(null);
                setActivityDialogOpen(true);
              }}
              onEditPropertyInquiry={(pi) => setEditingPropertyInquiry(pi)}
              onPIStatusClick={handlePIStatusClick}
              onAddProperty={(inquiryId) => {
                setSelectedInquiryId(inquiryId);
                setAddPropertyDialogOpen(true);
              }}
              handleCopyUrl={handleCopyUrl}
            />
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto', display: mobilePanelIndex === 1 ? 'flex' : 'none', flexDirection: 'column' }}>
            {renderActivityPanel()}
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto', display: mobilePanelIndex === 2 ? 'flex' : 'none', flexDirection: 'column' }}>
            <ActivityDetailPanel
              activity={selectedActivity}
              onClose={() => setSelectedActivity(null)}
            />
          </Box>
        </Box>
      ) : (
        /* Desktop: Resizable 3-column layout */
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
          {/* Left Column - Inquiry Tree */}
          <Paper
            elevation={2}
            sx={{
              width: leftPaneWidth,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: 2
            }}
          >
            <InquiryTreePanel
              inquiries={inquiries}
              accesses={accesses}
              selectedInquiryId={selectedInquiryId}
              selectedPropertyInquiryId={selectedPropertyInquiryId}
              onInquirySelect={handleInquiryClick}
              onPropertyInquirySelect={handlePropertyInquiryClick}
              onCreateInquiry={() => setCreateInquiryDialogOpen(true)}
              onEditInquiry={(inquiry) => setEditingInquiry(inquiry)}
              onAddActivity={(inquiryId) => {
                setSelectedInquiryId(inquiryId);
                setEditingActivity(null);
                setActivityDialogOpen(true);
              }}
              onEditPropertyInquiry={(pi) => setEditingPropertyInquiry(pi)}
              onPIStatusClick={handlePIStatusClick}
              onAddProperty={(inquiryId) => {
                setSelectedInquiryId(inquiryId);
                setAddPropertyDialogOpen(true);
              }}
              handleCopyUrl={handleCopyUrl}
            />
          </Paper>

          {/* Left Splitter */}
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

          {/* Center Column - Activity Timeline */}
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
            {renderActivityPanel()}
          </Paper>

          {/* Right Splitter */}
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

          {/* Right Column - Activity Detail Panel */}
          <Paper
            elevation={2}
            sx={{
              width: rightPaneWidth,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: 2
            }}
          >
            <ActivityDetailPanel
              activity={selectedActivity}
              onClose={() => setSelectedActivity(null)}
            />
          </Paper>
        </Box>
      )}

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
        users={users}
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
        defaultAssignedUserId={inquiries.find(i => i.id === selectedInquiryId)?.assigned_user?.id}
        users={users}
        onAdded={() => {
          loadCustomer();
        }}
      />

      {/* Email Compose Dialog */}
      <EmailComposeDialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        customer={customer}
        inquiries={inquiries}
        selectedInquiryId={selectedInquiryId}
        onSent={() => {
          loadActivities();
          loadCustomer();
        }}
      />

      {/* LINE Guidance Email Compose Dialog */}
      <EmailComposeDialog
        open={lineGuidanceEmailOpen}
        onClose={() => setLineGuidanceEmailOpen(false)}
        customer={customer}
        inquiries={inquiries}
        selectedInquiryId={selectedInquiryId}
        preSelectTemplateName="LINE友だち追加のご案内"
        onSent={() => {
          loadActivities();
          loadCustomer();
        }}
      />

      {/* Edit Customer Dialog */}
      <EditCustomerDialog
        open={editCustomerDialogOpen}
        onClose={() => setEditCustomerDialogOpen(false)}
        customer={customer}
        onUpdated={loadCustomer}
      />

      {/* LINE Compose Dialog */}
      <LineComposeDialog
        open={lineDialogOpen}
        onClose={() => setLineDialogOpen(false)}
        customer={customer}
        inquiries={inquiries}
        selectedInquiryId={selectedInquiryId}
        onSent={() => {
          loadActivities();
          loadCustomer();
        }}
        onInquiriesReload={loadInquiries}
      />

      {/* Merge Customer Dialog */}
      <MergeCustomerDialog
        open={mergeDialogOpen}
        onClose={() => { setMergeDialogOpen(false); setMergeSecondaryId(null); }}
        customer={customer}
        suggestedSecondaryId={mergeSecondaryId}
        onMerged={() => {
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
