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
  Paper,
  Slide,
  CardMedia
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  Menu as MenuIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon
} from "@mui/icons-material";
import PanoramaViewer from "./PanoramaViewer";
import ComparisonPanoramaViewer from "./ComparisonPanoramaViewer";
import MinimapDisplay from "./MinimapDisplay";
import AutoplayControls from "./AutoplayControls";
import SharePanel from "../VirtualStaging/SharePanel";
import InfoHotspotPanel from "./InfoHotspotPanel";
import GyroscopeButton from "./GyroscopeButton";
import SceneTransition from "./SceneTransition";
import HotspotPreview from "./HotspotPreview";

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
  const [footerOpen, setFooterOpen] = useState(false);

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
  const [sceneDuration, setSceneDuration] = useState(10); // 秒
  const [rotateSpeed, setRotateSpeed] = useState(1);
  const [sceneProgress, setSceneProgress] = useState(0);

  // refs
  const panoramaViewerRef = useRef(null);
  const autoplayTimerRef = useRef(null);
  const progressTimerRef = useRef(null);

  // シーンが変更されたら最初のシーンを設定
  useEffect(() => {
    if (scenes.length > 0 && !currentScene) {
      setCurrentScene(scenes[0]);
      setCurrentViewAngle(scenes[0]?.initial_view?.yaw || 0);
    }
  }, [scenes]);

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 入力フィールドにフォーカスがある場合は無視
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'n':
        case 'N':
          // 次のシーン
          e.preventDefault();
          if (currentSceneIndex < scenes.length - 1) {
            changeSceneWithTransition(scenes[currentSceneIndex + 1]);
          }
          break;

        case 'ArrowLeft':
        case 'p':
        case 'P':
          // 前のシーン
          e.preventDefault();
          if (currentSceneIndex > 0) {
            changeSceneWithTransition(scenes[currentSceneIndex - 1]);
          }
          break;

        case ' ':
          // オートプレイの再生/一時停止
          e.preventDefault();
          setIsAutoPlaying(prev => !prev);
          break;

        case 'f':
        case 'F':
          // フルスクリーン切り替え
          e.preventDefault();
          const container = document.getElementById(containerId);
          if (container) {
            if (!document.fullscreenElement) {
              container.requestFullscreen?.();
            } else {
              document.exitFullscreen?.();
            }
          }
          break;

        case 'Escape':
          // ドロワーを閉じる / フルスクリーン終了
          if (drawerOpen) {
            setDrawerOpen(false);
          } else if (footerOpen) {
            setFooterOpen(false);
          }
          break;

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          // 数字キーでシーン直接ジャンプ
          const sceneNum = parseInt(e.key) - 1;
          if (sceneNum < scenes.length) {
            changeSceneWithTransition(scenes[sceneNum]);
          }
          break;

        case 'm':
        case 'M':
          // ミニマップの表示切り替え（将来の機能）
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSceneIndex, scenes, drawerOpen, footerOpen, containerId, changeSceneWithTransition]);

  // トランジション付きシーン変更
  const changeSceneWithTransition = useCallback((newScene) => {
    if (!newScene || newScene.id === currentScene?.id) return;

    setIsTransitioning(true);
    setNextSceneName(newScene.title || '');

    // トランジション表示後にシーンを切り替え
    setTimeout(() => {
      setCurrentScene(newScene);
      setCurrentViewAngle(newScene?.initial_view?.yaw || 0);
    }, 300);

    // トランジション終了
    setTimeout(() => {
      setIsTransitioning(false);
      setNextSceneName('');
    }, 800);
  }, [currentScene?.id]);

  // 現在のシーンのインデックスを取得
  const currentSceneIndex = scenes.findIndex(s => s.id === currentScene?.id);

  // 次のシーンへ移動
  const goToNextScene = useCallback(() => {
    const nextIndex = currentSceneIndex + 1;
    if (nextIndex < scenes.length) {
      changeSceneWithTransition(scenes[nextIndex]);
      setSceneProgress(0);
    } else {
      // 最後のシーンの場合、オートプレイを停止
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

  // オートプレイタイマー管理
  useEffect(() => {
    if (isAutoPlaying) {
      // プログレスバー更新用タイマー（100msごとに更新）
      progressTimerRef.current = setInterval(() => {
        setSceneProgress(prev => {
          const increment = (100 / sceneDuration) * 0.1; // 100ms分の進捗
          return Math.min(prev + increment, 100);
        });
      }, 100);

      // シーン切り替え用タイマー
      autoplayTimerRef.current = setTimeout(() => {
        goToNextScene();
      }, sceneDuration * 1000);

      // オートローテーション開始
      if (autoRotateEnabled && panoramaViewerRef.current) {
        panoramaViewerRef.current.startAutoRotate();
      }
    } else {
      // タイマークリア
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      if (autoplayTimerRef.current) {
        clearTimeout(autoplayTimerRef.current);
      }
      // オートローテーション停止
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
    // タイマーをリセット
    if (isAutoPlaying) {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      if (autoplayTimerRef.current) {
        clearTimeout(autoplayTimerRef.current);
      }

      // 新しいタイマーを開始
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

  // ジャイロスコープの切り替え
  const handleGyroscopeChange = useCallback(async (enabled) => {
    if (panoramaViewerRef.current) {
      if (enabled) {
        const success = await panoramaViewerRef.current.startGyroscope();
        if (success) {
          setGyroscopeEnabled(true);
          // ジャイロスコープ有効時はオートローテーションを停止
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
    // 少し遅延してからマーカー情報をクリア（フェードアウトのため）
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
    console.log('Marker clicked:', marker);
    // クリック時はプレビューを非表示
    setShowPreview(false);

    // 情報ホットスポットの場合、情報パネルを表示
    if (marker.data?.type === 'info') {
      setSelectedInfoHotspot(marker);
      setInfoHotspotOpen(true);
      return;
    }

    // シーンリンクタイプの場合、対象シーンに移動
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

  const containerId = isPreview ? "vr-preview-container" : "vr-viewer-container";

  return (
    <>
      {/* ヘッダー */}
      <AppBar
        position="absolute"
        elevation={3}
        sx={{
          bgcolor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 0,
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          zIndex: 10,
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 48 }}>
          {(onClose || roomId) && (
            <IconButton
              edge="start"
              onClick={handleBackClick}
              sx={{
                mr: 2,
                color: '#ffffff'
              }}
            >
              {isPreview ? <CloseIcon /> : <ArrowBackIcon />}
            </IconButton>
          )}
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h6"
              sx={{
                color: '#ffffff',
                fontWeight: 600
              }}
            >
              {vrTour.title}
            </Typography>
            {vrTour.description && (
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)'
                }}
              >
                {vrTour.description}
              </Typography>
            )}
          </Box>
          {isPreview && (
            <Typography
              variant="body2"
              sx={{
                mr: 2,
                color: 'rgba(255, 255, 255, 0.7)'
              }}
            >
              プレビューモード
            </Typography>
          )}
          {/* ジャイロスコープボタン（モバイルでのみ表示） */}
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
              sx={{
                color: '#ffffff'
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* VRビューア */}
      <Box sx={{ height: '100vh', width: '100%', position: 'relative' }} id={containerId}>
        {currentScene && (currentScene.photo_url || currentScene['virtual_staging_scene?']) ? (
          <>
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}>
              {currentScene['virtual_staging_scene?'] && currentScene.before_photo_url && currentScene.after_photo_url ? (
                <ComparisonPanoramaViewer
                  key={currentScene.id}
                  beforeImageUrl={currentScene.before_photo_url}
                  afterImageUrl={currentScene.after_photo_url}
                  initialView={currentScene.initial_view || { yaw: 0, pitch: 0 }}
                  fullscreenContainerId={containerId}
                  markers={currentScene.hotspots || []}
                  onMarkerClick={handleMarkerClick}
                  editable={false}
                />
              ) : (
                <PanoramaViewer
                  ref={panoramaViewerRef}
                  key={currentScene.id}
                  imageUrl={currentScene.photo_url}
                  initialView={currentScene.initial_view || { yaw: 0, pitch: 0 }}
                  markers={currentScene.hotspots || []}
                  editable={false}
                  onMarkerClick={handleMarkerClick}
                  onMarkerHover={handleMarkerHover}
                  onMarkerLeave={handleMarkerLeave}
                  onViewChange={handleViewChange}
                  fullscreenContainerId={containerId}
                  autoRotateSpeed={rotateSpeed}
                />
              )}
            </Box>

            {/* 現在のシーン情報 */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                bgcolor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                px: 2,
                py: 1,
                borderRadius: 1,
                zIndex: 10
              }}
            >
              <Typography variant="body2">{currentScene.title}</Typography>
            </Box>

            {/* ミニマップ */}
            <MinimapDisplay
              vrTour={vrTour}
              scenes={scenes}
              currentScene={currentScene}
              viewAngle={currentViewAngle}
              onSceneClick={handleSceneSelect}
            />

            {/* オートプレイコントロール */}
            {scenes.length > 1 && (
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
                sceneProgress={sceneProgress}
              />
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

        {/* シーンサムネイルフッター */}
        {scenes.length > 1 && (
          <>
            {/* サムネイル一覧 */}
            <Slide direction="up" in={footerOpen} mountOnEnter unmountOnExit>
              <Paper
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 140,
                  bgcolor: 'rgba(0, 0, 0, 0.9)',
                  backdropFilter: 'blur(10px)',
                  zIndex: 100,
                  display: 'flex',
                  alignItems: 'center',
                  px: 2
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    overflowX: 'auto',
                    width: '100%',
                    py: 2,
                    '&::-webkit-scrollbar': {
                      height: 8
                    },
                    '&::-webkit-scrollbar-track': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 1
                    },
                    '&::-webkit-scrollbar-thumb': {
                      bgcolor: 'rgba(255, 255, 255, 0.3)',
                      borderRadius: 1,
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.5)'
                      }
                    }
                  }}
                >
                  {scenes.map((scene, index) => (
                    <Box
                      key={scene.id}
                      onClick={() => handleSceneSelect(scene)}
                      sx={{
                        minWidth: 160,
                        cursor: 'pointer',
                        borderRadius: 1,
                        overflow: 'hidden',
                        border: currentScene?.id === scene.id ? '3px solid #FF5722' : '3px solid transparent',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: 3
                        }
                      }}
                    >
                      {scene.photo_url || scene.before_photo_url ? (
                        <CardMedia
                          component="img"
                          image={scene.photo_url || scene.before_photo_url}
                          alt={scene.title}
                          sx={{
                            width: 160,
                            height: 90,
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 160,
                            height: 90,
                            bgcolor: 'grey.800',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'grey.500'
                          }}
                        >
                          <Typography variant="caption">No Image</Typography>
                        </Box>
                      )}
                      <Box
                        sx={{
                          bgcolor: currentScene?.id === scene.id ? 'rgba(255, 87, 34, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                          px: 1,
                          py: 0.5
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'white',
                            fontWeight: currentScene?.id === scene.id ? 600 : 400,
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {index + 1}. {scene.title}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Slide>

            {/* 開閉ボタン */}
            <Paper
              sx={{
                position: 'absolute',
                bottom: footerOpen ? 140 : 0,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 110,
                borderRadius: '8px 8px 0 0',
                bgcolor: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(10px)',
                transition: 'bottom 0.3s ease',
                pointerEvents: 'auto'
              }}
            >
              <IconButton
                onClick={() => setFooterOpen(!footerOpen)}
                sx={{
                  color: 'white',
                  py: 0.5,
                  px: 2
                }}
              >
                {footerOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                <Typography variant="caption" sx={{ ml: 1, color: 'white' }}>
                  シーン ({scenes.length})
                </Typography>
              </IconButton>
            </Paper>
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

      {/* シーントランジション */}
      <SceneTransition
        show={isTransitioning}
        sceneName={nextSceneName}
        transitionType="fade"
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
