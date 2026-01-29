import React, { useState } from 'react';
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
  Flag as FlagIcon
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

export default function StatusChangeDialog({ open, onClose, inquiryId, currentStatus, onChanged }) {
  const [newStatus, setNewStatus] = useState(currentStatus || 'new_inquiry');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (newStatus === currentStatus) {
      onClose();
      return;
    }

    if (newStatus === 'lost' && !reason.trim()) {
      setError('失注理由を入力してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await axios.post(`/api/v1/inquiries/${inquiryId}/change_status`, {
        deal_status: newStatus,
        reason: reason.trim() || null
      });

      handleClose();
      onChanged?.();
    } catch (err) {
      console.error('Failed to change status:', err);
      setError(err.response?.data?.error || 'ステータスの変更に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewStatus(currentStatus || 'new_inquiry');
    setReason('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FlagIcon color="primary" />
        ステータスを変更
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box>
            <FormControl fullWidth>
              <InputLabel>新しいステータス</InputLabel>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                label="新しいステータス"
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
                      {status.value === currentStatus && (
                        <span style={{ color: '#666', fontSize: '0.85em' }}>(現在)</span>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {newStatus === 'lost' && (
            <TextField
              label="失注理由"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              fullWidth
              required
              multiline
              rows={2}
              placeholder="例: 他社で成約、条件が合わなかった、など"
            />
          )}

          {newStatus !== 'lost' && newStatus !== currentStatus && (
            <TextField
              label="メモ（任意）"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="ステータス変更の理由やメモ..."
            />
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
          disabled={loading || newStatus === currentStatus}
        >
          {loading ? '変更中...' : '変更する'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
