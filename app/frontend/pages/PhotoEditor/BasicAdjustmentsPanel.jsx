import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Slider,
  Divider,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

export default function BasicAdjustmentsPanel({
  brightness,
  contrast,
  saturation,
  onBrightnessChange,
  onContrastChange,
  onSaturationChange,
  onReset,
}) {
  return (
    <Paper elevation={2} sx={{ p: 1.5 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        基本調整
        <IconButton size="small" onClick={onReset} title="リセット">
          <RefreshIcon />
        </IconButton>
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Box sx={{ mb: 3, px: 1 }}>
        <Typography variant="body2" gutterBottom>
          明度: {brightness}%
        </Typography>
        <Slider
          value={brightness}
          onChange={(e, value) => onBrightnessChange(value)}
          min={0}
          max={200}
          step={1}
          marks={[
            { value: 0, label: '0%' },
            { value: 100, label: '100%' },
            { value: 200, label: '200%' },
          ]}
        />
      </Box>

      <Box sx={{ mb: 3, px: 1 }}>
        <Typography variant="body2" gutterBottom>
          コントラスト: {contrast}%
        </Typography>
        <Slider
          value={contrast}
          onChange={(e, value) => onContrastChange(value)}
          min={0}
          max={200}
          step={1}
          marks={[
            { value: 0, label: '0%' },
            { value: 100, label: '100%' },
            { value: 200, label: '200%' },
          ]}
        />
      </Box>

      <Box sx={{ mb: 0, px: 1 }}>
        <Typography variant="body2" gutterBottom>
          彩度: {saturation}%
        </Typography>
        <Slider
          value={saturation}
          onChange={(e, value) => onSaturationChange(value)}
          min={0}
          max={200}
          step={1}
          marks={[
            { value: 0, label: '0%' },
            { value: 100, label: '100%' },
            { value: 200, label: '200%' },
          ]}
        />
      </Box>
    </Paper>
  );
}
