import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Popover,
  TextField,
  Collapse,
  Tooltip
} from '@mui/material';
import {
  MergeType as MergeTypeIcon,
  People as PeopleIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Chat as ChatIcon,
  NotInterested as NotInterestedIcon,
  Undo as UndoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import axios from 'axios';

export default function DuplicateDetectionPanel({ customerId, onMergeClick }) {
  const [duplicates, setDuplicates] = useState([]);
  const [dismissed, setDismissed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDismissed, setShowDismissed] = useState(false);
  const [dismissAnchorEl, setDismissAnchorEl] = useState(null);
  const [dismissTarget, setDismissTarget] = useState(null);
  const [dismissReason, setDismissReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!customerId) return;
    try {
      setLoading(true);
      const res = await axios.get('/api/v1/customers/find_duplicates', {
        params: { customer_id: customerId }
      });
      setDuplicates(res.data.duplicates || []);
      setDismissed(res.data.dismissed || []);
    } catch (err) {
      console.error('Failed to load duplicates:', err);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDismissClick = (event, targetCustomerId) => {
    setDismissAnchorEl(event.currentTarget);
    setDismissTarget(targetCustomerId);
    setDismissReason('');
  };

  const handleDismissClose = () => {
    setDismissAnchorEl(null);
    setDismissTarget(null);
    setDismissReason('');
  };

  const handleDismissConfirm = async () => {
    if (!dismissTarget) return;
    setActionLoading(true);
    try {
      await axios.post('/api/v1/customers/dismiss_merge', {
        customer1_id: customerId,
        customer2_id: dismissTarget,
        reason: dismissReason || undefined
      });
      handleDismissClose();
      await loadData();
    } catch (err) {
      console.error('Failed to dismiss merge:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUndismiss = async (d) => {
    setActionLoading(true);
    try {
      await axios.delete('/api/v1/customers/undismiss_merge', {
        params: {
          customer1_id: d.customer1_id,
          customer2_id: d.customer2_id
        }
      });
      await loadData();
    } catch (err) {
      console.error('Failed to undismiss merge:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return null;
  if (duplicates.length === 0 && dismissed.length === 0) return null;

  return (
    <Box sx={{ mx: 2, mt: 1, flexShrink: 0 }}>
      {duplicates.length > 0 && (
        <Alert
          severity="warning"
          icon={<PeopleIcon />}
          action={
            duplicates.length === 1 ? (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="統合不要としてマーク">
                  <IconButton
                    size="small"
                    color="default"
                    onClick={(e) => handleDismissClick(e, duplicates[0].customer.id)}
                  >
                    <NotInterestedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Button
                  color="warning"
                  size="small"
                  startIcon={<MergeTypeIcon />}
                  onClick={() => onMergeClick?.(duplicates[0].customer.id)}
                >
                  統合
                </Button>
              </Box>
            ) : null
          }
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            重複の可能性がある顧客が {duplicates.length}件 あります
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {duplicates.map((d) => (
              <Box key={d.customer.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="caption" fontWeight={600}>{d.customer.name}</Typography>
                {d.customer.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    <EmailIcon sx={{ fontSize: 12 }} />
                    <Typography variant="caption">{d.customer.email}</Typography>
                  </Box>
                )}
                {d.customer.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    <PhoneIcon sx={{ fontSize: 12 }} />
                    <Typography variant="caption">{d.customer.phone}</Typography>
                  </Box>
                )}
                {d.customer.has_line && <ChatIcon sx={{ fontSize: 14, color: 'success.main' }} />}
                <Chip
                  size="small"
                  label={`信頼度 ${d.confidence}%`}
                  color={d.confidence >= 90 ? 'error' : d.confidence >= 70 ? 'warning' : 'default'}
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
                {d.signals.map((s, i) => (
                  <Chip key={i} size="small" label={s} variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                ))}
                {duplicates.length > 1 && (
                  <>
                    <Tooltip title="統合不要としてマーク">
                      <IconButton
                        size="small"
                        onClick={(e) => handleDismissClick(e, d.customer.id)}
                        sx={{ p: 0.25 }}
                      >
                        <NotInterestedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Button
                      size="small"
                      color="warning"
                      sx={{ minWidth: 'auto', p: 0, fontSize: '0.7rem' }}
                      onClick={() => onMergeClick?.(d.customer.id)}
                    >
                      統合
                    </Button>
                  </>
                )}
              </Box>
            ))}
          </Box>
        </Alert>
      )}

      {dismissed.length > 0 && (
        <Box sx={{ mt: duplicates.length > 0 ? 1 : 0 }}>
          <Button
            size="small"
            color="inherit"
            onClick={() => setShowDismissed(!showDismissed)}
            startIcon={showDismissed ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ fontSize: '0.75rem', color: 'text.secondary', textTransform: 'none' }}
          >
            除外済み ({dismissed.length}件)
          </Button>
          <Collapse in={showDismissed}>
            <Box sx={{ pl: 1, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {dismissed.map((d) => (
                <Box
                  key={`${d.customer1_id}-${d.customer2_id}`}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
                >
                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                    {d.other_customer.name}
                  </Typography>
                  {d.other_customer.email && (
                    <Typography variant="caption" color="text.secondary">{d.other_customer.email}</Typography>
                  )}
                  {d.reason && (
                    <Chip
                      size="small"
                      label={d.reason}
                      variant="outlined"
                      sx={{ height: 18, fontSize: '0.6rem', color: 'text.secondary' }}
                    />
                  )}
                  <Typography variant="caption" color="text.disabled">
                    {d.dismissed_by.name} {d.dismissed_at}
                  </Typography>
                  <Tooltip title="除外を取り消し">
                    <IconButton
                      size="small"
                      onClick={() => handleUndismiss(d)}
                      disabled={actionLoading}
                      sx={{ p: 0.25 }}
                    >
                      <UndoIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          </Collapse>
        </Box>
      )}

      <Popover
        open={Boolean(dismissAnchorEl)}
        anchorEl={dismissAnchorEl}
        onClose={handleDismissClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, width: 280 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>統合不要としてマーク</Typography>
          <TextField
            fullWidth
            size="small"
            label="理由（任意）"
            value={dismissReason}
            onChange={(e) => setDismissReason(e.target.value)}
            placeholder="例: 同姓別人"
            sx={{ mb: 1.5 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button size="small" onClick={handleDismissClose}>
              キャンセル
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleDismissConfirm}
              disabled={actionLoading}
            >
              確定
            </Button>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
}
