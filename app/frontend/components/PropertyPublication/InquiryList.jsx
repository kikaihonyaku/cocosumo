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
  Tooltip
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
  Campaign as CampaignIcon
} from '@mui/icons-material';
import axios from 'axios';

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

export default function InquiryList({ publicationId, roomId }) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

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
          const isExpanded = expandedId === inquiry.id;

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
    </Box>
  );
}
