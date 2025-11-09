import React, { useEffect, useRef, useState } from "react";
import { Viewer } from "@photo-sphere-viewer/core";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import { Box, CircularProgress, Alert } from "@mui/material";

export default function PanoramaViewer({
  imageUrl,
  initialView = { yaw: 0, pitch: 0 },
  markers = [],
  onMarkerClick,
  onViewChange,
  editable = false,
  onViewerReady,
  fullscreenContainerId = null
}) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!containerRef.current || !imageUrl) {
      return;
    }

    setLoading(true);
    setError("");

    // 画像が読み込めるかテスト
    const img = new Image();
    img.onload = () => {
      // 画像読み込み後、コンテナが存在するか再確認
      if (containerRef.current) {
        initializeViewer();
      }
    };
    img.onerror = () => {
      setError('360度画像の読み込みに失敗しました。画像URLが正しいか確認してください。');
      setLoading(false);
    };
    img.src = imageUrl;

    const initializeViewer = () => {
      try {
        // コンテナの存在を再確認
        if (!containerRef.current) {
          console.warn('Container element not found during viewer initialization');
          setLoading(false);
          return;
        }

        // Viewerインスタンスを作成
        const viewer = new Viewer({
          container: containerRef.current,
          panorama: imageUrl,
          defaultYaw: initialView.yaw || 0,
          defaultPitch: initialView.pitch || 0,
          navbar: [
            'zoom',
            'move',
            {
              id: 'custom-fullscreen',
              title: 'Fullscreen',
              className: 'psv-button psv-button--hover-scale psv-fullscreen-button',
              content: '⛶',
              onClick: (viewer) => {
                const fullscreenElement = fullscreenContainerId
                  ? document.getElementById(fullscreenContainerId)
                  : containerRef.current;

                if (!document.fullscreenElement) {
                  // フルスクリーンに入る
                  if (fullscreenElement.requestFullscreen) {
                    fullscreenElement.requestFullscreen();
                  } else if (fullscreenElement.webkitRequestFullscreen) {
                    fullscreenElement.webkitRequestFullscreen();
                  } else if (fullscreenElement.mozRequestFullScreen) {
                    fullscreenElement.mozRequestFullScreen();
                  } else if (fullscreenElement.msRequestFullscreen) {
                    fullscreenElement.msRequestFullscreen();
                  }
                } else {
                  // フルスクリーンから出る
                  if (document.exitFullscreen) {
                    document.exitFullscreen();
                  } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                  } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                  } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                  }
                }
              }
            }
          ],
          plugins: [
            [MarkersPlugin, {
              markers: markers.map(marker => ({
                id: marker.id,
                position: { yaw: marker.yaw, pitch: marker.pitch },
                html: marker.html || `<div class="hotspot-marker" style="background: rgba(33, 150, 243, 0.9); color: white; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.5); cursor: pointer; user-select: none;">${marker.text || 'ホットスポット'}</div>`,
                tooltip: marker.tooltip,
                data: marker.data
              }))
            }]
          ],
        });

        viewerRef.current = viewer;

        // イベントリスナー
        viewer.addEventListener('ready', () => {
          setLoading(false);
          onViewerReady && onViewerReady(viewer);
        });

        viewer.addEventListener('error', (err) => {
          console.error('PanoramaViewer error:', err);
          setError('360度ビューアでエラーが発生しました');
          setLoading(false);
        });

        viewer.addEventListener('position-updated', (e) => {
          onViewChange && onViewChange({
            yaw: e.position.yaw,
            pitch: e.position.pitch
          });
        });

        // マーカークリックイベント
        const markersPlugin = viewer.getPlugin(MarkersPlugin);

        if (onMarkerClick) {
          markersPlugin.addEventListener('select-marker', (e) => {
            onMarkerClick(e.marker);
          });
        }

        // エディタブルモードの場合、クリックでマーカー追加
        if (editable) {
          viewer.addEventListener('click', (e) => {
            if (e.data) {
              onMarkerClick && onMarkerClick({
                type: 'add',
                position: { yaw: e.data.yaw, pitch: e.data.pitch }
              });
            }
          });
        }

      } catch (err) {
        console.error('PanoramaViewer initialization error:', err);
        setError('360度ビューアの初期化に失敗しました: ' + err.message);
        setLoading(false);
      }
    };

    // クリーンアップ
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [imageUrl]);

  // マーカーの更新
  useEffect(() => {
    if (viewerRef.current && markers) {
      try {
        const markersPlugin = viewerRef.current.getPlugin(MarkersPlugin);
        markersPlugin.clearMarkers();

        markers.forEach(marker => {
          const markerConfig = {
            id: marker.id,
            position: { yaw: marker.yaw || 0, pitch: marker.pitch || 0 },
            html: marker.html || `<div class="hotspot-marker" style="background: rgba(33, 150, 243, 0.9); color: white; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.5); cursor: pointer; user-select: none;">${marker.text || 'ホットスポット'}</div>`,
            tooltip: marker.tooltip,
            data: marker.data
          };
          markersPlugin.addMarker(markerConfig);
        });
      } catch (err) {
        console.error('Marker update error:', err);
      }
    }
  }, [markers]);

  if (error) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
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
            zIndex: 1
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      />
    </Box>
  );
}
