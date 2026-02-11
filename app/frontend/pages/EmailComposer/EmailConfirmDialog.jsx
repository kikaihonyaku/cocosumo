import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Chip
} from '@mui/material';
import { AttachFile as AttachIcon } from '@mui/icons-material';

export default function EmailConfirmDialog({
  open,
  onClose,
  onConfirm,
  customer,
  subject,
  attachmentCount
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>メール送信の確認</DialogTitle>
      <DialogContent>
        <Typography>
          {customer?.name} 様（{customer?.email}）にメールを送信します。よろしいですか？
        </Typography>
        <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            件名: {subject}
          </Typography>
          {attachmentCount > 0 && (
            <Chip
              icon={<AttachIcon />}
              label={`添付ファイル: ${attachmentCount}件`}
              size="small"
              variant="outlined"
              sx={{ width: 'fit-content' }}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button variant="contained" onClick={onConfirm}>送信する</Button>
      </DialogActions>
    </Dialog>
  );
}
