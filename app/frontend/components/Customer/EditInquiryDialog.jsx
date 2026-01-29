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

export default function EditInquiryDialog({ open, onClose, inquiry, users = [], onUpdated }) {
  const [dealStatus, setDealStatus] = useState('new_inquiry');
  const [lostReason, setLostReason] = useState('');
  const [priority, setPriority] = useState('normal');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (inquiry && open) {
      setDealStatus(inquiry.deal_status || 'new_inquiry');
      setLostReason('');
      setPriority(inquiry.priority || 'normal');
      setAssignedUserId(inquiry.assigned_user?.id || inquiry.assigned_user_id || '');
      setNotes(inquiry.notes || '');
      setError(null);
    }
  }, [inquiry, open]);

  const handleSubmit = async () => {
    if (!inquiry) return;

    if (dealStatus === 'lost' && !lostReason.trim()) {
      setError('失注理由を入力してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const promises = [];

      // If deal_status changed, use the change_status endpoint
      const statusChanged = dealStatus !== inquiry.deal_status;
      if (statusChanged) {
        promises.push(
          axios.post(`/api/v1/inquiries/${inquiry.id}/change_status`, {
            deal_status: dealStatus,
            reason: lostReason.trim() || null
          })
        );
      }

      // If other fields changed, use PATCH
      const otherChanged =
        priority !== (inquiry.priority || 'normal') ||
        (assignedUserId || null) !== (inquiry.assigned_user?.id || inquiry.assigned_user_id || null) ||
        notes !== (inquiry.notes || '');

      if (otherChanged) {
        const payload = { inquiry: { priority, notes } };
        if (assignedUserId) {
          payload.inquiry.assigned_user_id = assignedUserId;
        } else {
          payload.inquiry.assigned_user_id = null;
        }
        promises.push(
          axios.patch(`/api/v1/inquiries/${inquiry.id}`, payload)
        );
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }

      handleClose();
      onUpdated?.();
    } catch (err) {
      console.error('Failed to update inquiry:', err);
      setError(err.response?.data?.error || err.response?.data?.errors?.join('\n') || '案件の更新に失敗しました');
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
        案件を編集
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
            <InputLabel>ステータス</InputLabel>
            <Select
              value={dealStatus}
              onChange={(e) => setDealStatus(e.target.value)}
              label="ステータス"
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
                    {status.value === inquiry?.deal_status && (
                      <span style={{ color: '#666', fontSize: '0.85em' }}>(現在)</span>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Lost Reason (shown only when changing to lost) */}
          {dealStatus === 'lost' && dealStatus !== inquiry?.deal_status && (
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

          {/* Notes */}
          <TextField
            label="メモ"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            rows={4}
            placeholder="案件に関するメモ..."
          />
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
