import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import RoomInfoPanel from "../components/RoomDetail/RoomInfoPanel";
import RoomPhotosPanel from "../components/RoomDetail/RoomPhotosPanel";
import RoomVRTourPanel from "../components/RoomDetail/RoomVRTourPanel";

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 最大化状態の管理
  const [isRoomInfoMaximized, setIsRoomInfoMaximized] = useState(false);
  const [isPhotosMaximized, setIsPhotosMaximized] = useState(false);
  const [isVRTourMaximized, setIsVRTourMaximized] = useState(false);

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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !room) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error || '部屋が見つかりません'}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/buildings')}
          sx={{ mt: 2 }}
        >
          物件一覧に戻る
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.50' }}>
      {/* ヘッダー */}
      <Box sx={{
        px: 3,
        py: 2,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/property/${room.building_id}`)}
          variant="outlined"
          size="small"
        >
          物件詳細に戻る
        </Button>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 600, flex: 1 }}>
          {room.room_number}号室 - {room.building?.name}
        </Typography>
      </Box>

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

          {/* 右カラム: 予約用 (今後の機能) */}
          <Paper elevation={3} sx={{
            borderRadius: 2,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gridRow: isLgUp ? 'span 2' : 'auto',
            minHeight: isLgUp ? 800 : 500,
            maxHeight: isLgUp ? 'none' : 700,
          }}>
            <Box sx={{ p: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                予約機能
              </Typography>
              <Typography variant="body2" color="text.secondary">
                近日実装予定
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
