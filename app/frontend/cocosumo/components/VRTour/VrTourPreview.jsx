import React, { useState } from "react";
import {
  Dialog,
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
  Close as CloseIcon,
  Menu as MenuIcon
} from "@mui/icons-material";
import PanoramaViewer from "./PanoramaViewer";

export default function VrTourPreview({ open, onClose, vrTour, scenes }) {
  const [currentScene, setCurrentScene] = useState(scenes.length > 0 ? scenes[0] : null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleMarkerClick = (marker) => {
    console.log('Preview marker clicked:', marker);

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

  // ダイアログが開かれるたびに最初のシーンに戻す
  React.useEffect(() => {
    if (open && scenes.length > 0) {
      setCurrentScene(scenes[0]);
    }
  }, [open, scenes]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: { bgcolor: '#000' }
      }}
    >
      {/* ヘッダー */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            onClick={onClose}
            sx={{ mr: 2 }}
          >
            <CloseIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">{vrTour.title}</Typography>
            {vrTour.description && (
              <Typography variant="caption" color="text.secondary">
                {vrTour.description}
              </Typography>
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
            プレビューモード
          </Typography>
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
              シーンを追加してからプレビューしてください。
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
    </Dialog>
  );
}
