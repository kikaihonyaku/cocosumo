import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
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

const INQUIRY_STATUSES = [
  { value: 'active', label: 'アクティブ', color: 'success' },
  { value: 'on_hold', label: '保留中', color: 'warning' },
  { value: 'closed', label: 'クローズ', color: 'default' }
];

export default function StatusChangeDialog({ open, onClose, inquiryId, currentStatus, onChanged }) {
  const [newStatus, setNewStatus] = useState(currentStatus || 'active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (newStatus === currentStatus) {
      onClose();
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await axios.post(`/api/v1/inquiries/${inquiryId}/change_status`, {
        status: newStatus
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
    setNewStatus(currentStatus || 'active');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FlagIcon color="primary" />
        案件ステータスを変更
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
                {INQUIRY_STATUSES.map(status => (
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
