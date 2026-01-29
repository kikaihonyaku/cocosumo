import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import axios from 'axios';

const DEAL_STATUSES = [
  { value: 'new_inquiry', label: '新規反響', color: 'info' },
  { value: 'contacting', label: '対応中', color: 'primary' },
  { value: 'viewing_scheduled', label: '内見予約', color: 'secondary' },
  { value: 'viewing_done', label: '内見済', color: 'warning' },
  { value: 'application', label: '申込', color: 'success' },
  { value: 'contracted', label: '成約', color: 'success' },
  { value: 'lost', label: '失注', color: 'error' }
];

const PRIORITIES = [
  { value: 'low', label: '低' },
  { value: 'normal', label: '通常' },
  { value: 'high', label: '高' },
  { value: 'urgent', label: '緊急' }
];

export default function EditPropertyInquiryDialog({ open, onClose, propertyInquiry, users = [], onUpdated }) {
  const [dealStatus, setDealStatus] = useState('new_inquiry');
  const [lostReason, setLostReason] = useState('');
  const [priority, setPriority] = useState('normal');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (propertyInquiry && open) {
      setDealStatus(propertyInquiry.deal_status || 'new_inquiry');
      setLostReason('');
      setPriority(propertyInquiry.priority || 'normal');
      setAssignedUserId(propertyInquiry.assigned_user?.id || '');
      setError(null);
    }
  }, [propertyInquiry, open]);

  const handleSubmit = async () => {
    if (!propertyInquiry) return;

    if (dealStatus === 'lost' && !lostReason.trim()) {
      setError('失注理由を入力してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const promises = [];

      // deal_status 変更は専用エンドポイント
      const statusChanged = dealStatus !== propertyInquiry.deal_status;
      if (statusChanged) {
        promises.push(
          axios.post(`/api/v1/property_inquiries/${propertyInquiry.id}/change_deal_status`, {
            deal_status: dealStatus,
            reason: lostReason.trim() || null
          })
        );
      }

      // priority / assigned_user は PATCH
      const otherChanged =
        priority !== (propertyInquiry.priority || 'normal') ||
        (assignedUserId || null) !== (propertyInquiry.assigned_user?.id || null);

      if (otherChanged) {
        const payload = {
          property_inquiry: {
            priority,
            assigned_user_id: assignedUserId || null
          }
        };
        promises.push(
          axios.patch(`/api/v1/property_inquiries/${propertyInquiry.id}`, payload)
        );
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }

      handleClose();
      onUpdated?.();
    } catch (err) {
      console.error('Failed to update property inquiry:', err);
      setError(err.response?.data?.error || err.response?.data?.errors?.join('\n') || '更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setLostReason('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <EditIcon color="primary" />
        物件問い合わせを編集
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Deal Status */}
          <FormControl fullWidth>
            <InputLabel>商談ステータス</InputLabel>
            <Select
              value={dealStatus}
              onChange={(e) => setDealStatus(e.target.value)}
              label="商談ステータス"
            >
              {DEAL_STATUSES.map(status => (
                <MenuItem key={status.value} value={status.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      size="small"
                      label={status.label}
                      color={status.color}
                      sx={{ minWidth: 80 }}
                    />
                    {status.value === propertyInquiry?.deal_status && (
                      <span style={{ color: '#666', fontSize: '0.85em' }}>(現在)</span>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Lost Reason */}
          {dealStatus === 'lost' && dealStatus !== propertyInquiry?.deal_status && (
            <TextField
              label="失注理由"
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              fullWidth
              required
              multiline
              rows={2}
              placeholder="例: 他社で成約、条件が合わなかった、など"
            />
          )}

          {/* Priority */}
          <FormControl fullWidth>
            <InputLabel>優先度</InputLabel>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              label="優先度"
            >
              {PRIORITIES.map(p => (
                <MenuItem key={p.value} value={p.value}>
                  {p.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Assigned User */}
          {users.length > 0 && (
            <FormControl fullWidth>
              <InputLabel>担当者</InputLabel>
              <Select
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                label="担当者"
              >
                <MenuItem value="">
                  <em>未設定</em>
                </MenuItem>
                {users.map(user => (
                  <MenuItem key={user.id} value={user.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      {user.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          キャンセル
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? '保存中...' : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
