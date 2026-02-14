import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Slider,
  Typography,
  Collapse,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  SkipNext as NextIcon,
  SkipPrevious as PrevIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  ThreeSixty as RotateIcon,
} from '@mui/icons-material';

const glassStyle = {
  bgcolor: 'rgba(0, 0, 0, 0.4)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

/**
 * オートプレイコントロール - コンパクトピル型
 */
const AutoplayControls = ({
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  currentSceneIndex,
  totalScenes,
  autoRotateEnabled,
  onToggleAutoRotate,
  sceneDuration = 10,
  onSceneDurationChange,
  rotateSpeed = 1,
  onRotateSpeedChange,
  settingsOpen = false,
  onSettingsToggle,
}) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 56,
        right: 16,
        zIndex: 100,
      }}
    >
      {/* 設定パネル */}
      <Collapse in={settingsOpen}>
        <Box
          sx={{
            ...glassStyle,
            borderRadius: 2,
            p: 2,
            mb: 1,
            minWidth: 200,
          }}
        >
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem' }}>
              シーン滞在時間: {sceneDuration}秒
            </Typography>
            <Slider
              value={sceneDuration}
              onChange={(e, v) => onSceneDurationChange(v)}
              min={5}
              max={30}
              step={1}
              size="small"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                '& .MuiSlider-thumb': { width: 12, height: 12, bgcolor: 'white' },
                '& .MuiSlider-track': { bgcolor: 'rgba(255, 255, 255, 0.6)' },
                '& .MuiSlider-rail': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
              }}
            />
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem' }}>
              回転速度: {rotateSpeed.toFixed(1)}x
            </Typography>
            <Slider
              value={rotateSpeed}
              onChange={(e, v) => onRotateSpeedChange(v)}
              min={0.5}
              max={3}
              step={0.5}
              size="small"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                '& .MuiSlider-thumb': { width: 12, height: 12, bgcolor: 'white' },
                '& .MuiSlider-track': { bgcolor: 'rgba(255, 255, 255, 0.6)' },
                '& .MuiSlider-rail': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
              }}
            />
          </Box>
        </Box>
      </Collapse>

      {/* コントロール本体 - コンパクトピル型 */}
      <Box
        sx={{
          ...glassStyle,
          borderRadius: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          px: 0.5,
          py: 0.25,
        }}
      >
        <Tooltip title="前のシーン">
          <span>
            <IconButton
              onClick={onPrev}
              disabled={currentSceneIndex === 0}
              sx={{ color: 'white', p: 0.5 }}
              size="small"
            >
              <PrevIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title={isPlaying ? '一時停止' : '再生'}>
          <IconButton
            onClick={onPlayPause}
            sx={{
              color: 'white',
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              p: 0.75,
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' },
            }}
            size="small"
          >
            {isPlaying ? <PauseIcon sx={{ fontSize: 18 }} /> : <PlayIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </Tooltip>

        <Tooltip title="次のシーン">
          <span>
            <IconButton
              onClick={onNext}
              disabled={currentSceneIndex >= totalScenes - 1}
              sx={{ color: 'white', p: 0.5 }}
              size="small"
            >
              <NextIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>

        {/* シーンカウンター */}
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.65rem',
            mx: 0.5,
            minWidth: 24,
            textAlign: 'center',
          }}
        >
          {currentSceneIndex + 1}/{totalScenes}
        </Typography>

        <Tooltip title={autoRotateEnabled ? '自動回転を停止' : '自動回転を開始'}>
          <IconButton
            onClick={onToggleAutoRotate}
            sx={{
              color: autoRotateEnabled ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)',
              p: 0.5,
            }}
            size="small"
          >
            <RotateIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="設定">
          <IconButton
            onClick={() => onSettingsToggle?.(!settingsOpen)}
            sx={{
              color: settingsOpen ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)',
              p: 0.5,
            }}
            size="small"
          >
            {settingsOpen ? <CloseIcon sx={{ fontSize: 16 }} /> : <SettingsIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default AutoplayControls;
