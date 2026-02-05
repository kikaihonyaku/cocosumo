import React from 'react';
import { Box, Typography, AppBar, Toolbar, Chip, useMediaQuery, useTheme } from '@mui/material';
import {
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Home as HomeIcon
} from '@mui/icons-material';

export default function CustomerHeader({
  customerName,
  expiresAt,
  formattedExpiresAt,
  daysUntilExpiry,
  propertyTitle,
  tenantName
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const getExpiryColor = () => {
    if (daysUntilExpiry === null || daysUntilExpiry === undefined) return 'default';
    if (daysUntilExpiry <= 3) return 'error';
    if (daysUntilExpiry <= 7) return 'warning';
    return 'success';
  };

  // 表示するタイトルを決定
  const displayTitle = propertyTitle || 'CoCoスモ';
  const hasSubtitle = tenantName && propertyTitle;

  return (
    <AppBar position="static" sx={{ bgcolor: 'primary.main', borderRadius: '12px 12px 0 0' }}>
      <Toolbar sx={{
        justifyContent: 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: { xs: 1, sm: 2 },
        py: isMobile ? 1 : 0,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          <HomeIcon />
          <Typography variant="h6" component="h1" sx={{ fontWeight: 600, lineHeight: 1.2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {displayTitle}
            {hasSubtitle && !isMobile && (
              <Typography component="span" sx={{ opacity: 0.85, fontSize: '0.8em', ml: 1 }}>
                {tenantName}
              </Typography>
            )}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
          {customerName && (
            <Chip
              icon={<PersonIcon />}
              label={`${customerName} 様 限定公開`}
              size={isMobile ? 'small' : 'medium'}
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
