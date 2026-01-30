import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Edit as EditIcon
} from '@mui/icons-material';
import axios from 'axios';

const INQUIRY_STATUSES = [
  { value: 'active', label: 'アクティブ', color: 'success' },
  { value: 'on_hold', label: '保留中', color: 'warning' },
  { value: 'closed', label: 'クローズ', color: 'default' }
];

export default function EditInquiryDialog({ open, onClose, inquiry, users = [], onUpdated }) {
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('active');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (inquiry && open) {
      setNotes(inquiry.notes || '');
      setStatus(inquiry.status || 'active');
      setAssignedUserId(inquiry.assigned_user?.id || '');
      setError(null);
    }
  }, [inquiry, open]);

  const handleSubmit = async () => {
    if (!inquiry) return;

    try {
      setLoading(true);
      setError(null);

      const notesChanged = notes !== (inquiry.notes || '');
      const statusChanged = status !== (inquiry.status || 'active');
      const currentAssignedUserId = inquiry.assigned_user?.id || '';
      const assignedUserChanged = assignedUserId !== currentAssignedUserId;

      if (notesChanged || assignedUserChanged) {
        await axios.patch(`/api/v1/inquiries/${inquiry.id}`, {
          inquiry: {
            notes,
            assigned_user_id: assignedUserId || null
          }
        });
      }

      if (statusChanged) {
        await axios.post(`/api/v1/inquiries/${inquiry.id}/change_status`, {
          status
        });
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

          <FormControl fullWidth>
            <InputLabel>ステータス</InputLabel>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              label="ステータス"
            >
              {INQUIRY_STATUSES.map(s => (
                <MenuItem key={s.value} value={s.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      size="small"
                      label={s.label}
                      color={s.color}
                      sx={{ minWidth: 80 }}
                    />
                    {s.value === (inquiry?.status || 'active') && (
                      <span style={{ color: '#666', fontSize: '0.85em' }}>(現在)</span>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>主担当者</InputLabel>
            <Select
              value={assignedUserId}
              onChange={(e) => setAssignedUserId(e.target.value)}
              label="主担当者"
            >
              <MenuItem value="">
                <em>未設定</em>
              </MenuItem>
              {users.map(u => (
                <MenuItem key={u.id} value={u.id}>
                  {u.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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
