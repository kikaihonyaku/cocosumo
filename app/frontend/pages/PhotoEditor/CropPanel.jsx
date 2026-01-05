import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  Divider,
  Alert,
} from '@mui/material';
import {
  Crop as CropIcon,
  AspectRatio as AspectRatioIcon,
} from '@mui/icons-material';
import { ASPECT_RATIOS, SIZE_PRESETS } from './constants';

export default function CropPanel({
  isMobile,
  cropMode,
  selectedAspectRatio,
  resizeEnabled,
  selectedPresetSize,
  cropArea,
  aiProcessing,
  onAspectRatioChange,
  onResizeEnabledChange,
  onPresetSizeChange,
  onToggleCropMode,
  onApplyCrop,
  onCancelCrop,
}) {
  return (
    <Paper elevation={2} sx={{ p: 1.5 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CropIcon />
        サイズ調整
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {/* アスペクト比選択 */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
          アスペクト比を選択
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            value={selectedAspectRatio}
            onChange={(e) => onAspectRatioChange(e.target.value)}
            disabled={cropMode}
          >
            {ASPECT_RATIOS.map((ar) => (
              <MenuItem key={ar.value} value={ar.value}>
                {ar.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* リサイズトグル */}
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={resizeEnabled}
              onChange={(e) => onResizeEnabledChange(e.target.checked)}
              disabled={cropMode || selectedAspectRatio === 'free'}
            />
          }
          label={
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              リサイズあり
            </Typography>
          }
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4, fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
          {resizeEnabled
            ? 'トリミング後、指定サイズにリサイズします'
            : 'トリミング範囲をそのまま切り出します'}
        </Typography>
      </Box>

      {/* プリセットサイズ選択（リサイズありかつフリーでない場合のみ表示） */}
      {resizeEnabled && selectedAspectRatio !== 'free' && SIZE_PRESETS[selectedAspectRatio]?.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
            出力サイズを選択
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={selectedPresetSize}
              onChange={(e) => onPresetSizeChange(e.target.value)}
              disabled={cropMode}
            >
              {SIZE_PRESETS[selectedAspectRatio].map((preset, index) => (
                <MenuItem key={index} value={index}>
                  {preset.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* クロップモード切り替え */}
      <Box sx={{ mb: 2 }}>
        <Button
          fullWidth
          variant={cropMode ? "contained" : "outlined"}
          color={cropMode ? "primary" : "secondary"}
          startIcon={<AspectRatioIcon />}
          onClick={onToggleCropMode}
          disabled={aiProcessing}
        >
          {cropMode ? 'クロップモード ON' : 'クロップモードを開始'}
        </Button>
      </Box>

      {/* クロップモード時の説明 */}
      {cropMode && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="info" sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem', py: isMobile ? 0.5 : 1 }}>
            {isMobile
              ? '画像をドラッグしてクロップ範囲を選択してください'
              : selectedAspectRatio === 'free'
              ? '画像上でドラッグして自由にクロップ範囲を選択してください。'
              : '画像上でドラッグしてクロップ範囲を選択してください。アスペクト比は自動的に維持されます。'
            }
          </Alert>

          {cropArea && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
                選択範囲: {Math.round(cropArea.width)} × {Math.round(cropArea.height)}px
                <br />
                {resizeEnabled && selectedAspectRatio !== 'free' && SIZE_PRESETS[selectedAspectRatio]?.[selectedPresetSize] && (
                  <>
                    出力サイズ: {SIZE_PRESETS[selectedAspectRatio][selectedPresetSize].width} × {SIZE_PRESETS[selectedAspectRatio][selectedPresetSize].height}px
                  </>
                )}
                {(!resizeEnabled || selectedAspectRatio === 'free') && (
                  <>
                    出力サイズ: {Math.round(cropArea.width)} × {Math.round(cropArea.height)}px (リサイズなし)
                  </>
                )}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* 適用/キャンセルボタン */}
      {cropMode && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            fullWidth
            variant="outlined"
            color="error"
            onClick={onCancelCrop}
            disabled={aiProcessing}
          >
            キャンセル
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="success"
            onClick={onApplyCrop}
            disabled={!cropArea || aiProcessing}
          >
            適用
          </Button>
        </Box>
      )}
    </Paper>
  );
}
