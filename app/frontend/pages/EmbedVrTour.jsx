import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import PanoramaViewer from "../components/VRTour/PanoramaViewer";

/**
 * VRツアー埋め込み用軽量ページ
 * 最小限のUIでVRツアーを表示
 */
export default function EmbedVrTour() {
  const { publicId } = useParams();
  const [searchParams] = useSearchParams();

  const [vrTour, setVrTour] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [currentScene, setCurrentScene] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const panoramaViewerRef = useRef(null);
  const autoplay = searchParams.get('autoplay') === 'true';

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
          setCurrentScene(data.vr_scenes[0]);
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

  // マーカークリック時のハンドラー
  const handleMarkerClick = (marker) => {
    if (marker.data?.type === 'scene_link' && marker.data?.target_scene_id) {
      const targetScene = scenes.find(s => s.id === parseInt(marker.data.target_scene_id));
      if (targetScene) {
        setCurrentScene(targetScene);
      }
    }
  };

  // ビューアーが準備完了したらオートプレイを開始
  const handleViewerReady = () => {
    if (autoplay && panoramaViewerRef.current) {
      panoramaViewerRef.current.startAutoRotate();
    }
  };

  if (loading) {
    return (
      <Box sx={{
        height: 'calc(100vh * var(--vh-correction, 1))',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: '#000'
      }}>
        <CircularProgress sx={{ color: 'white' }} />
      </Box>
    );
  }

  if (error || !vrTour || !currentScene) {
    return (
      <Box sx={{
        height: 'calc(100vh * var(--vh-correction, 1))',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: '#000',
        p: 4
      }}>
        <Alert severity="error">
          {error || 'VRツアーが見つかりません'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh * var(--vh-correction, 1))', width: '100vw', position: 'relative', bgcolor: '#000' }}>
      <PanoramaViewer
        ref={panoramaViewerRef}
        key={currentScene.id}
        imageUrl={currentScene.photo_url}
        initialView={currentScene.initial_view || { yaw: 0, pitch: 0 }}
        markers={currentScene.hotspots || []}
        editable={false}
        onMarkerClick={handleMarkerClick}
        onViewerReady={handleViewerReady}
        autoRotateSpeed={1}
      />

      {/* シーン情報（最小限） */}
      {scenes.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            px: 2,
            py: 1,
            borderRadius: 1,
            fontSize: '0.875rem',
            zIndex: 10
          }}
        >
          {currentScene.title} ({scenes.findIndex(s => s.id === currentScene.id) + 1}/{scenes.length})
        </Box>
      )}
    </Box>
  );
}
