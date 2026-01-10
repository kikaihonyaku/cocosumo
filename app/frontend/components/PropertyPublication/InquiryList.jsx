import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Collapse,
  Tooltip,
  Button,
  Stack
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Public as PublicIcon,
  Search as SearchIcon,
  Share as ShareIcon,
  Link as LinkIcon,
  Campaign as CampaignIcon,
  PersonAdd as PersonAddIcon,
  Person as PersonIcon,
  Key as KeyIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import axios from 'axios';
import CustomerAccessDialog from '../CustomerAccess/CustomerAccessDialog';

// Source label mapping
const getSourceInfo = (source) => {
  const sourceMap = {
    direct: { label: 'ダイレクト', icon: <LinkIcon fontSize="small" />, color: 'default' },
    organic_search: { label: '検索', icon: <SearchIcon fontSize="small" />, color: 'primary' },
    social: { label: 'SNS', icon: <ShareIcon fontSize="small" />, color: 'secondary' },
    referral: { label: '参照', icon: <PublicIcon fontSize="small" />, color: 'info' },
    campaign: { label: 'キャンペーン', icon: <CampaignIcon fontSize="small" />, color: 'success' }
  };
  return sourceMap[source] || { label: source || '不明', icon: <PublicIcon fontSize="small" />, color: 'default' };
};

// Channel label mapping
const getChannelInfo = (channel) => {
  const channelMap = {
    channel_web_form: { label: 'Webフォーム', color: 'primary' },
    channel_line: { label: 'LINE', color: 'success' }
  };
  return channelMap[channel] || { label: channel || 'Web', color: 'default' };
};

