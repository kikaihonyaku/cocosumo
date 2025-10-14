import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Container,
  Paper,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon
} from "@mui/icons-material";
import SceneList from "../components/VRTour/SceneList";
import PanoramaViewer from "../components/VRTour/PanoramaViewer";
import HotspotEditor from "../components/VRTour/HotspotEditor";

export default function VrTourEditor() {
  const { roomId, id } = useParams();
  const navigate = useNavigate();
  const isNew = !id; // idが存在しない場合は新規作成

  const [vrTour, setVrTour] = useState({
    title: '',
    description: '',
    status: 'draft'
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedScene, setSelectedScene] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [addingHotspot, setAddingHotspot] = useState(false);
  const [pendingPosition, setPendingPosition] = useState(null);
  const [viewerKey, setViewerKey] = useState(0);

  useEffect(() => {
    if (!isNew) {
      fetchVrTour();
      fetchScenes();
    }
  }, [roomId, id, isNew]);

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

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      console.log('handleSave - roomId:', roomId, 'id:', id, 'isNew:', isNew);

      const url = isNew
        ? `/api/v1/rooms/${roomId}/vr_tours`
        : `/api/v1/rooms/${roomId}/vr_tours/${id}`;

      const method = isNew ? 'POST' : 'PATCH';

      console.log('Request URL:', url, 'Method:', method);

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vr_tour: vrTour }),
      });

      if (response.ok) {
        const data = await response.json();
        if (isNew) {
          navigate(`/room/${roomId}/vr-tour/${data.id}/edit`);
        } else {
          alert('保存しました');
        }
      } else {
        const data = await response.json();
        setError(data.errors?.join(', ') || '保存に失敗しました');
      }
    } catch (err) {
      console.error('保存エラー:', err);
      setError('ネットワークエラーが発生しました');
    } finally {
      setSaving(false);
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
      }
    } catch (err) {
      console.error('シーン取得エラー:', err);
    }
  };

  const handleHotspotsChange = async (newHotspots) => {
    if (!selectedScene) return;

    try {
      const response = await fetch(`/api/v1/vr_tours/${id}/vr_scenes/${selectedScene.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vr_scene: {
            hotspots: newHotspots
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedScene(data);
        // シーンリストも更新
        setScenes(scenes.map(s => s.id === data.id ? data : s));
        // PanoramaViewerを強制的に再マウント
        setViewerKey(prev => prev + 1);
      } else {
        alert('ホットスポットの保存に失敗しました');
      }
    } catch (err) {
      console.error('ホットスポット保存エラー:', err);
      alert('ネットワークエラーが発生しました');
    }
  };

  const handleSceneSelect = (scene) => {
    setSelectedScene(scene);
    // シーンを切り替えたときもViewerを再マウント
    setViewerKey(prev => prev + 1);
  };

  const handleSceneDelete = (deletedSceneId) => {
    // 削除されたシーンが選択中だった場合、選択を解除
    if (selectedScene && selectedScene.id === deletedSceneId) {
      setSelectedScene(null);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
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
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {isNew ? '新規VRツアー作成' : 'VRツアー編集'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving || !vrTour.title}
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        </Toolbar>
      </AppBar>

      {/* メインコンテンツ */}
      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            基本情報
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ツアータイトル"
                value={vrTour.title}
                onChange={(e) => setVrTour({ ...vrTour, title: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="説明"
                value={vrTour.description || ''}
                onChange={(e) => setVrTour({ ...vrTour, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </Paper>

        {!isNew && (
          <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 250px)' }}>
            {/* 左：シーン一覧 */}
            <Paper sx={{ width: 280, flexShrink: 0 }}>
              <SceneList
                vrTourId={id}
                roomId={roomId}
                onSceneSelect={handleSceneSelect}
                onSceneDelete={handleSceneDelete}
              />
            </Paper>

            {/* 中央：シーンプレビュー */}
            <Paper sx={{ flex: 1, p: 3, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
              {selectedScene ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      {selectedScene.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      順序: {selectedScene.display_order || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
                    {selectedScene.photo_url ? (
                      <>
                        {addingHotspot && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 16,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              zIndex: 1000,
                              bgcolor: 'primary.main',
                              color: 'white',
                              px: 3,
                              py: 1,
                              borderRadius: 1,
                              boxShadow: 3
                            }}
                          >
                            <Typography variant="body2">
                              パノラマビューをクリックしてホットスポットの位置を設定してください
                            </Typography>
                          </Box>
                        )}
                        <PanoramaViewer
                          key={viewerKey}
                          imageUrl={selectedScene.photo_url}
                          initialView={selectedScene.initial_view || { yaw: 0, pitch: 0 }}
                          markers={selectedScene.hotspots || []}
                          editable={addingHotspot}
                          onMarkerClick={(marker) => {
                            if (marker.type === 'add') {
                              setPendingPosition(marker.position);
                              setAddingHotspot(false);
                            }
                          }}
                          onViewChange={(view) => {
                            // View change tracking if needed
                          }}
                        />
                      </>
                    ) : (
                      <Alert severity="warning">
                        このシーンには写真が設定されていません
                      </Alert>
                    )}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="body1" color="text.secondary">
                    左側のリストからシーンを選択してください
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* 右：ホットスポットエディタ */}
            <Paper sx={{ width: 320, flexShrink: 0 }}>
              {selectedScene ? (
                <HotspotEditor
                  hotspots={selectedScene.hotspots || []}
                  scenes={scenes}
                  currentSceneId={selectedScene.id}
                  onHotspotsChange={handleHotspotsChange}
                  onAddHotspotRequest={() => {
                    setAddingHotspot(true);
                    setPendingPosition(null);
                  }}
                  pendingPosition={pendingPosition}
                />
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    シーンを選択してください
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        )}

        {isNew && (
          <Alert severity="info">
            まず基本情報を保存してください。保存後、シーンの追加が可能になります。
          </Alert>
        )}
      </Container>
    </Box>
  );
}
