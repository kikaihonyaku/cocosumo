import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Chip
} from '@mui/material';
import CompareIcon from '@mui/icons-material/Compare';
import ImageIcon from '@mui/icons-material/Image';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

/**
 * Before/After画像ビューワーコンポーネント
 * バーチャルステージングなどで使用するBefore/After/比較切り替え機能付きビューワー
 */
export default function BeforeAfterViewer({
  beforeImageUrl,
  afterImageUrl,
  beforeLabel = 'Before',
  afterLabel = 'After',
  title,
  isMobile = false,
  showTitle = true,
  maxHeight,
  darkMode = false,
  showAiDisclaimer = false
}) {
  const [viewMode, setViewMode] = useState('compare'); // 'before', 'after', 'compare'
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

  if (!beforeImageUrl || !afterImageUrl) {
    return null;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        {showTitle && title && (
          <Typography variant="subtitle2" fontWeight="bold" sx={darkMode ? { color: 'white' } : {}}>
            {title}
          </Typography>
        )}
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          size="small"
          sx={{
            ml: 'auto',
            ...(darkMode && {
              bgcolor: 'rgba(255,255,255,0.1)',
              '& .MuiToggleButton-root': {
                color: 'rgba(255,255,255,0.7)',
                borderColor: 'rgba(255,255,255,0.3)',
                '&.Mui-selected': {
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                  }
                },
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                }
              }
            })
          }}
        >
          <ToggleButton value="before" aria-label={beforeLabel}>
            <ImageIcon sx={{ fontSize: 18, mr: 0.5 }} />
            <Typography variant="caption">{beforeLabel}</Typography>
          </ToggleButton>
          <ToggleButton value="after" aria-label={afterLabel}>
            <AutoFixHighIcon sx={{ fontSize: 18, mr: 0.5 }} />
            <Typography variant="caption">{afterLabel}</Typography>
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
          bgcolor: darkMode ? 'rgba(0,0,0,0.3)' : 'grey.100',
          borderColor: darkMode ? 'rgba(255,255,255,0.2)' : undefined,
          maxHeight: maxHeight
        }}
      >
        {/* Before画像のみ */}
        {viewMode === 'before' && (
          <Box
            component="img"
            src={beforeImageUrl}
            alt={beforeLabel}
            sx={{
              width: '100%',
              height: 'auto',
              maxHeight: maxHeight,
              objectFit: 'contain',
              display: 'block'
            }}
          />
        )}

        {/* After画像のみ */}
        {viewMode === 'after' && (
          <Box
            component="img"
            src={afterImageUrl}
            alt={afterLabel}
            sx={{
              width: '100%',
              height: 'auto',
              maxHeight: maxHeight,
              objectFit: 'contain',
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
            {/* After画像（背景・右側に表示） */}
            <Box
              component="img"
              src={afterImageUrl}
              alt={afterLabel}
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: maxHeight,
                objectFit: 'contain',
                display: 'block'
              }}
            />

            {/* Before画像（クリップ・左側に表示） */}
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
                src={beforeImageUrl}
                alt={beforeLabel}
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
              label={beforeLabel}
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
              label={afterLabel}
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

      {/* AI免責表示 */}
      {showAiDisclaimer && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 1,
            textAlign: 'center',
            color: darkMode ? 'rgba(255,255,255,0.6)' : 'text.secondary'
          }}
        >
          ※AIによる参考イメージです。実際と異なる場合があります。
        </Typography>
      )}
    </Box>
  );
}
