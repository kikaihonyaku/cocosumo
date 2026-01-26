import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Language as LanguageIcon
} from '@mui/icons-material';

export default function TenantInfoDialog({ open, onClose, tenant }) {
  if (!tenant) return null;

  const handleCopyEmail = () => {
    if (tenant.inquiry_email_address) {
      navigator.clipboard.writeText(tenant.inquiry_email_address);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'warning';
      case 'deleted': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return '有効';
      case 'suspended': return '停止中';
      case 'deleted': return '削除済み';
      default: return status;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon color="primary" />
          <Typography variant="h6">テナント情報</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* テナント名 */}
          <Box>
            <Typography variant="caption" color="text.secondary">
              テナント名
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {tenant.name}
            </Typography>
          </Box>

          {/* サブドメイン */}
          <Box>
            <Typography variant="caption" color="text.secondary">
              サブドメイン
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LanguageIcon fontSize="small" color="action" />
              <Typography variant="body1">
                {tenant.subdomain}.cocosumo.space
              </Typography>
            </Box>
          </Box>

          {/* ステータス */}
          <Box>
            <Typography variant="caption" color="text.secondary">
              ステータス
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip
                label={getStatusLabel(tenant.status)}
                color={getStatusColor(tenant.status)}
                size="small"
              />
            </Box>
          </Box>

          <Divider />

          {/* 問い合わせ受付用メールアドレス */}
          <Box>
            <Typography variant="caption" color="text.secondary">
              問い合わせ受付用メールアドレス
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <EmailIcon fontSize="small" color="action" />
              <Typography
                variant="body1"
                sx={{
                  fontFamily: 'monospace',
                  bgcolor: 'grey.100',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  flexGrow: 1
                }}
              >
                {tenant.inquiry_email_address || '未設定'}
              </Typography>
              {tenant.inquiry_email_address && (
                <Tooltip title="コピー">
                  <IconButton size="small" onClick={handleCopyEmail}>
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              このアドレス宛のメールは自動的に問い合わせとして登録されます
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
}
