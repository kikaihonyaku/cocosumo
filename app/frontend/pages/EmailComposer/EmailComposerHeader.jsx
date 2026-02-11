import React from 'react';
import {
  Box, Typography, Button, Chip, CircularProgress, IconButton, Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

export default function EmailComposerHeader({
  customer,
  draftSaving,
  draftSavedAt,
  sending,
  sent,
  onBack,
  onSaveDraft,
  onSendClick,
  isMobile
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? 1 : 2,
        px: 2,
        py: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'white',
        flexShrink: 0,
        minHeight: 56,
      }}
    >
      <Tooltip title="顧客に戻る">
        <IconButton onClick={onBack} size="small">
          <ArrowBackIcon />
        </IconButton>
      </Tooltip>

      {!isMobile && (
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>
          メール作成
        </Typography>
      )}

      {customer && (
        <Chip
          size="small"
          label={`宛先: ${customer.name}${customer.email ? ` <${customer.email}>` : ' (メール未登録)'}`}
          variant="outlined"
          sx={{ maxWidth: isMobile ? 180 : 350, fontSize: '0.8rem' }}
        />
      )}

      <Box sx={{ flex: 1 }} />

      {/* Draft save status */}
      {draftSaving && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CircularProgress size={14} />
          <Typography variant="caption" color="text.secondary">保存中...</Typography>
        </Box>
      )}
      {!draftSaving && draftSavedAt && (
        <Typography variant="caption" color="text.secondary" sx={{ display: isMobile ? 'none' : 'block' }}>
          保存済み {draftSavedAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      )}

      <Button
        size="small"
        variant="outlined"
        startIcon={<SaveIcon />}
        onClick={() => onSaveDraft(true)}
        disabled={sending || sent}
        sx={{ display: isMobile ? 'none' : 'inline-flex' }}
      >
        下書き保存
      </Button>

      {sent ? (
        <Button
          size="small"
          variant="contained"
          color="success"
          startIcon={<CheckCircleIcon />}
          disabled
        >
          送信完了
        </Button>
      ) : (
        <Button
          size="small"
          variant="contained"
          startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
          onClick={onSendClick}
          disabled={sending || !customer?.email}
        >
          送信
        </Button>
      )}
    </Box>
  );
}
