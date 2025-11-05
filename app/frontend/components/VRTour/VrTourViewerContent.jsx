import React, { useState, useEffect } from "react";
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
  Alert
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  Menu as MenuIcon
} from "@mui/icons-material";
import PanoramaViewer from "./PanoramaViewer";
import MinimapDisplay from "./MinimapDisplay";

export default function VrTourViewerContent({
  vrTour,
  scenes,
  onClose,
  isPreview = false,
  roomId
}) {
  const navigate = useNavigate();
  const [currentScene, setCurrentScene] = useState(scenes.length > 0 ? scenes[0] : null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentViewAngle, setCurrentViewAngle] = useState(0);

  // シーンが変更されたら最初のシーンを設定
  useEffect(() => {
    if (scenes.length > 0 && !currentScene) {
      setCurrentScene(scenes[0]);
      setCurrentViewAngle(scenes[0]?.initial_view?.yaw || 0);
    }
  }, [scenes]);

  const handleMarkerClick = (marker) => {
    console.log('Marker clicked:', marker);

    // シーンリンクタイプの場合、対象シーンに移動
    if (marker.data?.type === 'scene_link' && marker.data?.target_scene_id) {
      const targetScene = scenes.find(s => s.id === parseInt(marker.data.target_scene_id));
      if (targetScene) {
        setCurrentScene(targetScene);
        setDrawerOpen(false);
      }
    }
  };

  const handleSceneSelect = (scene) => {
    setCurrentScene(scene);
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
        <Toolbar>
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
        {currentScene && currentScene.photo_url ? (
          <>
            <PanoramaViewer
              key={currentScene.id}
              imageUrl={currentScene.photo_url}
              initialView={currentScene.initial_view || { yaw: 0, pitch: 0 }}
              markers={currentScene.hotspots || []}
              editable={false}
              onMarkerClick={handleMarkerClick}
              onViewChange={handleViewChange}
              fullscreenContainerId={containerId}
            />

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
    </>
  );
}
