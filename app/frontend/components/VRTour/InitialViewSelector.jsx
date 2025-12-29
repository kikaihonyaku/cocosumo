import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  ButtonGroup,
} from '@mui/material';
import {
  CenterFocusStrong as CenterIcon,
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
  Flip as FlipIcon,
  MyLocation as CurrentViewIcon,
  Explore as CompassIcon,
} from '@mui/icons-material';

/**
 * 初期視点プリセットセレクター
 * シーンの初期表示視点を設定するためのUI
 */
const InitialViewSelector = ({
  currentView = { yaw: 0, pitch: 0 },
  initialView = { yaw: 0, pitch: 0 },
  onInitialViewChange,
}) => {
  const [yaw, setYaw] = useState(initialView.yaw || 0);
  const [pitch, setPitch] = useState(initialView.pitch || 0);

  // 初期視点が外部から変更された場合に反映
  useEffect(() => {
    setYaw(initialView.yaw || 0);
    setPitch(initialView.pitch || 0);
  }, [initialView.yaw, initialView.pitch]);

  // yaw を -180 ～ 180 の範囲に正規化
  const normalizeYaw = (value) => {
    let normalized = value % 360;
    if (normalized > 180) normalized -= 360;
    if (normalized < -180) normalized += 360;
    return Math.round(normalized * 100) / 100;
  };

  // pitch を -90 ～ 90 の範囲に制限
  const normalizePitch = (value) => {
    return Math.max(-90, Math.min(90, Math.round(value * 100) / 100));
  };

  const handleApply = () => {
    onInitialViewChange && onInitialViewChange({
      yaw: normalizeYaw(yaw),
      pitch: normalizePitch(pitch),
    });
  };

  const handleSetCurrentView = () => {
    const normalizedYaw = normalizeYaw(currentView.yaw || 0);
    const normalizedPitch = normalizePitch(currentView.pitch || 0);
    setYaw(normalizedYaw);
    setPitch(normalizedPitch);
    onInitialViewChange && onInitialViewChange({
      yaw: normalizedYaw,
      pitch: normalizedPitch,
    });
  };

  const handlePreset = (presetYaw, presetPitch = 0) => {
    const normalizedYaw = normalizeYaw(presetYaw);
    const normalizedPitch = normalizePitch(presetPitch);
    setYaw(normalizedYaw);
    setPitch(normalizedPitch);
    onInitialViewChange && onInitialViewChange({
      yaw: normalizedYaw,
      pitch: normalizedPitch,
    });
  };

  // コンパス表示用の角度計算（yawを方位に変換）
  const compassRotation = -yaw; // CSSのrotateは時計回りが正

  // 方位を取得
  const getDirection = (yawValue) => {
    const normalized = ((yawValue % 360) + 360) % 360;
    if (normalized >= 337.5 || normalized < 22.5) return '正面';
    if (normalized >= 22.5 && normalized < 67.5) return '右斜め前';
    if (normalized >= 67.5 && normalized < 112.5) return '右';
    if (normalized >= 112.5 && normalized < 157.5) return '右斜め後';
    if (normalized >= 157.5 && normalized < 202.5) return '後ろ';
    if (normalized >= 202.5 && normalized < 247.5) return '左斜め後';
    if (normalized >= 247.5 && normalized < 292.5) return '左';
    if (normalized >= 292.5 && normalized < 337.5) return '左斜め前';
    return '';
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CompassIcon fontSize="small" />
        初期視点設定
      </Typography>

      {/* コンパス表示 */}
      <Paper
        variant="outlined"
        sx={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          mx: 'auto',
          mb: 2,
          position: 'relative',
          bgcolor: 'grey.50',
          border: '2px solid',
          borderColor: 'grey.300',
        }}
      >
        {/* 方位マーカー */}
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            top: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            fontWeight: 600,
            color: 'error.main',
          }}
        >
          N
        </Typography>
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            bottom: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'text.secondary',
          }}
        >
          S
        </Typography>
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            left: 4,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'text.secondary',
          }}
        >
          W
        </Typography>
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            right: 4,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'text.secondary',
          }}
        >
          E
        </Typography>

        {/* 方向指示器 */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 80,
            height: 80,
            transform: `translate(-50%, -50%) rotate(${compassRotation}deg)`,
            transition: 'transform 0.3s ease',
          }}
        >
          {/* 視野範囲を示す扇形 */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: '50%',
              width: 0,
              height: 0,
              borderLeft: '20px solid transparent',
              borderRight: '20px solid transparent',
              borderBottom: '35px solid rgba(33, 150, 243, 0.3)',
              transform: 'translateX(-50%)',
            }}
          />
          {/* 中心点 */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              transform: 'translate(-50%, -50%)',
            }}
          />
          {/* 方向線 */}
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              left: '50%',
              width: 2,
              height: 30,
              bgcolor: 'primary.main',
              transform: 'translateX(-50%)',
              borderRadius: 1,
            }}
          />
        </Box>
      </Paper>

      {/* 現在の方向表示 */}
      <Typography variant="body2" align="center" sx={{ mb: 2, color: 'text.secondary' }}>
        {getDirection(yaw)}
      </Typography>

      {/* 現在の視点を設定ボタン */}
      <Button
        fullWidth
        variant="contained"
        startIcon={<CurrentViewIcon />}
        onClick={handleSetCurrentView}
        sx={{ mb: 2 }}
      >
        現在の視点を初期視点に設定
      </Button>

      <Divider sx={{ my: 2 }} />

      {/* プリセットボタン */}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        プリセット
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <ButtonGroup variant="outlined" size="small">
          <Tooltip title="正面 (0°)">
            <Button onClick={() => handlePreset(0, 0)}>
              <CenterIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="左90° (-90°)">
            <Button onClick={() => handlePreset(-90, 0)}>
              <RotateLeftIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="右90° (90°)">
            <Button onClick={() => handlePreset(90, 0)}>
              <RotateRightIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="後ろ (180°)">
            <Button onClick={() => handlePreset(180, 0)}>
              <FlipIcon fontSize="small" />
            </Button>
          </Tooltip>
        </ButtonGroup>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* 数値入力 */}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        詳細設定
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        <TextField
          size="small"
          type="number"
          label="Yaw (左右)"
          value={yaw}
          onChange={(e) => setYaw(parseFloat(e.target.value) || 0)}
          onBlur={handleApply}
          inputProps={{ step: 1, min: -180, max: 180 }}
          sx={{ flex: 1 }}
          helperText="-180° ～ 180°"
        />
        <TextField
          size="small"
          type="number"
          label="Pitch (上下)"
          value={pitch}
          onChange={(e) => setPitch(parseFloat(e.target.value) || 0)}
          onBlur={handleApply}
          inputProps={{ step: 1, min: -90, max: 90 }}
          sx={{ flex: 1 }}
          helperText="-90° ～ 90°"
        />
      </Box>

      <Button
        fullWidth
        variant="outlined"
        size="small"
        onClick={handleApply}
      >
        適用
      </Button>
    </Box>
  );
};

export default InitialViewSelector;
