import React from 'react';
import { Box, Typography, AppBar, Toolbar, Chip } from '@mui/material';
import {
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Home as HomeIcon
} from '@mui/icons-material';

export default function CustomerHeader({
  customerName,
  expiresAt,
  formattedExpiresAt,
  daysUntilExpiry
}) {
  const getExpiryColor = () => {
    if (daysUntilExpiry === null || daysUntilExpiry === undefined) return 'default';
    if (daysUntilExpiry <= 3) return 'error';
    if (daysUntilExpiry <= 7) return 'warning';
    return 'success';
  };

  return (
    <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <HomeIcon />
          <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
            CoCoスモ
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {customerName && (
            <Chip
              icon={<PersonIcon />}
              label={`${customerName} 様 限定公開`}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '& .MuiChip-icon': { color: 'white' }
              }}
            />
          )}

          {expiresAt && daysUntilExpiry !== null && (
            <Chip
              icon={<ScheduleIcon />}
              label={
                daysUntilExpiry <= 0
                  ? '期限切れ'
                  : `残り ${daysUntilExpiry} 日`
              }
              color={getExpiryColor()}
              size="small"
            />
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
