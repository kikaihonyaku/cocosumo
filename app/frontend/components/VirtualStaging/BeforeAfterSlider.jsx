import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Fade, IconButton, Tooltip } from '@mui/material';
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from 'react-compare-slider';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';

/**
 * カスタムスライダーハンドルコンポーネント
 */
const CustomHandle = ({ style }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        cursor: 'ew-resize',
        ...style,
      }}
    >
      {/* 縦線 */}
      <Box
        sx={{
          width: '3px',
          height: '100%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.3) 100%)',
          boxShadow: '0 0 8px rgba(0,0,0,0.5)',
          position: 'relative',
        }}
      >
        {/* ハンドルボタン */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '3px solid white',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              transform: 'translate(-50%, -50%) scale(1.1)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.5)',
            },
          }}
        >
          <ChevronLeftIcon sx={{ color: 'white', fontSize: 20, ml: -0.5 }} />
          <ChevronRightIcon sx={{ color: 'white', fontSize: 20, mr: -0.5 }} />
        </Box>
      </Box>
    </Box>
  );
};

/**
 * Before/After画像比較スライダーコンポーネント
 */
const BeforeAfterSlider = ({
  beforeImageUrl,
  afterImageUrl,
  beforeLabel = 'Before',
  afterLabel = 'After',
  height = '600px',
  showLabels = true,
  showGuide = true,
  showFullscreenButton = true,
}) => {
  const [position, setPosition] = useState(50);
  const [showHint, setShowHint] = useState(showGuide);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // 初回操作でヒントを非表示
  const handlePositionChange = useCallback((newPosition) => {
    setPosition(newPosition);
    if (!hasInteracted) {
      setHasInteracted(true);
      setShowHint(false);
    }
  }, [hasInteracted]);

  // 一定時間後にヒントを自動非表示
  useEffect(() => {
    if (showGuide && showHint) {
      const timer = setTimeout(() => {
        setShowHint(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showGuide, showHint]);

  // キーボード操作
  const handleKeyDown = useCallback((e) => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setPosition((prev) => Math.max(0, prev - step));
      setHasInteracted(true);
      setShowHint(false);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setPosition((prev) => Math.min(100, prev + step));
      setHasInteracted(true);
      setShowHint(false);
    } else if (e.key === 'Escape' && isFullscreen) {
      handleExitFullscreen();
    }
  }, [isFullscreen]);

  // フルスクリーン切り替え
  const handleToggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if (containerRef.current.webkitRequestFullscreen) {
          await containerRef.current.webkitRequestFullscreen();
        }
      } else {
        handleExitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, [isFullscreen]);

  const handleExitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }, []);

  // フルスクリーン状態の変更を監視
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        height: isFullscreen ? '100vh' : height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        outline: 'none',
        bgcolor: isFullscreen ? '#1a1a2e' : 'transparent',
        '&:focus': {
          outline: '2px solid #667eea',
          outlineOffset: '2px',
          borderRadius: '8px',
        },
      }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="slider"
      aria-label="Before/After比較スライダー"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={position}
    >
      <ReactCompareSlider
        itemOne={
          <ReactCompareSliderImage
            src={beforeImageUrl}
            alt={beforeLabel}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        }
        itemTwo={
          <ReactCompareSliderImage
            src={afterImageUrl}
            alt={afterLabel}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        }
        position={position}
        onPositionChange={handlePositionChange}
        handle={<CustomHandle />}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      />

      {/* ラベルをスライダーの外側に配置して常に表示 */}
      {showLabels && (
        <>
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              px: 2,
              py: 1,
              borderRadius: 1,
              pointerEvents: 'none',
              zIndex: 5,
              backdropFilter: 'blur(4px)',
            }}
          >
            <Typography variant="body2" fontWeight="bold">
              {beforeLabel}
            </Typography>
          </Box>
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              px: 2,
              py: 1,
              borderRadius: 1,
              pointerEvents: 'none',
              zIndex: 5,
              backdropFilter: 'blur(4px)',
            }}
          >
            <Typography variant="body2" fontWeight="bold">
              {afterLabel}
            </Typography>
          </Box>
        </>
      )}

      {/* フルスクリーンボタン */}
      {showFullscreenButton && (
        <Tooltip title={isFullscreen ? 'フルスクリーン終了 (ESC)' : 'フルスクリーン表示'}>
          <IconButton
            onClick={handleToggleFullscreen}
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              zIndex: 15,
              backdropFilter: 'blur(4px)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.8)',
              },
            }}
          >
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </Tooltip>
      )}

      {/* 操作ガイド（初回表示） */}
      <Fade in={showHint} timeout={500}>
        <Box
          sx={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'rgba(0, 0, 0, 0.75)',
            color: 'white',
            px: 3,
            py: 1.5,
            borderRadius: 2,
            pointerEvents: 'none',
            zIndex: 10,
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 0.9 },
              '50%': { opacity: 1 },
            },
          }}
        >
          <ChevronLeftIcon sx={{ fontSize: 20 }} />
          <Typography variant="body2" fontWeight="500">
            ドラッグして比較
          </Typography>
          <ChevronRightIcon sx={{ fontSize: 20 }} />
        </Box>
      </Fade>
    </Box>
  );
};

export default BeforeAfterSlider;
