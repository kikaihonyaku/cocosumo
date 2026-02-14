import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { Viewer } from "@photo-sphere-viewer/core";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import { AutorotatePlugin } from "@photo-sphere-viewer/autorotate-plugin";
import { GyroscopePlugin } from "@photo-sphere-viewer/gyroscope-plugin";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import { Box, CircularProgress, Alert } from "@mui/material";
import { getZoomFactor } from "../../utils/zoomUtils";

// マーカーのHTMLを生成（editableモードではdata-marker-id属性を追加）
const generateMarkerHtml = (marker, editable = false) => {
  const type = marker.data?.type || 'scene_link';
  const text = marker.text || 'リンク';
  const arrowDirection = marker.data?.arrow_direction || 'right';
  const dataAttr = editable ? ` data-marker-id="${marker.id}"` : '';

  if (type === 'info') {
    return `<div class="hotspot-theta hotspot-info"${dataAttr}><div class="hotspot-ripple"></div><div class="hotspot-ring"></div><div class="hotspot-center"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg></div><div class="hotspot-tooltip">${text}</div></div>`;
  } else {
    return `<div class="hotspot-theta"${dataAttr}><div class="hotspot-ripple"></div><div class="hotspot-ring"></div><div class="hotspot-center arrow-${arrowDirection}"><svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg></div><div class="hotspot-tooltip">${text}</div></div>`;
  }
};

