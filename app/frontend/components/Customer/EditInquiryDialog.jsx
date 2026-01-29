import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon
} from '@mui/icons-material';
import axios from 'axios';

export default function EditInquiryDialog({ open, onClose, inquiry, onUpdated }) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (inquiry && open) {
      setNotes(inquiry.notes || '');
      setError(null);
    }
  }, [inquiry, open]);

  const handleSubmit = async () => {
    if (!inquiry) return;

    try {
      setLoading(true);
      setError(null);

      const notesChanged = notes !== (inquiry.notes || '');

      if (notesChanged) {
        await axios.patch(`/api/v1/inquiries/${inquiry.id}`, {
          inquiry: { notes }
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
