import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Typography,
  Chip,
  Button,
  CircularProgress
} from '@mui/material';
import {
  MergeType as MergeTypeIcon,
  People as PeopleIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import axios from 'axios';

export default function DuplicateDetectionPanel({ customerId, onMergeClick }) {
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/v1/customers/find_duplicates', {
          params: { customer_id: customerId }
        });
        if (!cancelled) {
          setDuplicates(res.data.duplicates || []);
        }
      } catch (err) {
        console.error('Failed to load duplicates:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [customerId]);

  if (loading) return null;
  if (duplicates.length === 0) return null;

  return (
    <Alert
      severity="warning"
      icon={<PeopleIcon />}
      sx={{ mx: 2, mt: 1, flexShrink: 0 }}
      action={
        duplicates.length === 1 ? (
          <Button
            color="warning"
            size="small"
            startIcon={<MergeTypeIcon />}
            onClick={() => onMergeClick?.(duplicates[0].customer.id)}
          >
            統合
          </Button>
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
              <Button
                size="small"
                color="warning"
                sx={{ minWidth: 'auto', p: 0, fontSize: '0.7rem' }}
                onClick={() => onMergeClick?.(d.customer.id)}
              >
                統合
              </Button>
            )}
          </Box>
        ))}
      </Box>
    </Alert>
  );
}
