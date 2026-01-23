import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon
} from "@mui/icons-material";
import VrTourViewerContent from "../components/VRTour/VrTourViewerContent";

export default function VrTourViewer() {
  const { roomId, id } = useParams();
  const navigate = useNavigate();

  const [vrTour, setVrTour] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      }
    } catch (err) {
      console.error('シーン取得エラー:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ height: 'calc(100vh * var(--vh-correction, 1))', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !vrTour) {
    return (
      <Box sx={{ height: 'calc(100vh * var(--vh-correction, 1))', display: 'flex', flexDirection: 'column' }}>
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

  const handleClose = () => {
    navigate(-1); // 前のページに戻る
  };

  return (
    <VrTourViewerContent
      vrTour={vrTour}
      scenes={scenes}
      onClose={handleClose}
      isPreview={false}
    />
  );
}