export default function InquiryList({ publicationId, roomId }) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  useEffect(() => {
    loadInquiries();
  }, [publicationId]);

  const loadInquiries = async () => {
    if (!publicationId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/v1/property_publications/${publicationId}/inquiries`);
      setInquiries(response.data);
    } catch (err) {
      console.error('Error loading inquiries:', err);
      if (err.response?.status === 401) {
        setError('問い合わせ一覧を表示するにはログインが必要です');
      } else {
        setError('問い合わせ一覧の読み込みに失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleOpenAccessDialog = (inquiry, e) => {
    e.stopPropagation();
    setSelectedInquiry(inquiry);
    setAccessDialogOpen(true);
  };

  const handleCloseAccessDialog = () => {
    setAccessDialogOpen(false);
    setSelectedInquiry(null);
  };

  const handleAccessCreated = () => {
    loadInquiries(); // リロードして新しいアクセスを反映
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (inquiries.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">
          まだ問い合わせはありません
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        問い合わせ一覧 ({inquiries.length}件)
      </Typography>

      <List sx={{ p: 0 }}>
        {inquiries.map((inquiry, index) => {
          const sourceInfo = getSourceInfo(inquiry.source);
          const channelInfo = getChannelInfo(inquiry.channel);
          const isExpanded = expandedId === inquiry.id;
          const hasExistingAccess = inquiry.customer_accesses && inquiry.customer_accesses.length > 0;
          const customer = inquiry.customer;

          return (
            <Paper key={inquiry.id} sx={{ mb: 1.5 }} variant="outlined">
              <ListItem
                sx={{
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => handleToggleExpand(inquiry.id)}
                secondaryAction={
                  <IconButton edge="end">
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                }
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {inquiry.name}
                      </Typography>
                      <Chip
                        size="small"
                        icon={sourceInfo.icon}
                        label={sourceInfo.label}
                        color={sourceInfo.color}
                        variant="outlined"
                        sx={{ height: 24 }}
                      />
                      {inquiry.utm_campaign && (
                        <Tooltip title={`キャンペーン: ${inquiry.utm_campaign}`}>
                          <Chip
                            size="small"
                            label={inquiry.utm_campaign}
                            color="success"
                            variant="filled"
                            sx={{ height: 24, maxWidth: 100, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
                          />
                        </Tooltip>
                      )}
                      {/* 顧客情報バッジ */}
                      {customer && customer.has_other_inquiries && (
                        <Tooltip title={`この顧客は他に${customer.inquiry_count - 1}件の問い合わせがあります`}>
                          <Chip
                            size="small"
                            icon={<PersonIcon fontSize="small" />}
                            label={`${customer.inquiry_count}件`}
                            color="warning"
                            variant="filled"
                            sx={{ height: 24 }}
                          />
                        </Tooltip>
                      )}
                      {/* 顧客アクセス発行済みバッジ */}
                      {hasExistingAccess && (
                        <Tooltip title="顧客アクセスを発行済み">
                          <Chip
                            size="small"
                            icon={<KeyIcon fontSize="small" />}
                            label="発行済"
                            color="info"
                            variant="outlined"
                            sx={{ height: 24 }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {inquiry.formatted_created_at}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>

              <Collapse in={isExpanded}>
                <Box sx={{ px: 2, pb: 2 }}>
                  <Divider sx={{ mb: 2 }} />

                  {/* Contact Info */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        <a href={`mailto:${inquiry.email}`} style={{ color: 'inherit' }}>
                          {inquiry.email}
                        </a>
                      </Typography>
                    </Box>
                    {inquiry.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <a href={`tel:${inquiry.phone}`} style={{ color: 'inherit' }}>
                            {inquiry.phone}
                          </a>
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Message */}
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {inquiry.message}
                    </Typography>
                  </Paper>

                  {/* Customer Accesses Section */}
                  <Box sx={{ mt: 2 }}>
                    {hasExistingAccess ? (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          発行済み顧客アクセス
                        </Typography>
                        <Stack spacing={1}>
                          {inquiry.customer_accesses.map((access) => (
                            <Paper key={access.id} variant="outlined" sx={{ p: 1.5, bgcolor: 'background.default' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <KeyIcon fontSize="small" color="primary" />
                                  <Typography variant="body2">
                                    {access.created_at}に発行
                                  </Typography>
                                  <Chip
                                    size="small"
                                    label={access.status === 'active' ? '有効' : access.status === 'expired' ? '期限切れ' : '取消済'}
                                    color={access.status === 'active' ? 'success' : 'default'}
                                    sx={{ height: 20 }}
                                  />
                                  {access.view_count > 0 && (
                                    <Typography variant="caption" color="text.secondary">
                                      閲覧: {access.view_count}回
                                    </Typography>
                                  )}
                                </Box>
                                {access.expires_at && (
                                  <Typography variant="caption" color="text.secondary">
                                    期限: {access.expires_at}
                                  </Typography>
                                )}
                              </Box>
                            </Paper>
                          ))}
                        </Stack>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<PersonAddIcon />}
                          onClick={(e) => handleOpenAccessDialog(inquiry, e)}
                          sx={{ mt: 1.5 }}
                        >
                          追加で発行
                        </Button>
                      </Box>
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<PersonAddIcon />}
                        onClick={(e) => handleOpenAccessDialog(inquiry, e)}
                        color="primary"
                      >
                        顧客アクセスを発行
                      </Button>
                    )}
                  </Box>

                  {/* Source Details */}
                  {(inquiry.utm_source || inquiry.utm_medium || inquiry.referrer) && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        流入詳細
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {inquiry.utm_source && (
                          <Chip
                            size="small"
                            label={`ソース: ${inquiry.utm_source}`}
                            variant="outlined"
                            sx={{ height: 22, fontSize: '0.7rem' }}
                          />
                        )}
                        {inquiry.utm_medium && (
                          <Chip
                            size="small"
                            label={`メディア: ${inquiry.utm_medium}`}
                            variant="outlined"
                            sx={{ height: 22, fontSize: '0.7rem' }}
                          />
                        )}
                        {inquiry.referrer && (
                          <Tooltip title={inquiry.referrer}>
                            <Chip
                              size="small"
                              label={`参照元: ${new URL(inquiry.referrer).hostname}`}
                              variant="outlined"
                              sx={{ height: 22, fontSize: '0.7rem', maxWidth: 200 }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Collapse>
            </Paper>
          );
        })}
      </List>

      {/* Customer Access Dialog */}
      <CustomerAccessDialog
        open={accessDialogOpen}
        onClose={handleCloseAccessDialog}
        publicationId={publicationId}
        inquiry={selectedInquiry}
        onCreated={handleAccessCreated}
      />
    </Box>
  );
}
