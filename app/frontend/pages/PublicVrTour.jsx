import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  Paper
} from "@mui/material";
import {
  LocationOn as LocationIcon
} from "@mui/icons-material";
import VrTourViewerContent from "../components/VRTour/VrTourViewerContent";

export default function PublicVrTour() {
  const { id } = useParams();

  const [vrTour, setVrTour] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVrTour();
  }, [id]);

  const fetchVrTour = async () => {
    try {
      const response = await fetch(`/api/v1/vr_tours/${id}/public`, {
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

  return (
    <Box sx={{ height: '100vh', position: 'relative', bgcolor: '#000' }}>
      <VrTourViewerContent
        vrTour={vrTour}
        scenes={scenes}
        isPreview={false}
      />

      {/* 物件情報 - VrTourViewerContentの上に重ねて表示 */}
      {vrTour?.room && (
        <Paper
          sx={{
            position: 'absolute',
            top: 80, // ヘッダーの下
            left: 16,
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            px: 2,
            py: 1.5,
            borderRadius: 1,
            zIndex: 11, // ヘッダーより上
            maxWidth: 300
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <LocationIcon fontSize="small" color="primary" sx={{ mt: 0.5 }} />
            <Box>
              {vrTour.room.building && (
                <>
                  <Typography variant="body2" fontWeight="600">
                    {vrTour.room.building.name}
                  </Typography>
                  {vrTour.room.room_number && (
                    <Typography variant="body2" color="text.secondary">
                      {vrTour.room.room_number}号室
                    </Typography>
                  )}
                  {vrTour.room.building.address && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {vrTour.room.building.address}
                    </Typography>
                  )}
                </>
              )}
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
