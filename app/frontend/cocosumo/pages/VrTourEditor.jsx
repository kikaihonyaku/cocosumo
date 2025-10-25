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
  IconButton,
  Snackbar,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  Public as PublicIcon,
  VisibilityOff as UnpublishIcon,
  ContentCopy as CopyIcon
} from "@mui/icons-material";
import SceneList from "../components/VRTour/SceneList";
import PanoramaViewer from "../components/VRTour/PanoramaViewer";
import HotspotEditor from "../components/VRTour/HotspotEditor";
import VrTourPreview from "../components/VRTour/VrTourPreview";
import MinimapEditor from "../components/VRTour/MinimapEditor";

export default function VrTourEditor() {
  const { roomId, id } = useParams();
  const navigate = useNavigate();
  const isNew = !id; // idが存在しない場合は新規作成

  const [vrTour, setVrTour] = useState({
    title: '',
    description: '',
    status: 'draft'
  });
  const [originalVrTour, setOriginalVrTour] = useState({
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
  const [editHotspotCallback, setEditHotspotCallback] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // 未保存変更の検出
  const hasUnsavedChanges =
    vrTour.title !== originalVrTour.title ||
    vrTour.description !== originalVrTour.description;

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
        setOriginalVrTour(data);
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
          setVrTour(data);
          setOriginalVrTour(data);
          setSnackbarMessage('基本情報を保存しました');
          setSnackbarOpen(true);
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

  const handleScenesChange = (updatedScenes) => {
    // SceneListから通知されたシーン一覧で更新
    setScenes(updatedScenes);
  };

  const handleUploadMinimap = async (file) => {
    if (!file) {
      // 画像を削除
      try {
        const formData = new FormData();
        formData.append('vr_tour[minimap_image]', '');

        const response = await fetch(`/api/v1/rooms/${roomId}/vr_tours/${id}`, {
          method: 'PATCH',
          credentials: 'include',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setVrTour(data);
          setOriginalVrTour(data);
        }
      } catch (err) {
        console.error('ミニマップ画像削除エラー:', err);
      }
      return;
    }

    try {
      const formData = new FormData();
      formData.append('vr_tour[minimap_image]', file);

      const response = await fetch(`/api/v1/rooms/${roomId}/vr_tours/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setVrTour(data);
        setOriginalVrTour(data);
        setSnackbarMessage('ミニマップ画像をアップロードしました');
        setSnackbarOpen(true);
      } else {
        alert('アップロードに失敗しました');
      }
    } catch (err) {
      console.error('アップロードエラー:', err);
      alert('ネットワークエラーが発生しました');
    }
  };

  const handleUpdateScenePosition = async (sceneId, updates) => {
    try {
      const response = await fetch(`/api/v1/vr_tours/${id}/vr_scenes/${sceneId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vr_scene: updates
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // シーンリストを更新
        setScenes(scenes.map(s => s.id === data.id ? data : s));
      }
    } catch (err) {
      console.error('シーン更新エラー:', err);
    }
  };

  const handlePublish = async () => {
    // バリデーション
    if (!vrTour.title) {
      setError('タイトルを設定してください');
      return;
    }
    if (scenes.length === 0) {
      setError('少なくとも1つのシーンを追加してください');
      return;
    }

    setPublishDialogOpen(true);
  };

  const confirmPublish = async () => {
    setPublishing(true);
    try {
      const response = await fetch(`/api/v1/rooms/${roomId}/vr_tours/${id}/publish`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVrTour(data.vr_tour);
        setOriginalVrTour(data.vr_tour);
        setPublishDialogOpen(false);
        setSnackbarMessage('VRツアーを公開しました');
        setSnackbarOpen(true);
      } else {
        const data = await response.json();
        setError(data.error || '公開に失敗しました');
      }
    } catch (err) {
      console.error('公開エラー:', err);
      setError('ネットワークエラーが発生しました');
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!confirm('VRツアーを非公開にしますか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/rooms/${roomId}/vr_tours/${id}/unpublish`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVrTour(data.vr_tour);
        setOriginalVrTour(data.vr_tour);
        setSnackbarMessage('VRツアーを非公開にしました');
        setSnackbarOpen(true);
      } else {
        const data = await response.json();
        setError(data.error || '非公開化に失敗しました');
      }
    } catch (err) {
      console.error('非公開化エラー:', err);
      setError('ネットワークエラーが発生しました');
    }
  };

  const copyPublicUrl = () => {
    const url = `${window.location.origin}/vr/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setSnackbarMessage('公開URLをコピーしました');
      setSnackbarOpen(true);
    });
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

          {/* ステータス表示 */}
          {!isNew && (
            <Chip
              label={vrTour.status === 'published' ? '公開中' : '下書き'}
              color={vrTour.status === 'published' ? 'success' : 'default'}
              icon={vrTour.status === 'published' ? <PublicIcon /> : <UnpublishIcon />}
              sx={{ mr: 2 }}
            />
          )}

          {/* プレビューボタン */}
          {!isNew && scenes.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={() => setPreviewOpen(true)}
              sx={{ mr: 2 }}
            >
              プレビュー
            </Button>
          )}

          {/* 公開/非公開ボタン */}
          {!isNew && vrTour.status === 'draft' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<PublicIcon />}
              onClick={handlePublish}
              sx={{ mr: 2 }}
            >
              公開する
            </Button>
          )}

          {!isNew && vrTour.status === 'published' && (
            <>
              <Button
                variant="outlined"
                startIcon={<CopyIcon />}
                onClick={copyPublicUrl}
                sx={{ mr: 1 }}
              >
                URLコピー
              </Button>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<UnpublishIcon />}
                onClick={handleUnpublish}
                sx={{ mr: 2 }}
              >
                非公開にする
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* メインコンテンツ */}
      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 2, mb: 2 }}>
          {hasUnsavedChanges && (
            <Alert severity="info" sx={{ mb: 1.5, py: 0.5 }}>
              未保存の変更があります
            </Alert>
          )}

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="ツアータイトル"
                value={vrTour.title}
                onChange={(e) => setVrTour({ ...vrTour, title: e.target.value })}
                required
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="説明"
                value={vrTour.description || ''}
                onChange={(e) => setVrTour({ ...vrTour, description: e.target.value })}
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving || !vrTour.title}
                color={hasUnsavedChanges ? 'primary' : 'inherit'}
              >
                {saving ? '保存中...' : '基本情報を保存'}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {!isNew && (
          <>
            <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} sx={{ mb: 2 }}>
              <Tab label="シーン編集" />
              <Tab label="ミニマップ" />
            </Tabs>

            {currentTab === 0 && (
              <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 300px)' }}>
                {/* 左：シーン一覧 */}
                <Paper sx={{ width: 280, flexShrink: 0 }}>
                  <SceneList
                    vrTourId={id}
                    roomId={roomId}
                    onSceneSelect={handleSceneSelect}
                    onSceneDelete={handleSceneDelete}
                    onScenesChange={handleScenesChange}
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
                            } else {
                              // 既存のホットスポットをクリックしたら編集ダイアログを開く
                              if (editHotspotCallback) {
                                editHotspotCallback(marker.id);
                              }
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
                  onHotspotEdit={(callback) => setEditHotspotCallback(() => callback)}
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

            {currentTab === 1 && (
              <Paper sx={{ height: 'calc(100vh - 300px)', overflow: 'hidden' }}>
                <MinimapEditor
                  vrTour={vrTour}
                  scenes={scenes}
                  onUpdateScene={handleUpdateScenePosition}
                  onUploadMinimap={handleUploadMinimap}
                />
              </Paper>
            )}
          </>
        )}

        {isNew && (
          <Alert severity="info">
            まず基本情報を保存してください。保存後、シーンの追加が可能になります。
          </Alert>
        )}
      </Container>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* VRツアープレビュー */}
      {!isNew && (
        <VrTourPreview
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          vrTour={vrTour}
          scenes={scenes}
        />
      )}

      {/* 公開確認ダイアログ */}
      <Dialog
        open={publishDialogOpen}
        onClose={() => !publishing && setPublishDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>VRツアーを公開しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            このVRツアーを公開すると、以下のURLで誰でもアクセスできるようになります。
          </DialogContentText>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              {`${window.location.origin}/vr/${id}`}
            </Typography>
          </Box>
          <DialogContentText sx={{ mt: 2 }}>
            ツアータイトル: <strong>{vrTour.title}</strong><br />
            シーン数: <strong>{scenes.length}</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishDialogOpen(false)} disabled={publishing}>
            キャンセル
          </Button>
          <Button
            onClick={confirmPublish}
            variant="contained"
            color="success"
            disabled={publishing}
            startIcon={publishing ? <CircularProgress size={20} /> : <PublicIcon />}
          >
            {publishing ? '公開中...' : '公開する'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
