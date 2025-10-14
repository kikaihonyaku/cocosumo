import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Divider
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Menu as MenuIcon
} from "@mui/icons-material";
import PanoramaViewer from "../components/VRTour/PanoramaViewer";

export default function VrTourViewer() {
  const { roomId, id } = useParams();
  const navigate = useNavigate();

  const [vrTour, setVrTour] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [currentScene, setCurrentScene] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetchVrTour();
    fetchScenes();
  }, [id]);

  const fetchVrTour = async () => {
    try {
      const response = await fetch(`/api/v1/rooms/${roomId}/vr_tours/${id}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVrTour(data);
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

  const fetchScenes = async () => {
    try {
      const response = await fetch(`/api/v1/vr_tours/${id}/vr_scenes`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setScenes(data);

        // 初期シーンを設定（最初のシーン）
        if (data.length > 0 && !currentScene) {
          setCurrentScene(data[0]);
        }
      }
    } catch (err) {
      console.error('シーン取得エラー:', err);
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

  if (loading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !vrTour) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <IconButton
              edge="start"
              onClick={() => navigate(`/room/${roomId}`)}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6">VRツアー</Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
          <Alert severity="error">{error || 'VRツアーが見つかりません'}</Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#000' }}>
      {/* ヘッダー */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => navigate(`/room/${roomId}`)}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">{vrTour.title}</Typography>
            {vrTour.description && (
              <Typography variant="caption" color="text.secondary">
                {vrTour.description}
              </Typography>
            )}
          </Box>
          {scenes.length > 0 && (
            <IconButton
              color="inherit"
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* VRビューア */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        {currentScene && currentScene.photo_url ? (
          <PanoramaViewer
            key={currentScene.id}
            imageUrl={currentScene.photo_url}
            initialView={currentScene.initial_view || { yaw: 0, pitch: 0 }}
            markers={currentScene.hotspots || []}
            editable={false}
            onMarkerClick={handleMarkerClick}
          />
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
              このVRツアーにはまだシーンが登録されていません。<br />
              編集画面からシーンを追加してください。
            </Alert>
          </Box>
        )}

        {/* 現在のシーン情報 */}
        {currentScene && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              px: 2,
              py: 1,
              borderRadius: 1
            }}
          >
            <Typography variant="body2">{currentScene.title}</Typography>
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
                    secondary={`順序: ${scene.display_order || 0}`}
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
