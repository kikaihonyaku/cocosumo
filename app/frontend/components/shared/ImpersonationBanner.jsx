import React from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import { ExitToApp as ExitIcon } from '@mui/icons-material';
import { useTenant } from '../../contexts/TenantContext';

export default function ImpersonationBanner() {
  const { isImpersonating, currentTenant, originalTenant, stopImpersonation } = useTenant();

  if (!isImpersonating) return null;

  const handleStopImpersonation = async () => {
    await stopImpersonation();
    window.location.href = '/super-admin/tenants';
  };

  return (
    <Alert
      severity="warning"
      sx={{
        borderRadius: 0,
        py: 0.5,
        '& .MuiAlert-message': {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', justifyContent: 'space-between' }}>
        <Typography variant="body2">
          <strong>{currentTenant?.name}</strong> として代理ログイン中
          {originalTenant && ` (元: ${originalTenant.name})`}
        </Typography>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<ExitIcon />}
          onClick={handleStopImpersonation}
        >
          代理ログイン終了
        </Button>
      </Box>
    </Alert>
  );
}
