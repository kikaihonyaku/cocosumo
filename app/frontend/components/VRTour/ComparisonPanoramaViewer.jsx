import React, { useEffect, useRef, useState } from "react";
import { Viewer } from "@photo-sphere-viewer/core";
import "@photo-sphere-viewer/core/index.css";
import { Box, CircularProgress, Alert, Typography } from "@mui/material";

export default function ComparisonPanoramaViewer({
  beforeImageUrl,
  afterImageUrl,
  initialView = { yaw: 0, pitch: 0 },
  fullscreenContainerId = null
}) {
  const beforeContainerRef = useRef(null);
  const afterContainerRef = useRef(null);
  const beforeViewerRef = useRef(null);
  const afterViewerRef = useRef(null);
  const sliderRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const syncSetupRef = useRef(false); // 同期が設定済みかどうか

  // ビューアーを初期化
  useEffect(() => {
    if (!beforeContainerRef.current || !afterContainerRef.current || !beforeImageUrl || !afterImageUrl) {
      return;
    }

    setLoading(true);
    setError("");
    syncSetupRef.current = false;

    let loadedCount = 0;
    const totalImages = 2;

    const checkBothLoaded = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        initializeViewers();
      }
    };

    // 両方の画像の読み込みをテスト
    const beforeImg = new Image();
    beforeImg.onload = checkBothLoaded;
    beforeImg.onerror = () => {
      setError('Before画像の読み込みに失敗しました');
      setLoading(false);
    };
    beforeImg.src = beforeImageUrl;

    const afterImg = new Image();
    afterImg.onload = checkBothLoaded;
    afterImg.onerror = () => {
      setError('After画像の読み込みに失敗しました');
      setLoading(false);
    };
    afterImg.src = afterImageUrl;

    const initializeViewers = () => {
      try {
        if (!beforeContainerRef.current || !afterContainerRef.current) {
          setLoading(false);
          return;
        }

        // Beforeビューアーを作成
        const beforeViewer = new Viewer({
          container: beforeContainerRef.current,
          panorama: beforeImageUrl,
          defaultYaw: initialView.yaw || 0,
          defaultPitch: initialView.pitch || 0,
          navbar: false, // ナビゲーションバーを非表示
        });

        // Afterビューアーを作成
        const afterViewer = new Viewer({
          container: afterContainerRef.current,
          panorama: afterImageUrl,
          defaultYaw: initialView.yaw || 0,
          defaultPitch: initialView.pitch || 0,
          navbar: false,
        });

        beforeViewerRef.current = beforeViewer;
        afterViewerRef.current = afterViewer;

        let readyCount = 0;
        let isUpdatingBefore = false;
        let isUpdatingAfter = false;
        let isZoomingBefore = false;
        let isZoomingAfter = false;

        const setupViewSync = () => {
          if (syncSetupRef.current) return;
          syncSetupRef.current = true;

          if (!beforeViewer || !afterViewer) return;

          // Beforeビューアーの視点変更をAfterに同期
          beforeViewer.addEventListener('position-updated', (e) => {
            if (isUpdatingAfter) return;
            isUpdatingBefore = true;
            afterViewer.rotate({
              yaw: e.position.yaw,
              pitch: e.position.pitch
            });
            setTimeout(() => { isUpdatingBefore = false; }, 0);
          });

          // Afterビューアーの視点変更をBeforeに同期
          afterViewer.addEventListener('position-updated', (e) => {
            if (isUpdatingBefore) return;
            isUpdatingAfter = true;
            beforeViewer.rotate({
              yaw: e.position.yaw,
              pitch: e.position.pitch
            });
            setTimeout(() => { isUpdatingAfter = false; }, 0);
          });

          // ズームを同期
          beforeViewer.addEventListener('zoom-updated', (e) => {
            if (isZoomingAfter) return;
            isZoomingBefore = true;
            afterViewer.zoom(e.zoomLevel);
            setTimeout(() => { isZoomingBefore = false; }, 0);
          });

          afterViewer.addEventListener('zoom-updated', (e) => {
            if (isZoomingBefore) return;
            isZoomingAfter = true;
            beforeViewer.zoom(e.zoomLevel);
            setTimeout(() => { isZoomingAfter = false; }, 0);
          });
        };

        const checkBothReady = () => {
          readyCount++;
          if (readyCount === 2) {
            setLoading(false);
            setupViewSync();
          }
        };

        beforeViewer.addEventListener('ready', checkBothReady);
        afterViewer.addEventListener('ready', checkBothReady);

        beforeViewer.addEventListener('error', (err) => {
          console.error('Before viewer error:', err);
          setError('Beforeビューアでエラーが発生しました');
          setLoading(false);
        });

        afterViewer.addEventListener('error', (err) => {
          console.error('After viewer error:', err);
          setError('Afterビューアでエラーが発生しました');
          setLoading(false);
        });

      } catch (err) {
        console.error('ComparisonPanoramaViewer initialization error:', err);
        setError('比較ビューアの初期化に失敗しました: ' + err.message);
        setLoading(false);
      }
    };

    // クリーンアップ
    return () => {
      if (beforeViewerRef.current) {
        beforeViewerRef.current.destroy();
        beforeViewerRef.current = null;
      }
      if (afterViewerRef.current) {
        afterViewerRef.current.destroy();
        afterViewerRef.current = null;
      }
    };
  }, [beforeImageUrl, afterImageUrl]);

  // スライダー操作
  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    updateSliderPosition(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = () => {
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    updateSliderPosition(e.touches[0]);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const updateSliderPosition = (event) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging]);

  if (error) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box ref={sliderRef} sx={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0,0,0,0.5)',
            zIndex: 3
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Before画像 */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
        }}
      >
        <div
          ref={beforeContainerRef}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        />
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            bgcolor: 'rgba(33, 150, 243, 0.9)',
            color: 'white',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            fontWeight: 'bold',
            zIndex: 1
          }}
        >
          Before
        </Typography>
      </Box>

      {/* After画像 */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          clipPath: `inset(0 0 0 ${sliderPosition}%)`,
        }}
      >
        <div
          ref={afterContainerRef}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        />
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'rgba(76, 175, 80, 0.9)',
            color: 'white',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            fontWeight: 'bold',
            zIndex: 1
          }}
        >
          After
        </Typography>
      </Box>

      {/* スライダー */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${sliderPosition}%`,
          width: 4,
          bgcolor: 'white',
          cursor: 'ew-resize',
          zIndex: 2,
          transform: 'translateX(-50%)',
          boxShadow: '0 0 10px rgba(0,0,0,0.5)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 40,
            height: 40,
            bgcolor: 'white',
            borderRadius: '50%',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* スライダーハンドル */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 40,
            height: 40,
            bgcolor: 'white',
            borderRadius: '50%',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <Box sx={{ fontSize: 20, color: 'text.secondary' }}>⇄</Box>
        </Box>
      </Box>
    </Box>
  );
}
