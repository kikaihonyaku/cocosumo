import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Alert,
  Fade,
  CardMedia
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import PanoramaViewer from "./PanoramaViewer";
import MinimapDisplay from "./MinimapDisplay";
import AutoplayControls from "./AutoplayControls";
import SharePanel from "../VirtualStaging/SharePanel";
import InfoHotspotPanel from "./InfoHotspotPanel";
import GyroscopeButton from "./GyroscopeButton";
import SceneTransition from "./SceneTransition";
import HotspotPreview from "./HotspotPreview";
import useControlsAutoHide from "../../hooks/useControlsAutoHide";
import useSwipeNavigation from "../../hooks/useSwipeNavigation";

// ガラスモーフィズム共通スタイル
const glassStyle = {
  bgcolor: 'rgba(0, 0, 0, 0.4)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

export default function VrTourViewerContent({
  vrTour,
  scenes,
  onClose,
  isPreview = false,
  roomId,
  publicUrl = null,
}) {
  const navigate = useNavigate();
  const [currentScene, setCurrentScene] = useState(scenes.length > 0 ? scenes[0] : null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentViewAngle, setCurrentViewAngle] = useState(0);

  // ドットインジケーター / フィルムストリップ
  const [filmstripOpen, setFilmstripOpen] = useState(false);

  // 情報ホットスポット関連state
  const [infoHotspotOpen, setInfoHotspotOpen] = useState(false);
  const [selectedInfoHotspot, setSelectedInfoHotspot] = useState(null);

  // ジャイロスコープ関連state
  const [gyroscopeEnabled, setGyroscopeEnabled] = useState(false);

  // シーントランジション関連state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextSceneName, setNextSceneName] = useState('');

  // ホットスポットプレビュー関連state
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [showPreview, setShowPreview] = useState(false);

  // オートプレイ関連state
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoRotateEnabled, setAutoRotateEnabled] = useState(true);
  const [sceneDuration, setSceneDuration] = useState(10);
  const [rotateSpeed, setRotateSpeed] = useState(1);
  const [sceneProgress, setSceneProgress] = useState(0);

  // オートプレイ設定パネルstate
  const [settingsOpen, setSettingsOpen] = useState(false);

  // バーチャルステージング Before/After state
  const [showingBefore, setShowingBefore] = useState(false);

  // refs
  const panoramaViewerRef = useRef(null);
  const autoplayTimerRef = useRef(null);
  const progressTimerRef = useRef(null);

  // 自動再生バグ修正: stale closure回避用ref
  const isAutoPlayingRef = useRef(isAutoPlaying);
  isAutoPlayingRef.current = isAutoPlaying;
  const autoRotateEnabledRef = useRef(autoRotateEnabled);
  autoRotateEnabledRef.current = autoRotateEnabled;

  // currentSceneのref（changePanorama内で最新値を参照）
  const currentSceneRef = useRef(currentScene);
  currentSceneRef.current = currentScene;

  // コントロール自動非表示
  const preventHide = drawerOpen || filmstripOpen || infoHotspotOpen || settingsOpen;
  const { controlsVisible, showControls, containerHandlers } = useControlsAutoHide({ preventHide });

  // シーンが変更されたら最初のシーンを設定
  useEffect(() => {
    if (scenes.length > 0 && !currentScene) {
      setCurrentScene(scenes[0]);
      setCurrentViewAngle(scenes[0]?.initial_view?.yaw || 0);
    }
  }, [scenes]);

  // 現在のシーンのインデックスを取得
  const currentSceneIndex = scenes.findIndex(s => s.id === currentScene?.id);

  // コンテナID
  const containerId = isPreview ? "vr-preview-container" : "vr-viewer-container";

  // 現在のシーンがVSシーンかどうか
  const isVsScene = currentScene?.['virtual_staging_scene?'] && currentScene?.before_photo_url && currentScene?.after_photo_url;

  // VSシーンの現在表示中のURL
  const currentImageUrl = isVsScene
    ? (showingBefore ? currentScene.before_photo_url : currentScene.after_photo_url)
    : currentScene?.photo_url;

  // ネイティブクロスフェードでシーン変更
  const changeSceneWithTransition = useCallback((newScene) => {
    if (!newScene || newScene.id === currentSceneRef.current?.id) return;

    setIsTransitioning(true);
    setNextSceneName(newScene.title || '');

    // Before/Afterのリセット
    setShowingBefore(false);

    const imageUrl = (newScene['virtual_staging_scene?'] && newScene.after_photo_url)
      ? newScene.after_photo_url
      : newScene.photo_url;

    if (panoramaViewerRef.current && imageUrl) {
      const initialView = newScene.initial_view || {};
      panoramaViewerRef.current.changePanorama(imageUrl, {
        speed: 1500,
        effect: 'fade',
        yaw: initialView.yaw,
        pitch: initialView.pitch,
      }).then(() => {
        // マーカーはPanoramaViewer内のmarkers useEffectで更新される
        // オートローテーション再開
        if (isAutoPlayingRef.current && autoRotateEnabledRef.current && panoramaViewerRef.current) {
          panoramaViewerRef.current.startAutoRotate();
        }
      });
    }

    setCurrentScene(newScene);
    setCurrentViewAngle(newScene?.initial_view?.yaw || 0);

    // トースト表示後にフェードアウト
    setTimeout(() => {
      setIsTransitioning(false);
      setNextSceneName('');
    }, 1200);
  }, []);

  // Before/Afterトグル
  const toggleBeforeAfter = useCallback(() => {
    if (!isVsScene || !panoramaViewerRef.current) return;
    const newShowingBefore = !showingBefore;
    const newUrl = newShowingBefore ? currentScene.before_photo_url : currentScene.after_photo_url;
    panoramaViewerRef.current.changePanorama(newUrl, {
      speed: 1500,
      effect: 'fade',
    });
    setShowingBefore(newShowingBefore);
  }, [isVsScene, showingBefore, currentScene]);

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      showControls();

      switch (e.key) {
        case 'ArrowRight':
        case 'n':
        case 'N':
          e.preventDefault();
          if (currentSceneIndex < scenes.length - 1) {
            changeSceneWithTransition(scenes[currentSceneIndex + 1]);
          }
          break;

        case 'ArrowLeft':
        case 'p':
        case 'P':
          e.preventDefault();
          if (currentSceneIndex > 0) {
            changeSceneWithTransition(scenes[currentSceneIndex - 1]);
          }
          break;

        case ' ':
          e.preventDefault();
          setIsAutoPlaying(prev => !prev);
          break;

        case 'f':
        case 'F':
          e.preventDefault();
          {
            const container = document.getElementById(containerId);
            if (container) {
              if (!document.fullscreenElement) {
                container.requestFullscreen?.();
              } else {
                document.exitFullscreen?.();
              }
            }
          }
          break;

        case 'b':
        case 'B':
          // Before/Afterトグル
          if (isVsScene) {
            e.preventDefault();
            toggleBeforeAfter();
          }
          break;

        case 'Escape':
          if (drawerOpen) {
            setDrawerOpen(false);
          } else if (filmstripOpen) {
            setFilmstripOpen(false);
          }
          break;

        case '1': case '2': case '3': case '4': case '5':
        case '6': case '7': case '8': case '9':
          {
            const sceneNum = parseInt(e.key) - 1;
            if (sceneNum < scenes.length) {
              changeSceneWithTransition(scenes[sceneNum]);
            }
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSceneIndex, scenes, drawerOpen, filmstripOpen, containerId, changeSceneWithTransition, showControls, isVsScene, toggleBeforeAfter]);

  // 次のシーンへ移動
  const goToNextScene = useCallback(() => {
    const nextIndex = currentSceneIndex + 1;
    if (nextIndex < scenes.length) {
      changeSceneWithTransition(scenes[nextIndex]);
      setSceneProgress(0);
    } else {
      setIsAutoPlaying(false);
    }
  }, [currentSceneIndex, scenes, changeSceneWithTransition]);

  // 前のシーンへ移動
  const goToPrevScene = useCallback(() => {
    const prevIndex = currentSceneIndex - 1;
    if (prevIndex >= 0) {
      changeSceneWithTransition(scenes[prevIndex]);
      setSceneProgress(0);
    }
  }, [currentSceneIndex, scenes, changeSceneWithTransition]);

  // スワイプナビゲーション
  useSwipeNavigation({
    onSwipeLeft: goToNextScene,
    onSwipeRight: goToPrevScene,
    enabled: scenes.length > 1 && !gyroscopeEnabled,
  });

  // オートプレイタイマー管理
  useEffect(() => {
    if (isAutoPlaying) {
      progressTimerRef.current = setInterval(() => {
        setSceneProgress(prev => {
          const increment = (100 / sceneDuration) * 0.1;
          return Math.min(prev + increment, 100);
        });
      }, 100);

      autoplayTimerRef.current = setTimeout(() => {
        goToNextScene();
      }, sceneDuration * 1000);

      if (autoRotateEnabled && panoramaViewerRef.current) {
        panoramaViewerRef.current.startAutoRotate();
      }
    } else {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      if (autoplayTimerRef.current) {
        clearTimeout(autoplayTimerRef.current);
      }
      if (panoramaViewerRef.current) {
        panoramaViewerRef.current.stopAutoRotate();
      }
    }

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      if (autoplayTimerRef.current) {
        clearTimeout(autoplayTimerRef.current);
      }
    };
  }, [isAutoPlaying, sceneDuration, autoRotateEnabled, goToNextScene]);

  // シーンが変わったらプログレスリセット
  useEffect(() => {
    setSceneProgress(0);
    if (isAutoPlaying) {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      if (autoplayTimerRef.current) {
        clearTimeout(autoplayTimerRef.current);
      }

      progressTimerRef.current = setInterval(() => {
        setSceneProgress(prev => {
          const increment = (100 / sceneDuration) * 0.1;
          return Math.min(prev + increment, 100);
        });
      }, 100);

      autoplayTimerRef.current = setTimeout(() => {
        goToNextScene();
      }, sceneDuration * 1000);
    }
  }, [currentScene?.id]);

  // オートローテーションのトグル
  const handleToggleAutoRotate = useCallback(() => {
    setAutoRotateEnabled(prev => {
      const newValue = !prev;
      if (panoramaViewerRef.current) {
        if (newValue && isAutoPlaying) {
          panoramaViewerRef.current.startAutoRotate();
        } else {
          panoramaViewerRef.current.stopAutoRotate();
        }
      }
      return newValue;
    });
  }, [isAutoPlaying]);

  // 回転速度の変更
  const handleRotateSpeedChange = useCallback((speed) => {
    setRotateSpeed(speed);
    if (panoramaViewerRef.current) {
      panoramaViewerRef.current.setAutoRotateSpeed(speed);
    }
  }, []);

  // ビューア準備完了時のコールバック
  const handleViewerReady = useCallback(() => {
    if (isAutoPlayingRef.current && autoRotateEnabledRef.current && panoramaViewerRef.current) {
      panoramaViewerRef.current.startAutoRotate();
    }
    if (panoramaViewerRef.current && rotateSpeed !== 1) {
      panoramaViewerRef.current.setAutoRotateSpeed(rotateSpeed);
    }
  }, [rotateSpeed]);

  // ジャイロスコープの切り替え
  const handleGyroscopeChange = useCallback(async (enabled) => {
    if (panoramaViewerRef.current) {
      if (enabled) {
        const success = await panoramaViewerRef.current.startGyroscope();
        if (success) {
          setGyroscopeEnabled(true);
          if (isAutoPlaying) {
            setIsAutoPlaying(false);
          }
        }
      } else {
        panoramaViewerRef.current.stopGyroscope();
        setGyroscopeEnabled(false);
      }
    }
  }, [isAutoPlaying]);

  // ホットスポットホバーハンドラー
  const handleMarkerHover = useCallback((marker, position) => {
    setHoveredMarker(marker);
    setPreviewPosition(position);
    setShowPreview(true);
  }, []);

  // ホットスポットリーブハンドラー
  const handleMarkerLeave = useCallback(() => {
    setShowPreview(false);
    setTimeout(() => {
      setHoveredMarker(null);
    }, 200);
  }, []);

  // ターゲットシーンを取得
  const getTargetScene = useCallback((marker) => {
    if (marker?.data?.type === 'scene_link' && marker?.data?.target_scene_id) {
      return scenes.find(s => s.id === parseInt(marker.data.target_scene_id));
    }
    return null;
  }, [scenes]);

  const handleMarkerClick = (marker) => {
    setShowPreview(false);

    if (marker.data?.type === 'info') {
      setSelectedInfoHotspot(marker);
      setInfoHotspotOpen(true);
      return;
    }

    if (marker.data?.type === 'scene_link' && marker.data?.target_scene_id) {
      const targetScene = scenes.find(s => s.id === parseInt(marker.data.target_scene_id));
      if (targetScene) {
        changeSceneWithTransition(targetScene);
        setDrawerOpen(false);
      }
    }
  };

  const handleSceneSelect = (scene) => {
    changeSceneWithTransition(scene);
    setDrawerOpen(false);
    setFilmstripOpen(false);
  };

  const handleViewChange = (view) => {
    setCurrentViewAngle(view.yaw);
  };

  const handleBackClick = () => {
    if (onClose) {
      onClose();
    } else if (roomId) {
      navigate(`/room/${roomId}`);
    }
  };

  // 初回表示用のimageUrl（key不使用、remountしない）
  // useState初期化関数で一度だけ計算。以降のシーン変更はchangePanoramaで行うため
  // このURLが変わるとPanoramaViewerのuseEffectがビューアを再作成してしまう
  const [initialImageUrl] = useState(() => {
    if (!currentScene) return null;
    const isVs = currentScene['virtual_staging_scene?'] && currentScene.before_photo_url && currentScene.after_photo_url;
    return isVs ? currentScene.after_photo_url : currentScene.photo_url;
  });

  return (
    <>
      {/* ヘッダー */}
      <Fade in={controlsVisible} timeout={400}>
        <AppBar
          position="absolute"
          elevation={0}
          sx={{
            ...glassStyle,
            borderRadius: 0,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            zIndex: 10,
          }}
        >
          <Toolbar variant="dense" sx={{ minHeight: 48 }}>
            {(onClose || roomId) && (
              <IconButton
                edge="start"
                onClick={handleBackClick}
                sx={{ mr: 2, color: '#ffffff' }}
              >
                {isPreview ? <CloseIcon /> : <ArrowBackIcon />}
              </IconButton>
            )}
            <Box sx={{ flexGrow: 1 }}>
              <Typography
                variant="h6"
                sx={{ color: '#ffffff', fontWeight: 600, fontSize: '1rem' }}
              >
                {vrTour.title}
              </Typography>
              {vrTour.description && (
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
                >
                  {vrTour.description}
                </Typography>
              )}
            </Box>
            {isPreview && (
              <Typography
                variant="body2"
                sx={{ mr: 2, color: 'rgba(255, 255, 255, 0.6)' }}
              >
                プレビューモード
              </Typography>
            )}
            <GyroscopeButton
              gyroscopeEnabled={gyroscopeEnabled}
              onGyroscopeChange={handleGyroscopeChange}
            />
            {publicUrl && !isPreview && (
              <SharePanel
                publicUrl={publicUrl}
                title={vrTour.title || 'VRツアー'}
                variant="icon"
              />
            )}
            {scenes.length > 0 && (
              <IconButton
                onClick={() => setDrawerOpen(true)}
                sx={{ color: '#ffffff' }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Toolbar>
        </AppBar>
      </Fade>

      {/* トッププログレスライン（オートプレイ中のみ） */}
      {isAutoPlaying && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            zIndex: 11,
            bgcolor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <Box
            sx={{
              height: '100%',
              bgcolor: 'rgba(255, 255, 255, 0.6)',
              width: `${sceneProgress}%`,
              transition: 'width 100ms linear',
            }}
          />
        </Box>
      )}

      {/* VRビューア */}
      <Box
        sx={{
          height: 'calc(100vh * var(--vh-correction, 1))',
          width: '100%',
          position: 'relative',
          '& .psv-navbar': {
            opacity: controlsVisible ? 1 : 0,
            transition: 'opacity 400ms ease',
          },
        }}
        id={containerId}
        {...containerHandlers}
      >
        {currentScene && (currentScene.photo_url || isVsScene) ? (
          <>
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}>
              <PanoramaViewer
                ref={panoramaViewerRef}
                imageUrl={initialImageUrl}
                initialView={currentScene.initial_view || { yaw: 0, pitch: 0 }}
                markers={currentScene.hotspots || []}
                editable={false}
                onMarkerClick={handleMarkerClick}
                onMarkerHover={handleMarkerHover}
                onMarkerLeave={handleMarkerLeave}
                onViewChange={handleViewChange}
                onViewerReady={handleViewerReady}
                fullscreenContainerId={containerId}
                autoRotateSpeed={rotateSpeed}
              />
            </Box>

            {/* ビネットオーバーレイ */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 2,
                pointerEvents: 'none',
                background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.25) 100%)',
              }}
            />

            {/* 現在のシーン情報 */}
            <Fade in={controlsVisible} timeout={400}>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: scenes.length > 1 ? 56 : 16,
                  left: 16,
                  ...glassStyle,
                  px: 2,
                  py: 0.75,
                  borderRadius: 1.5,
                  zIndex: 10,
                }}
              >
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, fontSize: '0.8rem' }}>
                  {currentScene.title}
                </Typography>
              </Box>
            </Fade>

            {/* VS Before/After トグル */}
            {isVsScene && (
              <Fade in={controlsVisible} timeout={400}>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: scenes.length > 1 ? 56 : 16,
                    right: 16,
                    zIndex: 10,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      ...glassStyle,
                      borderRadius: 3,
                      overflow: 'hidden',
                      p: 0.5,
                    }}
                  >
                    <Box
                      onClick={() => { if (!showingBefore) toggleBeforeAfter(); }}
                      sx={{
                        px: 2,
                        py: 0.75,
                        borderRadius: 2.5,
                        cursor: 'pointer',
                        bgcolor: showingBefore ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                        transition: 'all 0.2s ease',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                      }}
                    >
                      <Typography variant="caption" sx={{ color: 'white', fontWeight: showingBefore ? 600 : 400, fontSize: '0.75rem' }}>
                        Before
                      </Typography>
                    </Box>
                    <Box
                      onClick={() => { if (showingBefore) toggleBeforeAfter(); }}
                      sx={{
                        px: 2,
                        py: 0.75,
                        borderRadius: 2.5,
                        cursor: 'pointer',
                        bgcolor: !showingBefore ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                        transition: 'all 0.2s ease',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                      }}
                    >
                      <Typography variant="caption" sx={{ color: 'white', fontWeight: !showingBefore ? 600 : 400, fontSize: '0.75rem' }}>
                        After
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Fade>
            )}

            {/* ミニマップ */}
            <Fade in={controlsVisible} timeout={400}>
              <Box>
                <MinimapDisplay
                  vrTour={vrTour}
                  scenes={scenes}
                  currentScene={currentScene}
                  viewAngle={currentViewAngle}
                  onSceneClick={handleSceneSelect}
                />
              </Box>
            </Fade>

            {/* オートプレイコントロール */}
            {scenes.length > 1 && (
              <Fade in={controlsVisible} timeout={400}>
                <Box>
                  <AutoplayControls
                    isPlaying={isAutoPlaying}
                    onPlayPause={() => setIsAutoPlaying(!isAutoPlaying)}
                    onNext={goToNextScene}
                    onPrev={goToPrevScene}
                    currentSceneIndex={currentSceneIndex}
                    totalScenes={scenes.length}
                    autoRotateEnabled={autoRotateEnabled}
                    onToggleAutoRotate={handleToggleAutoRotate}
                    sceneDuration={sceneDuration}
                    onSceneDurationChange={setSceneDuration}
                    rotateSpeed={rotateSpeed}
                    onRotateSpeedChange={handleRotateSpeedChange}
                    settingsOpen={settingsOpen}
                    onSettingsToggle={setSettingsOpen}
                  />
                </Box>
              </Fade>
            )}
          </>
        ) : scenes.length > 0 ? (
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            maxWidth: 500
          }}>
            <Alert severity="warning">
              このシーンには写真が設定されていません
            </Alert>
          </Box>
        ) : (
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            maxWidth: 500
          }}>
            <Alert severity="info">
              このVRツアーにはまだシーンが登録されていません。
            </Alert>
          </Box>
        )}

        {/* ドットインジケーター + フィルムストリップ */}
        {scenes.length > 1 && (
          <>
            {/* フィルムストリップ（ドットの上に展開） */}
            <Fade in={filmstripOpen && controlsVisible} timeout={300}>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 44,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 100,
                  ...glassStyle,
                  borderRadius: 2,
                  p: 1,
                  maxWidth: 'calc(100vw - 32px)',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    overflowX: 'auto',
                    '&::-webkit-scrollbar': { height: 4 },
                    '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                    '&::-webkit-scrollbar-thumb': {
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: 2,
                    },
                  }}
                >
                  {scenes.map((scene, index) => (
                    <Box
                      key={scene.id}
                      onClick={() => handleSceneSelect(scene)}
                      sx={{
                        minWidth: 80,
                        cursor: 'pointer',
                        borderRadius: 1,
                        overflow: 'hidden',
                        border: currentScene?.id === scene.id
                          ? '2px solid rgba(255, 255, 255, 0.8)'
                          : '2px solid transparent',
                        transition: 'all 0.2s ease',
                        opacity: currentScene?.id === scene.id ? 1 : 0.7,
                        '&:hover': {
                          opacity: 1,
                          transform: 'scale(1.05)',
                        },
                      }}
                    >
                      {(scene.photo_url || scene.before_photo_url) ? (
                        <CardMedia
                          component="img"
                          image={scene.photo_url || scene.before_photo_url}
                          alt={scene.title}
                          sx={{ width: 80, height: 48, objectFit: 'cover' }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 80,
                            height: 48,
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.6rem' }}>
                            No Image
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Fade>

            {/* ドットインジケーター */}
            <Fade in={controlsVisible} timeout={400}>
              <Box
                onClick={() => setFilmstripOpen(prev => !prev)}
                sx={{
                  position: 'absolute',
                  bottom: 12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 100,
                  ...glassStyle,
                  borderRadius: 3,
                  px: 1.5,
                  py: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                  },
                }}
              >
                {scenes.map((scene, index) => (
                  <Box
                    key={scene.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSceneSelect(scene);
                    }}
                    sx={{
                      width: currentScene?.id === scene.id ? 20 : 8,
                      height: 8,
                      borderRadius: 4,
                      bgcolor: currentScene?.id === scene.id
                        ? 'rgba(255, 255, 255, 0.9)'
                        : 'rgba(255, 255, 255, 0.4)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.7)',
                      },
                    }}
                  />
                ))}
              </Box>
            </Fade>
          </>
        )}
      </Box>

      {/* シーン選択ドロワー */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 280, pt: 2 }}>
          <Typography variant="h6" sx={{ px: 2, mb: 2 }}>
            シーン一覧
          </Typography>
          <Divider />
          <List>
            {scenes.map((scene) => (
              <ListItem key={scene.id} disablePadding>
                <ListItemButton
                  selected={currentScene?.id === scene.id}
                  onClick={() => handleSceneSelect(scene)}
                >
                  <ListItemText
                    primary={scene.title}
                    secondary={`順序: ${(scene.display_order || 0) + 1}`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* 情報ホットスポットパネル */}
      <InfoHotspotPanel
        open={infoHotspotOpen}
        onClose={() => setInfoHotspotOpen(false)}
        hotspot={selectedInfoHotspot}
      />

      {/* シーントランジション（トースト） */}
      <SceneTransition
        show={isTransitioning}
        sceneName={nextSceneName}
      />

      {/* ホットスポットプレビュー */}
      <HotspotPreview
        show={showPreview}
        marker={hoveredMarker}
        targetScene={getTargetScene(hoveredMarker)}
        position={previewPosition}
      />
    </>
  );
}
