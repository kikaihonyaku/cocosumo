import React from 'react';
import { Chip, Tooltip, Box, LinearProgress, Typography } from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

export default function SimulationQuotaIndicator({ remaining, dailyLimit = 10, size = 'medium' }) {
  const used = dailyLimit - remaining;
  const progress = (used / dailyLimit) * 100;

  const getColor = () => {
    if (remaining === 0) return 'error';
    if (remaining <= 3) return 'warning';
    return 'primary';
  };

  if (size === 'small') {
    return (
      <Tooltip title={`本日の残り回数: ${remaining}/${dailyLimit}`}>
        <Chip
          icon={<AutoFixHighIcon sx={{ fontSize: 16 }} />}
          label={`残り${remaining}回`}
          size="small"
          color={getColor()}
          variant={remaining === 0 ? 'filled' : 'outlined'}
          sx={{ fontSize: '0.75rem' }}
        />
      </Tooltip>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <AutoFixHighIcon color={getColor()} sx={{ fontSize: 20 }} />
      <Box sx={{ flex: 1, minWidth: 100 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
            シミュレーション回数
          </Typography>
          <Typography
            variant="body2"
            color={getColor() + '.main'}
            fontWeight="bold"
            sx={{ fontSize: '0.8rem' }}
          >
            残り{remaining}回
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          color={getColor()}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
            },
          }}
        />
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
          1日{dailyLimit}回まで（翌日0時リセット）
        </Typography>
      </Box>
    </Box>
  );
}
