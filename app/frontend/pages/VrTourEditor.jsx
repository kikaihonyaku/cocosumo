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
  Chip,
  ThemeProvider,
  useMediaQuery
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
import ComparisonPanoramaViewer from "../components/VRTour/ComparisonPanoramaViewer";
import HotspotEditor from "../components/VRTour/HotspotEditor";
import VrTourPreview from "../components/VRTour/VrTourPreview";
import MinimapEditor from "../components/VRTour/MinimapEditor";
import muiTheme from '../theme/muiTheme';

export default function VrTourEditor() {
  const { roomId, id } = useParams();
  const navigate = useNavigate();
  const isNew = !id; // idが存在しない場合は新規作成
  const isMdUp = useMediaQuery(muiTheme.breakpoints.up('md'));

  const [vrTour, setVrTour] = useState({
    title: '',
    description: '',
    status: 'draft',
    room: null
  });
  const [originalVrTour, setOriginalVrTour] = useState({
    title: '',
    description: '',
    status: 'draft',
    room: null
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
  const [currentTab, setCurrentTab] = useState(1);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // ペイン幅の管理
  const [leftPaneWidth, setLeftPaneWidth] = useState(280);
  const [rightPaneWidth, setRightPaneWidth] = useState(320);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

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

  // スプリッタバーのリサイズ処理
  const handleLeftMouseDown = (e) => {
    setIsResizingLeft(true);
    e.preventDefault();
  };

  const handleRightMouseDown = (e) => {
    setIsResizingRight(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      const containerRect = document.querySelector('.vr-editor-layout')?.getBoundingClientRect();
      if (!containerRect) return;

      if (isResizingLeft) {
        const newWidth = e.clientX - containerRect.left - 8;
        const clampedWidth = Math.max(200, Math.min(500, newWidth));
        setLeftPaneWidth(clampedWidth);
      }

      if (isResizingRight) {
        const newWidth = containerRect.right - e.clientX - 8;
        const clampedWidth = Math.max(250, Math.min(500, newWidth));
        setRightPaneWidth(clampedWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizingLeft, isResizingRight]);

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

  const handleSelectExistingPhoto = async (photoId) => {
    try {
      const response = await fetch(`/api/v1/rooms/${roomId}/vr_tours/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vr_tour: {
            minimap_room_photo_id: photoId
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setVrTour(data);
        setOriginalVrTour(data);
        setSnackbarMessage('ミニマップ画像を設定しました');
        setSnackbarOpen(true);
      } else {
        alert('設定に失敗しました');
      }
    } catch (err) {
      console.error('設定エラー:', err);
      alert('ネットワークエラーが発生しました');
    }
  };

  // ホットスポットのドラッグ完了ハンドラー
  const handleMarkerDragEnd = async (markerId, newPosition) => {
    if (!selectedScene) return;

    const updatedHotspots = (selectedScene.hotspots || []).map(h =>
      h.id === markerId
        ? { ...h, yaw: newPosition.yaw, pitch: newPosition.pitch }
        : h
    );

    // 通常のホットスポット変更として処理（再マウントされる）
    await handleHotspotsChange(updatedHotspots);
  };

  const handleUpdateScenePosition = async (sceneId, updates, skipSceneUpdate = false) => {
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

        // 一括保存中はシーンリストを更新しない（古いデータの混入を防ぐ）
        if (!skipSceneUpdate) {
          setScenes(prevScenes => prevScenes.map(s => s.id === data.id ? data : s));
        }
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
    const url = `${window.location.origin}/vr/${vrTour.public_id}`;
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
    <ThemeProvider theme={muiTheme}>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* ヘッダー */}
        <AppBar position="static" elevation={0} sx={{
          bgcolor: 'primary.main',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          borderRadius: '12px 12px 0 0',
        }}>
          <Toolbar variant="dense" sx={{ minHeight: 44 }}>
            <IconButton
              edge="start"
              onClick={() => navigate(`/room/${roomId}`)}
              sx={{ mr: 1, color: 'white' }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h6" component="h1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                {isNew ? '新規VRツアー作成' : (vrTour.title || 'VRツアー編集')}
              </Typography>
              {!isNew && vrTour.room && (
                <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.85rem' }}>
                  {vrTour.room.building?.name} - {vrTour.room.room_number}号室
                </Typography>
              )}
            </Box>

            {/* ステータス表示 */}
            {!isNew && (
              <Chip
                label={vrTour.status === 'published' ? '公開中' : '下書き'}
                color={vrTour.status === 'published' ? 'success' : 'default'}
                icon={vrTour.status === 'published' ? <PublicIcon /> : <UnpublishIcon />}
                sx={{ mr: { xs: 0.5, md: 2 }, display: { xs: 'none', sm: 'flex' } }}
              />
            )}

            {/* プレビューボタン */}
            {!isNew && scenes.length > 0 && (
              <Button
                variant="outlined"
                startIcon={isMdUp ? <VisibilityIcon /> : null}
                onClick={() => setPreviewOpen(true)}
                sx={{
                  mr: { xs: 0.5, md: 2 },
                  minWidth: { xs: 'auto', md: 'auto' },
                  px: { xs: 1, md: 2 },
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                {isMdUp ? 'プレビュー' : <VisibilityIcon />}
              </Button>
            )}

            {/* 公開/非公開ボタン */}
            {!isNew && vrTour.status === 'draft' && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={isMdUp ? <PublicIcon /> : null}
                onClick={handlePublish}
                sx={{
                  mr: { xs: 0, md: 2 },
                  minWidth: { xs: 'auto', md: 'auto' },
                  px: { xs: 1, md: 2 }
                }}
              >
                {isMdUp ? '公開する' : <PublicIcon />}
              </Button>
            )}

            {!isNew && vrTour.status === 'published' && (
              <>
                <Button
                  variant="outlined"
                  startIcon={isMdUp ? <CopyIcon /> : null}
                  onClick={copyPublicUrl}
                  sx={{
                    mr: { xs: 0.5, md: 1 },
                    minWidth: { xs: 'auto', md: 'auto' },
                    px: { xs: 1, md: 2 },
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  {isMdUp ? 'URLコピー' : <CopyIcon />}
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={isMdUp ? <UnpublishIcon /> : null}
                  onClick={handleUnpublish}
                  sx={{
                    mr: { xs: 0, md: 2 },
                    minWidth: { xs: 'auto', md: 'auto' },
                    px: { xs: 1, md: 2 },
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  {isMdUp ? '非公開にする' : <UnpublishIcon />}
                </Button>
              </>
            )}
          </Toolbar>
        </AppBar>

      {/* メインコンテンツ */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {error && (
          <Alert severity="error" sx={{ mx: 2, mt: 1 }}>
            {error}
          </Alert>
        )}

        <>
          {!isNew && (
            <Tabs
              value={currentTab}
              onChange={(e, v) => setCurrentTab(v)}
              sx={{
                px: 1,
                minHeight: 36,
                '& .MuiTab-root': {
                  minHeight: 36,
                  py: 0.5,
                  fontSize: '0.85rem',
                }
              }}
            >
              <Tab label="基本情報" />
              <Tab label="シーン編集" />
              <Tab label="ミニマップ" />
            </Tabs>
          )}

          {(isNew || currentTab === 0) && (
              <Box sx={{ p: 2, overflow: 'auto' }}>
                <Paper sx={{ p: 3, maxWidth: '1200px', mx: 'auto' }}>
                  {isNew && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      まず基本情報を保存してください。保存後、シーンの追加が可能になります。
                    </Alert>
                  )}

                  {!isNew && hasUnsavedChanges && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      未保存の変更があります
                    </Alert>
                  )}

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
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
                        label="説明"
                        value={vrTour.description || ''}
                        onChange={(e) => setVrTour({ ...vrTour, description: e.target.value })}
                        multiline
                        rows={4}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={saving || !vrTour.title}
                        color={hasUnsavedChanges ? 'primary' : 'inherit'}
                        size="large"
                      >
                        {saving ? '保存中...' : '基本情報を保存'}
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>
            )}

            {!isNew && currentTab === 1 && (
              <Box
                className="vr-editor-layout"
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  flex: 1,
                  p: 1,
                  overflow: 'hidden'
                }}
              >
                {/* 左：シーン一覧 */}
                <Paper sx={{
                  width: { xs: '100%', md: leftPaneWidth },
                  height: { xs: '200px', md: 'auto' },
                  flexShrink: 0,
                  overflow: 'auto'
                }}>
                  <SceneList
                    vrTourId={id}
                    roomId={roomId}
                    onSceneSelect={handleSceneSelect}
                    onSceneDelete={handleSceneDelete}
                    onScenesChange={handleScenesChange}
                  />
                </Paper>

                {/* 左スプリッタ */}
                {isMdUp && (
                  <Box
                    onMouseDown={handleLeftMouseDown}
                    sx={{
                      width: 6,
                      cursor: 'col-resize',
                      bgcolor: isResizingLeft ? 'primary.main' : 'transparent',
                      '&:hover': { bgcolor: 'primary.light' },
                      transition: 'background-color 0.2s',
                      flexShrink: 0,
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 2,
                        height: 40,
                        bgcolor: isResizingLeft ? 'primary.main' : 'grey.400',
                        borderRadius: 1,
                      },
                    }}
                  />
                )}

                {/* 中央：シーンプレビュー */}
                <Paper sx={{
                  flex: 1,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: { xs: '300px', md: 'auto' },
                  minWidth: 0,
                }}>
              {selectedScene ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{
                    px: 2,
                    py: 1.5,
                    borderBottom: '1px solid #e0e0e0'
                  }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {selectedScene.title}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
                    {selectedScene['virtual_staging_scene?'] && selectedScene.before_photo_url && selectedScene.after_photo_url ? (
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
                              360度ビュー上の任意の場所をクリックしてホットスポットを配置してください
                            </Typography>
                          </Box>
                        )}
                        <ComparisonPanoramaViewer
                          key={viewerKey}
                          beforeImageUrl={selectedScene.before_photo_url}
                          afterImageUrl={selectedScene.after_photo_url}
                          initialView={selectedScene.initial_view || { yaw: 0, pitch: 0 }}
                          markers={selectedScene.hotspots || []}
                          editable={true}
                          onMarkerClick={(marker) => {
                            if (marker.type === 'add') {
                              // ホットスポット追加モードの時のみ、クリックで追加
                              if (addingHotspot) {
                                setPendingPosition(marker.position);
                                setAddingHotspot(false);
                              }
                            } else {
                              // 既存のホットスポットをクリックしたら編集ダイアログを開く
                              if (editHotspotCallback) {
                                editHotspotCallback(marker.id);
                              }
                            }
                          }}
                          onMarkerDragEnd={handleMarkerDragEnd}
                        />
                      </>
                    ) : selectedScene.photo_url ? (
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
                          editable={true}
                          onMarkerClick={(marker) => {
                            if (marker.type === 'add') {
                              // ホットスポット追加モードの時のみ、クリックで追加
                              if (addingHotspot) {
                                setPendingPosition(marker.position);
                                setAddingHotspot(false);
                              }
                            } else {
                              // 既存のホットスポットをクリックしたら編集ダイアログを開く
                              if (editHotspotCallback) {
                                editHotspotCallback(marker.id);
                              }
                            }
                          }}
                          onMarkerDragEnd={handleMarkerDragEnd}
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
                <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
                  <Typography variant="body1" color="text.secondary">
                    左側のリストからシーンを選択してください
                  </Typography>
                </Box>
              )}
            </Paper>

                {/* 右スプリッタ */}
                {isMdUp && (
                  <Box
                    onMouseDown={handleRightMouseDown}
                    sx={{
                      width: 6,
                      cursor: 'col-resize',
                      bgcolor: isResizingRight ? 'primary.main' : 'transparent',
                      '&:hover': { bgcolor: 'primary.light' },
                      transition: 'background-color 0.2s',
                      flexShrink: 0,
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 2,
                        height: 40,
                        bgcolor: isResizingRight ? 'primary.main' : 'grey.400',
                        borderRadius: 1,
                      },
                    }}
                  />
                )}

            {/* 右：ホットスポットエディタ */}
            <Paper sx={{
              width: { xs: '100%', md: rightPaneWidth },
              height: { xs: '300px', md: 'auto' },
              flexShrink: 0,
              overflow: 'auto'
            }}>
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

            {!isNew && currentTab === 2 && (
              <Box sx={{ flex: 1, p: 1, overflow: 'hidden' }}>
                <Paper sx={{ height: '100%', overflow: 'hidden' }}>
                  <MinimapEditor
                    vrTour={vrTour}
                    scenes={scenes}
                    onUpdateScene={handleUpdateScenePosition}
                    onUploadMinimap={handleUploadMinimap}
                    onSelectExistingPhoto={handleSelectExistingPhoto}
                    onRefreshScenes={fetchScenes}
                  />
                </Paper>
              </Box>
            )}
        </>
      </Box>

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
              {`${window.location.origin}/vr/${vrTour.public_id || id}`}
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
    </ThemeProvider>
  );
}
