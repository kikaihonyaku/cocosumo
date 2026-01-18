import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  Fade,
  CircularProgress,
  Alert
} from '@mui/material';
import CompareIcon from '@mui/icons-material/Compare';
import ImageIcon from '@mui/icons-material/Image';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function ImageSimulationResult({
  originalImageUrl,
  resultImageUrl,
  prompt,
  loading,
  error,
  isMobile
}) {
  const [viewMode, setViewMode] = useState('result'); // 'original', 'result', 'compare'
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handleSliderMove = (e) => {
    if (!isDragging) return;
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  if (loading) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300,
          bgcolor: 'grey.50'
        }}
      >
        <CircularProgress size={48} sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary" gutterBottom>
          AIがシミュレーション中...
        </Typography>
        <Typography variant="caption" color="text.disabled">
          処理には数秒〜数十秒かかる場合があります
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          シミュレーションに失敗しました
        </Typography>
        <Typography variant="caption">{error}</Typography>
      </Alert>
    );
  }

  if (!resultImageUrl) {
    return null;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold">
          シミュレーション結果
        </Typography>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          size="small"
        >
          <ToggleButton value="original" aria-label="元画像">
            <ImageIcon sx={{ fontSize: 18, mr: 0.5 }} />
            <Typography variant="caption">元画像</Typography>
          </ToggleButton>
          <ToggleButton value="result" aria-label="結果">
            <AutoFixHighIcon sx={{ fontSize: 18, mr: 0.5 }} />
            <Typography variant="caption">結果</Typography>
          </ToggleButton>
          <ToggleButton value="compare" aria-label="比較">
            <CompareIcon sx={{ fontSize: 18, mr: 0.5 }} />
            <Typography variant="caption">比較</Typography>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 2,
          bgcolor: 'grey.100'
        }}
      >
        {/* 元画像のみ */}
        {viewMode === 'original' && (
          <Box
            component="img"
            src={originalImageUrl}
            alt="元画像"
            sx={{
              width: '100%',
              height: 'auto',
              display: 'block'
            }}
          />
        )}

        {/* 結果画像のみ */}
        {viewMode === 'result' && (
          <Box
            component="img"
            src={resultImageUrl}
            alt="シミュレーション結果"
            sx={{
              width: '100%',
              height: 'auto',
              display: 'block'
            }}
          />
        )}

        {/* 比較表示（スライダー） */}
        {viewMode === 'compare' && (
          <Box
            sx={{
              position: 'relative',
              cursor: 'ew-resize',
              userSelect: 'none'
            }}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={handleSliderMove}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            onTouchMove={handleTouchMove}
          >
            {/* 元画像（背景） */}
            <Box
              component="img"
              src={originalImageUrl}
              alt="元画像"
              sx={{
                width: '100%',
                height: 'auto',
                display: 'block'
              }}
            />

            {/* 結果画像（クリップ） */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
              }}
            >
              <Box
                component="img"
                src={resultImageUrl}
                alt="シミュレーション結果"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </Box>

            {/* スライダーライン */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${sliderPosition}%`,
                width: 3,
                bgcolor: 'white',
                transform: 'translateX(-50%)',
                boxShadow: '0 0 10px rgba(0,0,0,0.5)'
              }}
            >
              {/* スライダーハンドル */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: 'white',
                  boxShadow: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CompareIcon color="primary" />
              </Box>
            </Box>

            {/* ラベル */}
            <Chip
              label="元画像"
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                bgcolor: 'rgba(0,0,0,0.6)',
                color: 'white',
                fontSize: '0.7rem'
              }}
            />
            <Chip
              label="AI生成"
              size="small"
              color="primary"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                fontSize: '0.7rem'
              }}
            />
          </Box>
        )}
      </Paper>

      {/* プロンプト表示 */}
      {prompt && (
        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            適用したシミュレーション: {prompt}
          </Typography>
        </Box>
      )}

      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
        ※ AI生成画像はイメージです。実際の物件とは異なる場合があります。
      </Typography>
    </Box>
  );
}
