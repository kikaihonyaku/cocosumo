import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  LinearProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Tooltip
} from "@mui/material";
import {
  Close as CloseIcon,
  ThreeSixty as PanoramaIcon
} from "@mui/icons-material";
import VrTourViewerContent from "../components/VRTour/VrTourViewerContent";

export default function PublicVrTour() {
  const { publicId } = useParams();
  const [searchParams] = useSearchParams();
  const isClosable = searchParams.get('closable') === 'true';

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
      <Box
        sx={{
          height: 'calc(100vh * var(--vh-correction, 1))',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: '#000',
          gap: 3,
        }}
      >
        {/* パルスアニメーション付きアイコン */}
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            bgcolor: 'rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'splash-pulse 2s ease-in-out infinite',
            '@keyframes splash-pulse': {
              '0%, 100%': {
                transform: 'scale(1)',
                boxShadow: '0 0 0 0 rgba(255, 255, 255, 0.15)',
              },
              '50%': {
                transform: 'scale(1.08)',
                boxShadow: '0 0 0 16px rgba(255, 255, 255, 0)',
              },
            },
          }}
        >
          <PanoramaIcon sx={{ fontSize: 36, color: 'rgba(255, 255, 255, 0.7)' }} />
        </Box>

        {/* プログレスバー */}
        <Box sx={{ width: 120 }}>
          <LinearProgress
            sx={{
              height: 2,
              borderRadius: 1,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'rgba(255, 255, 255, 0.5)',
                borderRadius: 1,
              },
            }}
          />
        </Box>

        <Typography
          variant="caption"
          sx={{ color: 'rgba(255, 255, 255, 0.4)', letterSpacing: 1 }}
        >
          VRツアーを準備中...
        </Typography>
      </Box>
    );
  }

  if (error || !vrTour) {
    return (
      <Box sx={{ height: 'calc(100vh * var(--vh-correction, 1))', display: 'flex', flexDirection: 'column', bgcolor: '#000' }}>
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

  const publicUrl = window.location.href;

  const handleClose = () => {
    window.close();
  };

  return (
    <Box sx={{ height: 'calc(100vh * var(--vh-correction, 1))', position: 'relative', bgcolor: '#000' }}>
      <VrTourViewerContent
        vrTour={vrTour}
        scenes={scenes}
        isPreview={false}
        publicUrl={publicUrl}
      />
      {isClosable && (
        <Tooltip title="閉じる">
          <IconButton
            aria-label="閉じる"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: 1000,
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.8)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
