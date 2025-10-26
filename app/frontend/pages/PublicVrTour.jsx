import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Paper
} from "@mui/material";
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  LocationOn as LocationIcon
} from "@mui/icons-material";
import PanoramaViewer from "../components/VRTour/PanoramaViewer";
import MinimapDisplay from "../components/VRTour/MinimapDisplay";

export default function PublicVrTour() {
  const { id } = useParams();

  const [vrTour, setVrTour] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [currentScene, setCurrentScene] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentViewAngle, setCurrentViewAngle] = useState(0);

  useEffect(() => {
    fetchVrTour();
  }, [id]);

  const fetchVrTour = async () => {
    try {
      const response = await fetch(`/api/v1/vr_tours/${id}/public`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVrTour(data);

        // シーンを取得
        if (data.vr_scenes && data.vr_scenes.length > 0) {
          setScenes(data.vr_scenes);

          // 初期シーンを設定（initial_sceneまたは最初のシーン）
          const initialScene = data.initial_scene
            ? data.vr_scenes.find(s => s.id === data.initial_scene)
            : data.vr_scenes[0];

          setCurrentScene(initialScene || data.vr_scenes[0]);
        }
      } else if (response.status === 404) {
        setError('このVRツアーは公開されていないか、存在しません');
      } else {
        setError('VRツアーの取得に失敗しました');
      }
    } catch (err) {
      console.error('取得エラー:', err);
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#000' }}>
        <CircularProgress sx={{ color: 'white' }} />
      </Box>
    );
  }

  if (error || !vrTour) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#000' }}>
        <AppBar position="static" sx={{ bgcolor: 'rgba(0, 0, 0, 0.9)' }} elevation={0}>
          <Toolbar>
            <Typography variant="h6" color="white">VRツアー</Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
          <Alert severity="error" sx={{ maxWidth: 500 }}>
            {error || 'VRツアーが見つかりません'}
          </Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#000' }}>
      {/* ヘッダー */}
      <AppBar position="static" sx={{ bgcolor: 'rgba(0, 0, 0, 0.9)' }} elevation={0}>
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" color="white">{vrTour.title}</Typography>
            {vrTour.description && (
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {vrTour.description}
              </Typography>
            )}
          </Box>
          {scenes.length > 1 && (
            <IconButton
              color="inherit"
              onClick={() => setDrawerOpen(true)}
              sx={{ color: 'white' }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* VRビューア */}
      <Box sx={{ flex: 1, position: 'relative' }} id="vr-viewer-container">
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
              fullscreenContainerId="vr-viewer-container"
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

            {/* 物件情報 */}
            {vrTour.room && (
              <Paper
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  bgcolor: 'rgba(255, 255, 255, 0.95)',
                  px: 2,
                  py: 1.5,
                  borderRadius: 1,
                  zIndex: 10,
                  maxWidth: 300
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <LocationIcon fontSize="small" color="primary" sx={{ mt: 0.5 }} />
                  <Box>
                    {vrTour.room.building && (
                      <>
                        <Typography variant="body2" fontWeight="600">
                          {vrTour.room.building.name}
                        </Typography>
                        {vrTour.room.room_number && (
                          <Typography variant="body2" color="text.secondary">
                            {vrTour.room.room_number}号室
                          </Typography>
                        )}
                        {vrTour.room.building.address && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {vrTour.room.building.address}
                          </Typography>
                        )}
                      </>
                    )}
                  </Box>
                </Box>
              </Paper>
            )}

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
          <Box sx={{ px: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              シーン一覧
            </Typography>
            <IconButton size="small" onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
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
                    secondary={scene.description}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}
