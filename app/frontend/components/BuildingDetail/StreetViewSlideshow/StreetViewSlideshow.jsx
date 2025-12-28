import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  IconButton,
  Slider,
  Typography,
  CircularProgress,
  Tooltip,
  Paper,
  Fade,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  SkipPrevious as PrevIcon,
  SkipNext as NextIcon,
  Close as CloseIcon,
  Speed as SpeedIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';

export default function StreetViewSlideshow({
  open,
  route,
  onClose,
  onPositionChange, // ペグマン同期用コールバック
  defaultInterval = 2000, // 自動再生間隔（ミリ秒）
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [points, setPoints] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [showPlayer, setShowPlayer] = useState(true); // プレイヤーの表示/非表示
  const [controlsVisible, setControlsVisible] = useState(true);

  const streetViewRef = useRef(null);
  const panoramaRef = useRef(null);
  const intervalRef = useRef(null);
  const dialogRef = useRef(null);
  const thumbnailContainerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // ストリートビューポイントを取得
  useEffect(() => {
    if (!open || !route) return;

    const fetchPoints = async () => {
      setLoading(true);
      try {
        // まず経路に保存されているポイントを使用
        if (route.streetview_points?.length > 0) {
          setPoints(route.streetview_points);
          // initialIndexが指定されている場合はそこから開始
          setCurrentIndex(route.initialIndex || 0);
          setLoading(false);
          return;
        }

        // APIから取得
        const response = await fetch(
          `/api/v1/buildings/${route.building_id}/routes/${route.id}/streetview_points`,
          { credentials: 'include' }
        );
        const data = await response.json();
        setPoints(data.points || []);
        setCurrentIndex(route.initialIndex || 0);
      } catch (error) {
        console.error('Failed to fetch streetview points:', error);
        setPoints([]);
        setCurrentIndex(0);
      } finally {
        setLoading(false);
      }
    };

    fetchPoints();
    setIsPlaying(false);
  }, [open, route]);

  // ストリートビューパノラマの初期化
  useEffect(() => {
    if (!open || !streetViewRef.current || !window.google?.maps || points.length === 0) return;

    const firstPoint = points[0];
    const panorama = new window.google.maps.StreetViewPanorama(streetViewRef.current, {
      position: { lat: firstPoint.lat, lng: firstPoint.lng },
      pov: { heading: firstPoint.heading || 0, pitch: 0 },
      zoom: 1,
      addressControl: false,
      showRoadLabels: true,
      linksControl: false,
      panControl: false,
      enableCloseButton: false,
    });

    panoramaRef.current = panorama;

    return () => {
      panoramaRef.current = null;
    };
  }, [open, points]);

  // 位置変更時の処理
  useEffect(() => {
    if (!panoramaRef.current || points.length === 0) return;

    const point = points[currentIndex];
    if (point) {
      panoramaRef.current.setPosition({ lat: point.lat, lng: point.lng });
      panoramaRef.current.setPov({ heading: point.heading || 0, pitch: 0 });

      // 親コンポーネントに位置変更を通知（ペグマン同期用）
      onPositionChange?.({
        lat: point.lat,
        lng: point.lng,
        heading: point.heading,
        index: currentIndex,
        total: points.length,
      });
    }
  }, [currentIndex, points, onPositionChange]);

  // 自動再生
  useEffect(() => {
    if (isPlaying && points.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= points.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, defaultInterval / playbackSpeed);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, points.length, defaultInterval, playbackSpeed]);

  // キーボードショートカット
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          setIsPlaying((prev) => !prev);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 'Escape':
          onClose();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setIsPlaying(false);
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(points.length - 1, prev + 1));
    setIsPlaying(false);
  }, [points.length]);

  const handleSliderChange = (_, value) => {
    setCurrentIndex(value);
    setIsPlaying(false);
  };

  const handleSpeedChange = (_, value) => {
    setPlaybackSpeed(value);
  };

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const newFullscreen = !prev;
      if (newFullscreen) {
        // フルスクリーン時はプレイヤー非表示、再生停止
        setShowPlayer(false);
        setIsPlaying(false);
      } else {
        // 通常表示に戻る時はプレイヤー表示
        setShowPlayer(true);
      }
      return newFullscreen;
    });
  }, []);

  // サムネイル用のURL生成（Street View Static API）
  const getStreetViewThumbnailUrl = useCallback((point, size = '120x80') => {
    const metaTag = document.querySelector('meta[name="google-maps-api-key"]');
    const apiKey = metaTag?.getAttribute('content') || '';
    if (!apiKey || !point) return null;

    return `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${point.lat},${point.lng}&heading=${point.heading || 0}&fov=90&pitch=0&key=${apiKey}`;
  }, []);

  // サムネイル表示用にポイントを間引く（最大50個）
  const displayThumbnails = useMemo(() => {
    if (points.length <= 50) return points.map((p, i) => ({ ...p, originalIndex: i }));

    const step = Math.ceil(points.length / 50);
    return points
      .filter((_, i) => i % step === 0 || i === points.length - 1)
      .map((p, _, arr) => {
        const originalIndex = points.indexOf(p);
        return { ...p, originalIndex };
      });
  }, [points]);

  // サムネイルクリック時のハンドラー
  const handleThumbnailClick = useCallback((originalIndex) => {
    setCurrentIndex(originalIndex);
    setIsPlaying(false);
  }, []);

  // 選択されたサムネイルを中央にスクロール
  useEffect(() => {
    if (thumbnailContainerRef.current && displayThumbnails.length > 0) {
      const container = thumbnailContainerRef.current;
      // モバイル: 60 + 4 = 64, デスクトップ: 90 + 8 = 98
      const thumbnailWidth = isMobile ? 64 : 98;

      // 現在のインデックスに最も近いサムネイルを見つける
      let closestThumbnailIdx = 0;
      let minDiff = Infinity;
      displayThumbnails.forEach((thumb, idx) => {
        const diff = Math.abs(thumb.originalIndex - currentIndex);
        if (diff < minDiff) {
          minDiff = diff;
          closestThumbnailIdx = idx;
        }
      });

      const scrollPosition = closestThumbnailIdx * thumbnailWidth - container.clientWidth / 2 + thumbnailWidth / 2;
      container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  }, [currentIndex, displayThumbnails, isMobile]);

  // コントロールの自動非表示（再生中のみ）
  const handleMouseMove = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    }
  }, [isPlaying]);

  const progress = points.length > 1 ? Math.round((currentIndex / (points.length - 1)) * 100) : 0;

  const currentPoint = points[currentIndex];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile || isFullscreen}
      maxWidth={isMobile || isFullscreen ? false : "lg"}
      fullWidth={!isMobile && !isFullscreen}
      PaperProps={{
        ref: dialogRef,
        sx: {
          height: isMobile || isFullscreen ? '100%' : '85vh',
          bgcolor: 'grey.900',
          ...(isFullscreen && {
            maxWidth: '100%',
            maxHeight: '100%',
            margin: 0,
            borderRadius: 0,
          }),
        },
      }}
    >
      <DialogContent
        sx={{
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setControlsVisible(true)}
      >
        {/* ヘッダー */}
        <Fade in={controlsVisible}>
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <Box>
              <Typography variant="h6" color="white" fontWeight={600}>
                {route?.name}
              </Typography>
              <Typography variant="body2" color="grey.400">
                {route?.destination_name} ・ {route?.formatted_distance} ・{' '}
                {route?.formatted_duration}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title={showPlayer ? 'プレイヤーを隠す' : 'プレイヤーを表示'}>
                <IconButton onClick={() => setShowPlayer(!showPlayer)} sx={{ color: 'white' }}>
                  {showPlayer ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title={showThumbnails ? 'サムネイルを隠す' : 'サムネイルを表示'}>
                <IconButton onClick={() => setShowThumbnails(!showThumbnails)} sx={{ color: 'white' }}>
                  {showThumbnails ? <ArrowDownIcon /> : <ArrowUpIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title={isFullscreen ? '通常表示' : 'フルスクリーン'}>
                <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }}>
                  {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="閉じる">
                <IconButton onClick={onClose} sx={{ color: 'white' }}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Fade>

        {/* ストリートビュー表示エリア */}
        <Box ref={streetViewRef} sx={{ flex: 1, bgcolor: 'grey.900' }} />

        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <CircularProgress sx={{ color: 'white' }} />
          </Box>
        )}

        {/* コントロールバー */}
        <Fade in={controlsVisible && showPlayer}>
          <Paper
            elevation={4}
            sx={{
              position: 'absolute',
              bottom: showThumbnails ? (isMobile || isFullscreen ? 100 : 130) : 16,
              left: '50%',
              transform: 'translateX(-50%)',
              width: isMobile || isFullscreen ? 'calc(100% - 16px)' : 'calc(100% - 32px)',
              maxWidth: isMobile || isFullscreen ? 'none' : 600,
              borderRadius: 2,
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(8px)',
              transition: 'bottom 0.3s ease',
              zIndex: 1000,
            }}
          >
            <Box sx={{ p: isMobile ? 1.5 : 2 }}>
              {/* 進捗情報 */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant={isMobile ? 'caption' : 'body2'} color="grey.300">
                  {currentIndex + 1} / {points.length} ポイント
                </Typography>
                <Typography variant={isMobile ? 'caption' : 'body2'} color="grey.300">
                  進捗 {progress}%
                </Typography>
              </Box>

              {/* スライダー */}
              <Slider
                value={currentIndex}
                onChange={handleSliderChange}
                min={0}
                max={Math.max(0, points.length - 1)}
                step={1}
                sx={{
                  mb: 1,
                  color: 'white',
                  '& .MuiSlider-thumb': { bgcolor: 'white' },
                  '& .MuiSlider-track': { bgcolor: 'white' },
                  '& .MuiSlider-rail': { bgcolor: 'rgba(255,255,255,0.3)' },
                }}
              />

              {/* 再生コントロール */}
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: isMobile ? 0.5 : 1 }}>
                <Tooltip title="前へ (←)">
                  <span>
                    <IconButton
                      onClick={handlePrev}
                      disabled={currentIndex === 0}
                      size={isMobile ? 'medium' : 'large'}
                      sx={{ color: 'white', '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' } }}
                    >
                      <PrevIcon />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title={isPlaying ? '一時停止 (Space)' : '再生 (Space)'}>
                  <IconButton onClick={handlePlayPause} size="large" sx={{ color: 'white' }}>
                    {isPlaying ? <PauseIcon fontSize="large" /> : <PlayIcon fontSize="large" />}
                  </IconButton>
                </Tooltip>

                <Tooltip title="次へ (→)">
                  <span>
                    <IconButton
                      onClick={handleNext}
                      disabled={currentIndex >= points.length - 1}
                      size={isMobile ? 'medium' : 'large'}
                      sx={{ color: 'white', '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' } }}
                    >
                      <NextIcon />
                    </IconButton>
                  </span>
                </Tooltip>

                {/* 再生速度（モバイル・フルスクリーンでは非表示） */}
                {!isMobile && !isFullscreen && (
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 3, minWidth: 120 }}>
                    <Tooltip title="再生速度">
                      <SpeedIcon sx={{ mr: 1, color: 'grey.300', fontSize: 20 }} />
                    </Tooltip>
                    <Slider
                      value={playbackSpeed}
                      onChange={handleSpeedChange}
                      min={0.5}
                      max={3}
                      step={0.5}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(v) => `${v}x`}
                      sx={{
                        width: 80,
                        color: 'white',
                        '& .MuiSlider-thumb': { bgcolor: 'white' },
                        '& .MuiSlider-track': { bgcolor: 'white' },
                        '& .MuiSlider-rail': { bgcolor: 'rgba(255,255,255,0.3)' },
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>
        </Fade>

        {/* サムネイル一覧 */}
        <Fade in={showThumbnails && controlsVisible}>
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: isMobile || isFullscreen ? 80 : 110,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
              zIndex: 1000,
              pt: isMobile || isFullscreen ? 1 : 2,
            }}
          >
            <Box
              ref={thumbnailContainerRef}
              sx={{
                display: 'flex',
                gap: isMobile ? 0.5 : 1,
                overflowX: 'auto',
                px: isMobile ? 1 : 2,
                pb: 1,
                scrollBehavior: 'smooth',
                '&::-webkit-scrollbar': {
                  height: isMobile ? 4 : 6,
                },
                '&::-webkit-scrollbar-track': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                  borderRadius: 3,
                },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: 'rgba(255,255,255,0.3)',
                  borderRadius: 3,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.5)',
                  },
                },
              }}
            >
              {displayThumbnails.map((point, idx) => {
                const isActive = currentIndex === point.originalIndex;
                const thumbnailUrl = getStreetViewThumbnailUrl(point);

                return (
                  <Tooltip
                    key={idx}
                    title={`ポイント ${point.originalIndex + 1}`}
                    placement="top"
                  >
                    <Box
                      onClick={() => handleThumbnailClick(point.originalIndex)}
                      sx={{
                        flexShrink: 0,
                        width: isMobile ? 60 : 90,
                        height: isMobile ? 40 : 60,
                        borderRadius: 1,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: isActive ? '3px solid #1976d2' : '2px solid transparent',
                        boxShadow: isActive ? '0 0 10px rgba(25, 118, 210, 0.5)' : 'none',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        opacity: isActive ? 1 : 0.7,
                        '&:hover': {
                          opacity: 1,
                          transform: 'scale(1.05)',
                          border: isActive ? '3px solid #1976d2' : '2px solid rgba(255,255,255,0.5)',
                        },
                      }}
                    >
                      {thumbnailUrl ? (
                        <Box
                          component="img"
                          src={thumbnailUrl}
                          alt={`Point ${point.originalIndex + 1}`}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          loading="lazy"
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            bgcolor: 'grey.700',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant="caption" color="grey.400">
                            {point.originalIndex + 1}
                          </Typography>
                        </Box>
                      )}
                      {/* ポイント番号オーバーレイ */}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 2,
                          right: 4,
                          bgcolor: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          fontSize: '0.65rem',
                          px: 0.5,
                          borderRadius: 0.5,
                        }}
                      >
                        {point.originalIndex + 1}
                      </Box>
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
          </Box>
        </Fade>

        {/* 現在位置情報（モバイル・フルスクリーンでは非表示） */}
        {!isMobile && !isFullscreen && (
          <Fade in={controlsVisible}>
            <Box
              sx={{
                position: 'absolute',
                bottom: showThumbnails ? 220 : 100,
                left: 16,
                bgcolor: 'rgba(0,0,0,0.7)',
                color: 'white',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.75rem',
                transition: 'bottom 0.3s ease',
                zIndex: 1000,
              }}
            >
              {currentPoint?.lat.toFixed(6)}, {currentPoint?.lng.toFixed(6)} ・ 方位:{' '}
              {currentPoint?.heading?.toFixed(0)}°
            </Box>
          </Fade>
        )}
      </DialogContent>
    </Dialog>
  );
}
