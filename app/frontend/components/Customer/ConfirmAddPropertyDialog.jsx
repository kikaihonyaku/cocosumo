import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Alert, CircularProgress
} from '@mui/material';

export default function ConfirmAddPropertyDialog({
  open,
  onClose,
  onConfirm,
  loading,
  roomName,
  error
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>物件を案件に追加</DialogTitle>
      <DialogContent>
        <Typography>
          <strong>{roomName}</strong> は現在の案件に登録されていません。案件の物件として追加しますか？
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          スキップ
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} /> : null}
        >
          追加する
        </Button>
      </DialogActions>
    </Dialog>
  );
}
