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
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import muiTheme from '../theme/muiTheme';
import RoomInfoPanel from "../components/RoomDetail/RoomInfoPanel";
import RoomPhotosPanel from "../components/RoomDetail/RoomPhotosPanel";
import RoomVRTourPanel from "../components/RoomDetail/RoomVRTourPanel";
import BuildingPhotosPanel from "../components/RoomDetail/BuildingPhotosPanel";

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLgUp = useMediaQuery(muiTheme.breakpoints.up('lg'));

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 最大化状態の管理
  const [isRoomInfoMaximized, setIsRoomInfoMaximized] = useState(false);
  const [isPhotosMaximized, setIsPhotosMaximized] = useState(false);
  const [isVRTourMaximized, setIsVRTourMaximized] = useState(false);
  const [isBuildingPhotosMaximized, setIsBuildingPhotosMaximized] = useState(false);

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
      } else {
        alert('保存に失敗しました');
      }
    } catch (err) {
      console.error('保存エラー:', err);
      alert('ネットワークエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  const handleFormChange = (hasChanges) => {
    setHasUnsavedChanges(hasChanges);
  };

  const handleToggleRoomInfoMaximize = () => {
    setIsRoomInfoMaximized(!isRoomInfoMaximized);
  };

  const handleTogglePhotosMaximize = () => {
    setIsPhotosMaximized(!isPhotosMaximized);
  };

  const handleToggleVRTourMaximize = () => {
    setIsVRTourMaximized(!isVRTourMaximized);
  };

  const handleToggleBuildingPhotosMaximize = () => {
    setIsBuildingPhotosMaximized(!isBuildingPhotosMaximized);
  };

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
          <Toolbar variant="dense" sx={{ minHeight: '52px', py: 1 }}>
            <IconButton
              edge="start"
              onClick={() => navigate(`/property/${room.building_id}`)}
              sx={{
                mr: 2,
                color: 'white',
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" component="h1" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                {room.room_number}号室
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.8rem' }}>
                {room.building?.name}
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

      {/* メインコンテンツ - 3カラムグリッド */}
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
          sx={{
            display: 'grid',
            gridTemplateColumns: isLgUp ? '400px 1fr 400px' : '1fr',
            gap: 1,
            height: '100%',
            maxWidth: '100%',
            mx: 'auto',
          }}
        >
          {/* 左カラム: 部屋情報 */}
          <Paper elevation={3} sx={{
            borderRadius: 2,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gridRow: isLgUp ? 'span 2' : 'auto',
            minHeight: isLgUp ? 800 : 500,
            maxHeight: isLgUp ? 'none' : 700,
            ...(isRoomInfoMaximized && {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1300,
              maxHeight: '100vh',
              borderRadius: 0,
            }),
          }}>
            <RoomInfoPanel
              room={room}
              onSave={handleSave}
              loading={saving}
              isMaximized={isRoomInfoMaximized}
              onToggleMaximize={handleToggleRoomInfoMaximize}
              onFormChange={handleFormChange}
            />
          </Paper>

          {/* 中央カラム: 部屋写真 */}
          <Paper elevation={3} sx={{
            borderRadius: 2,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gridRow: isLgUp ? 'span 1' : 'auto',
            minHeight: isLgUp ? 400 : 300,
            ...(isPhotosMaximized && {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1300,
              maxHeight: '100vh',
              borderRadius: 0,
            }),
          }}>
            <RoomPhotosPanel
              roomId={room.id}
              onPhotosUpdate={handlePhotosUpdate}
              isMaximized={isPhotosMaximized}
              onToggleMaximize={handleTogglePhotosMaximize}
            />
          </Paper>

          {/* 中央カラム下: VRツアー */}
          <Paper elevation={3} sx={{
            borderRadius: 2,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gridRow: isLgUp ? 'span 1' : 'auto',
            minHeight: isLgUp ? 400 : 300,
            ...(isVRTourMaximized && {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1300,
              maxHeight: '100vh',
              borderRadius: 0,
            }),
          }}>
            <RoomVRTourPanel
              roomId={room.id}
              isMaximized={isVRTourMaximized}
              onToggleMaximize={handleToggleVRTourMaximize}
            />
          </Paper>

          {/* 右カラム: 建物外観 */}
          <Paper elevation={3} sx={{
            borderRadius: 2,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gridRow: isLgUp ? 'span 2' : 'auto',
            minHeight: isLgUp ? 800 : 500,
            maxHeight: isLgUp ? 'none' : 700,
            ...(isBuildingPhotosMaximized && {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1300,
              maxHeight: '100vh',
              borderRadius: 0,
            }),
          }}>
            <BuildingPhotosPanel
              buildingId={room.building_id}
              isMaximized={isBuildingPhotosMaximized}
              onToggleMaximize={handleToggleBuildingPhotosMaximize}
            />
          </Paper>
        </Box>
      </Box>
      </Box>
    </ThemeProvider>
  );
}
