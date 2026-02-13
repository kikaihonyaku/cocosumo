import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer
} from '@mui/material';
import {
  History as HistoryIcon,
  Undo as UndoIcon,
  MergeType as MergeTypeIcon
} from '@mui/icons-material';
import axios from 'axios';

export default function MergeHistoryDialog({ open, onClose, onUndone }) {
  const [merges, setMerges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [undoing, setUndoing] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    loadMerges();
  }, [open]);

  const loadMerges = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/v1/customer_merges');
      setMerges(res.data.merges || []);
    } catch (err) {
      console.error('Failed to load merge history:', err);
      if (err.response?.status === 403) {
        setError('統合履歴の閲覧には管理者権限が必要です');
      } else {
        setError('統合履歴の読み込みに失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async (mergeId) => {
    if (!window.confirm('この統合を取り消しますか？統合された顧客が復元されます。')) return;

    try {
      setUndoing(mergeId);
      setError(null);
      await axios.post(`/api/v1/customer_merges/${mergeId}/undo`);
      loadMerges();
      onUndone?.();
    } catch (err) {
      console.error('Failed to undo merge:', err);
      setError(err.response?.data?.error || '統合の取り消しに失敗しました');
    } finally {
      setUndoing(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <HistoryIcon color="primary" />
        統合履歴
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : merges.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <MergeTypeIcon sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
            <Typography color="text.secondary">統合履歴はありません</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>日時</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>統合先</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>統合元</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>実行者</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>理由</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>状態</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {merges.map((m) => (
                  <TableRow key={m.id} hover>
                    <TableCell>
                      <Typography variant="caption">{m.created_at}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{m.primary_customer?.name || '削除済み'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{m.secondary_name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{m.performed_by?.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {m.merge_reason || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {m.status === 'completed' ? (
                        <Chip size="small" label="完了" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />
                      ) : (
                        <Chip size="small" label="取消済" color="default" sx={{ height: 20, fontSize: '0.7rem' }} />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {m.status === 'completed' && (
                        <Button
                          size="small"
                          color="warning"
                          startIcon={undoing === m.id ? <CircularProgress size={14} /> : <UndoIcon />}
                          onClick={() => handleUndo(m.id)}
                          disabled={undoing !== null}
                        >
                          取消
                        </Button>
                      )}
                      {m.status === 'undone' && m.undone_at && (
                        <Typography variant="caption" color="text.secondary">
                          {m.undone_at} {m.undone_by?.name}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
}
