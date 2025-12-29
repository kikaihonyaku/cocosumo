import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar
} from "@mui/material";
import VrTourViewerContent from "../components/VRTour/VrTourViewerContent";

export default function PublicVrTour() {
  const { publicId } = useParams();

  const [vrTour, setVrTour] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVrTour();
  }, [publicId]);

  const fetchVrTour = async () => {
    try {
      const response = await fetch(`/api/v1/vr_tours/${publicId}/public`, {
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

  // 現在のページのURLを取得
  const publicUrl = window.location.href;

  return (
    <Box sx={{ height: '100vh', position: 'relative', bgcolor: '#000' }}>
      <VrTourViewerContent
        vrTour={vrTour}
        scenes={scenes}
        isPreview={false}
        publicUrl={publicUrl}
      />
    </Box>
  );
}
