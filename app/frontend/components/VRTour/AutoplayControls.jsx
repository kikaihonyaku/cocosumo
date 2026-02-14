import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Slider,
  Typography,
  Paper,
  Collapse,
  LinearProgress,
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

/**
 * オートプレイコントロールコンポーネント
 * - オートローテーション（360度自動回転）
 * - シーン自動切り替え
 * - 進行状況表示
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
  sceneDuration = 10, // シーン滞在時間（秒）
  onSceneDurationChange,
  rotateSpeed = 1, // 回転速度
  onRotateSpeedChange,
  sceneProgress = 0, // 現在のシーン進行度 (0-100)
  settingsOpen = false,
  onSettingsToggle,
}) => {

  // 全体の進行度を計算
  const overallProgress = totalScenes > 0
    ? ((currentSceneIndex + sceneProgress / 100) / totalScenes) * 100
    : 0;

  return (
    <Paper
      sx={{
        position: 'absolute',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        bgcolor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
        p: 1,
        zIndex: 100,
        minWidth: 280,
      }}
    >
      {/* 進行バー */}
      <Box sx={{ px: 1, mb: 1 }}>
        <LinearProgress
          variant="determinate"
          value={overallProgress}
          sx={{
            height: 4,
            borderRadius: 2,
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            '& .MuiLinearProgress-bar': {
              bgcolor: 'primary.main',
              borderRadius: 2,
            },
          }}
        />
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', textAlign: 'center', mt: 0.5 }}>
          {currentSceneIndex + 1} / {totalScenes}
        </Typography>
      </Box>

      {/* コントロールボタン */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <Tooltip title="前のシーン">
          <IconButton
            onClick={onPrev}
            disabled={currentSceneIndex === 0}
            sx={{ color: 'white' }}
            size="small"
          >
            <PrevIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title={isPlaying ? '一時停止' : '再生'}>
          <IconButton
            onClick={onPlayPause}
            sx={{
              color: 'white',
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </IconButton>
        </Tooltip>

        <Tooltip title="次のシーン">
          <IconButton
            onClick={onNext}
            disabled={currentSceneIndex >= totalScenes - 1}
            sx={{ color: 'white' }}
            size="small"
          >
            <NextIcon />
          </IconButton>
        </Tooltip>

        <Box sx={{ width: 1, bgcolor: 'rgba(255, 255, 255, 0.2)', mx: 1 }} />

        <Tooltip title={autoRotateEnabled ? '自動回転を停止' : '自動回転を開始'}>
          <IconButton
            onClick={onToggleAutoRotate}
            sx={{
              color: autoRotateEnabled ? 'primary.main' : 'white',
            }}
            size="small"
          >
            <RotateIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="設定">
          <IconButton
            onClick={() => onSettingsToggle?.(!settingsOpen)}
            sx={{ color: settingsOpen ? 'primary.main' : 'white' }}
            size="small"
          >
            {settingsOpen ? <CloseIcon /> : <SettingsIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* 設定パネル */}
      <Collapse in={settingsOpen}>
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
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
                color: 'primary.main',
                '& .MuiSlider-thumb': { width: 14, height: 14 },
              }}
            />
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
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
                color: 'primary.main',
                '& .MuiSlider-thumb': { width: 14, height: 14 },
              }}
            />
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default AutoplayControls;
