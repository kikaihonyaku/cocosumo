import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ThemeProvider,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  useMediaQuery,
  Snackbar,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import muiTheme from '../theme/muiTheme';
import RoomInfoPanel from "../components/RoomDetail/RoomInfoPanel";
import RoomPhotosPanel from "../components/RoomDetail/RoomPhotosPanel";
import RoomVRTourPanel from "../components/RoomDetail/RoomVRTourPanel";
import RoomVirtualStagingPanel from "../components/RoomDetail/RoomVirtualStagingPanel";
import RoomPropertyPublicationPanel from "../components/RoomDetail/RoomPropertyPublicationPanel";

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLgUp = useMediaQuery(muiTheme.breakpoints.up('lg'));

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // ペイン幅の管理
  const [leftPaneWidth, setLeftPaneWidth] = useState(400); // 左ペインの横幅
  const [rightPaneWidth, setRightPaneWidth] = useState(400); // 右ペインの横幅
  const [isResizingLeft, setIsResizingLeft] = useState(false); // 左側リサイズ中かどうか
  const [isResizingRight, setIsResizingRight] = useState(false); // 右側リサイズ中かどうか

  useEffect(() => {
    fetchRoom();
  }, [id]);

  const fetchRoom = async () => {
    try {
      const response = await fetch(`/api/v1/rooms/${id}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRoom(data);
      } else {
        setError('部屋情報の取得に失敗しました');
      }
    } catch (err) {
      console.error('取得エラー:', err);
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedData) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/v1/rooms/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ room: updatedData }),
      });

      if (response.ok) {
        const data = await response.json();
        setRoom(data);
        setHasUnsavedChanges(false);
        showSnackbar('部屋情報を保存しました', 'success');
      } else {
        showSnackbar('保存に失敗しました', 'error');
      }
    } catch (err) {
      console.error('保存エラー:', err);
      showSnackbar('ネットワークエラーが発生しました', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFormChange = (hasChanges) => {
    setHasUnsavedChanges(hasChanges);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // スプリッタバーのリサイズ処理（左側）
  const handleLeftMouseDown = (e) => {
    setIsResizingLeft(true);
    e.preventDefault();
  };

  // スプリッタバーのリサイズ処理（右側）
  const handleRightMouseDown = (e) => {
    setIsResizingRight(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      const containerRect = document.querySelector('.room-layout-container')?.getBoundingClientRect();
      if (!containerRect) return;

      if (isResizingLeft) {
        // 左ペインのリサイズ：左端からマウス位置までの距離を計算
        const newWidth = e.clientX - containerRect.left - 8;
        // 最小幅250px、最大幅600px
        const clampedWidth = Math.max(250, Math.min(600, newWidth));
        setLeftPaneWidth(clampedWidth);
      }

      if (isResizingRight) {
        // 右ペインのリサイズ：右端からマウス位置までの距離を計算
        const newWidth = containerRect.right - e.clientX - 8;
        // 最小幅250px、最大幅600px
        const clampedWidth = Math.max(250, Math.min(600, newWidth));
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

  const handlePhotosUpdate = () => {
    fetchRoom();
  };

  // ページ離脱時の警告
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (loading) {
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
          <CircularProgress size={60} />
        </Box>
      </ThemeProvider>
    );
  }

  if (error || !room) {
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default', gap: 2 }}>
          <Typography variant="h6" color="error">
            {error || '部屋が見つかりません'}
          </Typography>
          <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate('/buildings')}>
            物件一覧に戻る
          </Button>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
        {/* ヘッダー */}
        <AppBar position="static" elevation={0} sx={{
          bgcolor: 'primary.main',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          borderRadius: '12px 12px 0 0',
        }}>
          <Toolbar variant="dense" sx={{ minHeight: 52 }}>
            <IconButton
              edge="start"
              onClick={() => navigate(`/building/${room.building_id}`)}
              sx={{
                mr: 1,
                color: 'white',
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h6" component="h1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                {room.building?.name} - {room.room_number}号室
              </Typography>
            </Box>
            <Button
              color="inherit"
              onClick={() => window.close()}
              sx={{
                minWidth: 'auto',
                p: 1,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
              title="閉じる"
            >
              <CloseIcon />
            </Button>
          </Toolbar>
        </AppBar>

      {/* メインコンテンツ - Flexboxレイアウト */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 1,
          py: 1,
          bgcolor: 'grey.50'
        }}
      >
        <Box
          className="room-layout-container"
          sx={{
            display: isLgUp ? 'flex' : 'grid',
            flexDirection: 'row',
            gridTemplateColumns: '1fr',
            gap: 1,
            height: '100%',
            maxWidth: '100%',
            mx: 'auto',
          }}
        >
          {/* 左カラム: 部屋情報 */}
          <Paper elevation={3} sx={{
            width: isLgUp ? leftPaneWidth : 'auto',
            flexShrink: 0,
            borderRadius: 2,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minHeight: isLgUp ? 800 : 500,
            maxHeight: isLgUp ? 'none' : 700,
          }}>
            <RoomInfoPanel
              room={room}
              onSave={handleSave}
              loading={saving}
              onFormChange={handleFormChange}
            />
          </Paper>

          {/* 左スプリッタ */}
          {isLgUp && (
            <Box
              onMouseDown={handleLeftMouseDown}
              sx={{
                width: 6,
                cursor: 'col-resize',
                bgcolor: isResizingLeft ? 'primary.main' : 'transparent',
                '&:hover': {
                  bgcolor: 'primary.light',
                },
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

          {/* 中央カラム: 部屋写真 */}
          <Paper elevation={3} sx={{
            flex: isLgUp ? 1 : 'auto',
            minWidth: 0,
            borderRadius: 2,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minHeight: isLgUp ? 800 : 500,
            maxHeight: isLgUp ? 'none' : 700,
          }}>
            <RoomPhotosPanel
              roomId={room.id}
              buildingId={room.building?.id}
              buildingName={room.building?.name}
              roomNumber={room.room_number}
              onPhotosUpdate={handlePhotosUpdate}
            />
          </Paper>

          {/* 右スプリッタ */}
          {isLgUp && (
            <Box
              onMouseDown={handleRightMouseDown}
              sx={{
                width: 6,
                cursor: 'col-resize',
                bgcolor: isResizingRight ? 'primary.main' : 'transparent',
                '&:hover': {
                  bgcolor: 'primary.light',
                },
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

          {/* 右カラム: コンテナ */}
          <Box sx={{
            width: isLgUp ? rightPaneWidth : 'auto',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            minHeight: isLgUp ? 800 : 'auto',
          }}>
            {/* バーチャルステージング */}
            <Paper elevation={3} sx={{
              borderRadius: 2,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: isLgUp ? 0 : 350,
            }}>
              <RoomVirtualStagingPanel
                roomId={room.id}
              />
            </Paper>

            {/* VRツアー */}
            <Paper elevation={3} sx={{
              borderRadius: 2,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: isLgUp ? 0 : 350,
            }}>
              <RoomVRTourPanel
                roomId={room.id}
              />
            </Paper>

            {/* 物件公開ページ */}
            <Paper elevation={3} sx={{
              borderRadius: 2,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: isLgUp ? 0 : 350,
            }}>
              <RoomPropertyPublicationPanel
                roomId={room.id}
              />
            </Paper>
          </Box>
        </Box>
      </Box>
      </Box>

      {/* Snackbar通知 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
