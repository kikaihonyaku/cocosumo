import React, { useEffect, useRef, useState } from "react";
import { Viewer } from "@photo-sphere-viewer/core";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import { Box, CircularProgress, Alert, Typography } from "@mui/material";

// マーカーのHTMLを生成
const generateMarkerHtml = (marker) => {
  const type = marker.data?.type || 'scene_link';
  const text = marker.text || 'リンク';
  const arrowDirection = marker.data?.arrow_direction || 'right';

  if (type === 'info') {
    // 情報リンク: 情報アイコン
    return `<div class="hotspot-theta hotspot-info"><div class="hotspot-ripple"></div><div class="hotspot-ring"></div><div class="hotspot-center"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg></div><div class="hotspot-tooltip">${text}</div></div>`;
  } else {
    // シーンリンク: 矢印アイコン（向き付き）
    return `<div class="hotspot-theta"><div class="hotspot-ripple"></div><div class="hotspot-ring"></div><div class="hotspot-center arrow-${arrowDirection}"><svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg></div><div class="hotspot-tooltip">${text}</div></div>`;
  }
};

export default function ComparisonPanoramaViewer({
  beforeImageUrl,
  afterImageUrl,
  initialView = { yaw: 0, pitch: 0 },
  fullscreenContainerId = null,
  markers = [],
  onMarkerClick,
  editable = false
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
          plugins: [
            [MarkersPlugin, {
              markers: markers.map(marker => ({
                id: marker.id,
                position: { yaw: marker.yaw, pitch: marker.pitch },
                html: marker.html || generateMarkerHtml(marker),
                tooltip: marker.tooltip,
                data: marker.data
              }))
            }]
          ],
        });

        // Afterビューアーを作成
        const afterViewer = new Viewer({
          container: afterContainerRef.current,
          panorama: afterImageUrl,
          defaultYaw: initialView.yaw || 0,
          defaultPitch: initialView.pitch || 0,
          navbar: false,
          plugins: [
            [MarkersPlugin, {
              markers: markers.map(marker => ({
                id: marker.id,
                position: { yaw: marker.yaw, pitch: marker.pitch },
                html: marker.html || generateMarkerHtml(marker),
                tooltip: marker.tooltip,
                data: marker.data
              }))
            }]
          ],
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

        const setupMarkerEvents = () => {
          // Beforeビューアーのマーカーイベント
          const beforeMarkersPlugin = beforeViewer.getPlugin(MarkersPlugin);
          if (onMarkerClick) {
            beforeMarkersPlugin.addEventListener('select-marker', (e) => {
              onMarkerClick(e.marker);
            });
          }

          // Afterビューアーのマーカーイベント
          const afterMarkersPlugin = afterViewer.getPlugin(MarkersPlugin);
          if (onMarkerClick) {
            afterMarkersPlugin.addEventListener('select-marker', (e) => {
              onMarkerClick(e.marker);
            });
          }

          // エディタブルモードの場合、クリックでマーカー追加
          if (editable) {
            beforeViewer.addEventListener('click', (e) => {
              if (e.data) {
                onMarkerClick && onMarkerClick({
                  type: 'add',
                  position: { yaw: e.data.yaw, pitch: e.data.pitch }
                });
              }
            });

            afterViewer.addEventListener('click', (e) => {
              if (e.data) {
                onMarkerClick && onMarkerClick({
                  type: 'add',
                  position: { yaw: e.data.yaw, pitch: e.data.pitch }
                });
              }
            });
          }
        };

        const checkBothReady = () => {
          readyCount++;
          if (readyCount === 2) {
            setLoading(false);
            setupViewSync();
            setupMarkerEvents();
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

  // マーカーの更新
  useEffect(() => {
    if (beforeViewerRef.current && afterViewerRef.current && markers) {
      try {
        // Beforeビューアーのマーカーを更新
        const beforeMarkersPlugin = beforeViewerRef.current.getPlugin(MarkersPlugin);
        beforeMarkersPlugin.clearMarkers();
        markers.forEach(marker => {
          const markerConfig = {
            id: marker.id,
            position: { yaw: marker.yaw || 0, pitch: marker.pitch || 0 },
            html: marker.html || generateMarkerHtml(marker),
            tooltip: marker.tooltip,
            data: marker.data
          };
          beforeMarkersPlugin.addMarker(markerConfig);
        });

        // Afterビューアーのマーカーを更新
        const afterMarkersPlugin = afterViewerRef.current.getPlugin(MarkersPlugin);
        afterMarkersPlugin.clearMarkers();
        markers.forEach(marker => {
          const markerConfig = {
            id: marker.id,
            position: { yaw: marker.yaw || 0, pitch: marker.pitch || 0 },
            html: marker.html || generateMarkerHtml(marker),
            tooltip: marker.tooltip,
            data: marker.data
          };
          afterMarkersPlugin.addMarker(markerConfig);
        });
      } catch (err) {
        console.error('Marker update error:', err);
      }
    }
  }, [markers]);

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