const PanoramaViewer = forwardRef(function PanoramaViewer({
  imageUrl,
  initialView = { yaw: 0, pitch: 0 },
  markers = [],
  onMarkerClick,
  onMarkerHover,
  onMarkerLeave,
  onViewChange,
  editable = false,
  onViewerReady,
  fullscreenContainerId = null,
  onMarkerDragEnd,
  autoRotate = false,
  autoRotateSpeed = 1,
  gyroscopeEnabled = false,
  onGyroscopeError,
}, ref) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 外部からビューアを制御するためのメソッドを公開
  useImperativeHandle(ref, () => ({
    startAutoRotate: () => {
      if (viewerRef.current) {
        const autorotatePlugin = viewerRef.current.getPlugin(AutorotatePlugin);
        if (autorotatePlugin) {
          autorotatePlugin.start();
        }
      }
    },
    stopAutoRotate: () => {
      if (viewerRef.current) {
        const autorotatePlugin = viewerRef.current.getPlugin(AutorotatePlugin);
        if (autorotatePlugin) {
          autorotatePlugin.stop();
        }
      }
    },
    isAutoRotating: () => {
      if (viewerRef.current) {
        const autorotatePlugin = viewerRef.current.getPlugin(AutorotatePlugin);
        return autorotatePlugin?.isEnabled() || false;
      }
      return false;
    },
    setAutoRotateSpeed: (speed) => {
      if (viewerRef.current) {
        const autorotatePlugin = viewerRef.current.getPlugin(AutorotatePlugin);
        if (autorotatePlugin) {
          autorotatePlugin.setOptions({ autorotateSpeed: `${speed}rpm` });
        }
      }
    },
    startGyroscope: async () => {
      if (viewerRef.current) {
        const gyroscopePlugin = viewerRef.current.getPlugin(GyroscopePlugin);
        if (gyroscopePlugin) {
          try {
            await gyroscopePlugin.start();
            return true;
          } catch (error) {
            console.error('Gyroscope start error:', error);
            onGyroscopeError && onGyroscopeError(error);
            return false;
          }
        }
      }
      return false;
    },
    stopGyroscope: () => {
      if (viewerRef.current) {
        const gyroscopePlugin = viewerRef.current.getPlugin(GyroscopePlugin);
        if (gyroscopePlugin) {
          gyroscopePlugin.stop();
        }
      }
    },
    isGyroscopeEnabled: () => {
      if (viewerRef.current) {
        const gyroscopePlugin = viewerRef.current.getPlugin(GyroscopePlugin);
        return gyroscopePlugin?.isEnabled() || false;
      }
      return false;
    },
    getViewer: () => viewerRef.current,
    changePanorama: async (url, options = {}) => {
      if (!viewerRef.current) return false;
      try {
        const {
          speed = 1500,
          effect = 'fade',
          yaw = undefined,
          pitch = undefined,
        } = options;

        const transitionOpts = { transition: { speed, effect } };
        if (yaw !== undefined) transitionOpts.position = { yaw, pitch: pitch || 0 };

        await viewerRef.current.setPanorama(url, transitionOpts);
        return true;
      } catch (err) {
        console.error('changePanorama error:', err);
        return false;
      }
    },
  }));

  // editableの最新値を保持するref（クロージャ問題を回避）
  const editableRef = useRef(editable);
  editableRef.current = editable;

  // ドラッグ状態管理
  const draggingMarkerIdRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef(null);
  const lastDragPositionRef = useRef(null); // 最後にドラッグした座標を保持

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
                html: marker.html || generateMarkerHtml(marker, editableRef.current),
                tooltip: marker.tooltip,
                data: marker.data
              }))
            }],
            [AutorotatePlugin, {
              autorotateSpeed: `${autoRotateSpeed}rpm`,
              autostartDelay: null, // 自動開始しない
              autostartOnIdle: false,
            }],
            [GyroscopePlugin, {
              touchmove: true, // ジャイロ有効時もタッチ操作を許可
              absolutePosition: false,
              moveMode: 'smooth',
            }]
          ],
        });

        viewerRef.current = viewer;

        // ドラッグ用イベントハンドラー
        const handleMouseMove = (e) => {
          if (!draggingMarkerIdRef.current || !viewerRef.current) return;

          // ドラッグ開始判定（5px以上移動でドラッグ開始）
          if (!isDraggingRef.current && dragStartPosRef.current) {
            const dx = e.clientX - dragStartPosRef.current.x;
            const dy = e.clientY - dragStartPosRef.current.y;
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
              isDraggingRef.current = true;
            }
          }

          if (!isDraggingRef.current) return;

          e.preventDefault();

          try {
            // containerRefを使用（viewerRef.current.containerはページ全体のサイズになる場合がある）
            const rect = containerRef.current.getBoundingClientRect();
            const zoom = getZoomFactor();
            const viewerX = (e.clientX - rect.left) / zoom;
            const viewerY = (e.clientY - rect.top) / zoom;

            const sphericalCoords = viewerRef.current.dataHelper.viewerCoordsToSphericalCoords({
              x: viewerX,
              y: viewerY
            });

            if (sphericalCoords) {
              // 最後の座標を保持
              lastDragPositionRef.current = {
                yaw: sphericalCoords.yaw,
                pitch: sphericalCoords.pitch
              };

              const markersPlugin = viewerRef.current.getPlugin(MarkersPlugin);
              markersPlugin.updateMarker({
                id: draggingMarkerIdRef.current,
                position: { yaw: sphericalCoords.yaw, pitch: sphericalCoords.pitch }
              });
            }
          } catch (err) {
            console.error('Marker drag error:', err);
          }
        };

        const handleMouseUp = () => {
          if (draggingMarkerIdRef.current) {
            const markerId = draggingMarkerIdRef.current;
            const markerElement = document.querySelector(`[data-marker-id="${markerId}"]`);
            if (markerElement) {
              markerElement.classList.remove('dragging');
            }

            if (isDraggingRef.current && onMarkerDragEnd && lastDragPositionRef.current) {
              onMarkerDragEnd(markerId, lastDragPositionRef.current);
            }

            draggingMarkerIdRef.current = null;
            isDraggingRef.current = false;
            dragStartPosRef.current = null;
            lastDragPositionRef.current = null;
          }
        };

        // マーカー要素にドラッグリスナーを追加
        const attachDragListeners = () => {
          const markerElements = document.querySelectorAll('[data-marker-id]');
          markerElements.forEach(markerElement => {
            if (markerElement._dragHandler) return;

            const handler = (e) => {
              const markerId = markerElement.getAttribute('data-marker-id');
              draggingMarkerIdRef.current = markerId;
              dragStartPosRef.current = { x: e.clientX, y: e.clientY };
              markerElement.classList.add('dragging');

              e.stopPropagation();
              e.stopImmediatePropagation();
              e.preventDefault();

              if (viewerRef.current) {
                viewerRef.current.stopAll();
              }
            };

            markerElement._dragHandler = handler;
            markerElement.addEventListener('mousedown', handler, { capture: true });
          });
        };

        // イベントリスナー
        viewer.addEventListener('ready', () => {
          setLoading(false);
          onViewerReady && onViewerReady(viewer);

          if (editableRef.current) {
            setTimeout(attachDragListeners, 100);
          }
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
            // ドラッグ中はクリックイベントを無視
            if (isDraggingRef.current) return;
            onMarkerClick(e.marker);
          });
        }

        // マーカーホバーイベント
        if (onMarkerHover) {
          markersPlugin.addEventListener('enter-marker', (e) => {
            // マーカーの画面座標を取得
            const markerPosition = viewer.dataHelper.sphericalCoordsToViewerCoords({
              yaw: e.marker.config.position.yaw,
              pitch: e.marker.config.position.pitch
            });
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect && markerPosition) {
              onMarkerHover(e.marker, {
                x: rect.left + markerPosition.x,
                y: rect.top + markerPosition.y
              });
            }
          });
        }

        if (onMarkerLeave) {
          markersPlugin.addEventListener('leave-marker', (e) => {
            onMarkerLeave(e.marker);
          });
        }

        // エディタブルモードの場合、クリックでマーカー追加
        if (editableRef.current) {
          viewer.addEventListener('click', (e) => {
            if (isDraggingRef.current) return;
            if (e.data) {
              onMarkerClick && onMarkerClick({
                type: 'add',
                position: { yaw: e.data.yaw, pitch: e.data.pitch }
              });
            }
          });

          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
        }

        // クリーンアップ用に保存
        viewer._dragHandlers = { handleMouseMove, handleMouseUp, attachDragListeners };

      } catch (err) {
        console.error('PanoramaViewer initialization error:', err);
        setError('360度ビューアの初期化に失敗しました: ' + err.message);
        setLoading(false);
      }
    };

    // クリーンアップ
    return () => {
      if (viewerRef.current) {
        if (viewerRef.current._dragHandlers) {
          const { handleMouseMove, handleMouseUp } = viewerRef.current._dragHandlers;
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
        }
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
            html: marker.html || generateMarkerHtml(marker, editableRef.current),
            tooltip: marker.tooltip,
            data: marker.data
          };
          markersPlugin.addMarker(markerConfig);
        });

        // マーカー更新後にドラッグリスナーを再追加
        if (editableRef.current && viewerRef.current._dragHandlers?.attachDragListeners) {
          setTimeout(viewerRef.current._dragHandlers.attachDragListeners, 50);
        }
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
          overflow: 'hidden'
        }}
      />
    </Box>
  );
});

export default PanoramaViewer;
