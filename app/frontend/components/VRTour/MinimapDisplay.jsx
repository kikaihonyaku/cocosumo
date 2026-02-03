import React, { useRef, useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { getZoomFactor } from "../../utils/zoomUtils";

export default function MinimapDisplay({ vrTour, scenes, currentScene, viewAngle = 0, onSceneClick }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imageRef = useRef(null); // 画像をキャッシュ
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 80 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mouseDownPos, setMouseDownPos] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // MinimapEditorのキャンバスサイズ
  const EDITOR_WIDTH = 800;
  const EDITOR_HEIGHT = 600;

  // Displayのキャンバスサイズ
  const DISPLAY_WIDTH = 250;
  const DISPLAY_HEIGHT = 170;

  // 画像をロードしてキャッシュ
  useEffect(() => {
    if (vrTour?.minimap_image_url) {
      setImageLoaded(false);
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setImageLoaded(true); // 画像読み込み完了時にキャンバスの再描画をトリガー
      };
      img.onerror = () => {
        imageRef.current = null;
        setImageLoaded(false);
      };
      img.src = vrTour.minimap_image_url;
    } else {
      imageRef.current = null;
      setImageLoaded(false);
    }
  }, [vrTour?.minimap_image_url]);

  // キャンバス描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const draw = () => {
      // キャンバスをクリア
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 背景画像を描画（キャッシュから）
      if (imageRef.current) {
        ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
      } else {
        // 背景画像がない場合はグレーの背景
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // シーンマーカーを描画
      drawScenes(ctx);
    };

    // 初回描画
    draw();

    // スクロールやリサイズ時にも再描画
    const handleRedraw = () => {
      requestAnimationFrame(draw);
    };

    window.addEventListener('scroll', handleRedraw, true);
    window.addEventListener('resize', handleRedraw);

    return () => {
      window.removeEventListener('scroll', handleRedraw, true);
      window.removeEventListener('resize', handleRedraw);
    };
  }, [scenes, currentScene, viewAngle, imageLoaded]);

  // シーンマーカーを描画
  const drawScenes = (ctx) => {
    // スケール計算
    const scaleX = DISPLAY_WIDTH / EDITOR_WIDTH;
    const scaleY = DISPLAY_HEIGHT / EDITOR_HEIGHT;

    scenes.forEach((scene, index) => {
      const pos = scene.minimap_position;
      if (!pos) return;

      // 座標をスケーリング
      const scaledX = pos.x * scaleX;
      const scaledY = pos.y * scaleY;

      const isCurrentScene = currentScene?.id === scene.id;

      // 現在のシーンの場合、視線方向を示す扇形を描画
      if (isCurrentScene) {
        const radius = 20;
        const fov = Math.PI / 3; // 60度の視野角

        // viewAngleをラジアンに変換（0度が北、時計回り）
        // Photo Sphere ViewerのyawはX軸正方向が0で反時計回り
        // ミニマップでは上が0度（北）で時計回り
        const angle = -viewAngle + Math.PI / 2; // 90度回転して反転

        ctx.save();
        ctx.translate(scaledX, scaledY);

        // 視線方向の扇形（半透明）
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, angle - fov / 2, angle + fov / 2);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 87, 34, 0.3)';
        ctx.fill();

        // 視線方向の中心線（矢印）
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const lineLength = radius;
        ctx.lineTo(
          Math.cos(angle) * lineLength,
          Math.sin(angle) * lineLength
        );
        ctx.strokeStyle = 'rgba(255, 87, 34, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
      }

      // マーカーの円を描画
      ctx.beginPath();
      ctx.arc(scaledX, scaledY, isCurrentScene ? 8 : 6, 0, 2 * Math.PI);
      ctx.fillStyle = isCurrentScene ? '#FF5722' : '#2196F3';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = isCurrentScene ? 2 : 1.5;
      ctx.stroke();

      // シーン番号を描画
      ctx.fillStyle = '#fff';
      ctx.font = isCurrentScene ? 'bold 8px Arial' : 'bold 7px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((index + 1).toString(), scaledX, scaledY);
    });
  };

  // キャンバスクリックでシーン選択
  const handleCanvasClick = (e) => {
    if (isDragging || !onSceneClick) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const zoom = getZoomFactor();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    // スケール計算
    const scaleX = DISPLAY_WIDTH / EDITOR_WIDTH;
    const scaleY = DISPLAY_HEIGHT / EDITOR_HEIGHT;

    // クリック位置に近いシーンを検索
    const clickRadius = 15; // クリック判定の半径
    for (const scene of scenes) {
      const pos = scene.minimap_position;
      if (!pos) continue;

      const scaledX = pos.x * scaleX;
      const scaledY = pos.y * scaleY;

      const distance = Math.sqrt(
        Math.pow(x - scaledX, 2) + Math.pow(y - scaledY, 2)
      );

      if (distance <= clickRadius) {
        onSceneClick(scene);
        return;
      }
    }
  };

  // ドラッグハンドラー
  const handleMouseDown = (e) => {
    // ヘッダー部分をクリックした場合のみドラッグ開始
    if (e.target.closest('.minimap-header')) {
      setIsDragging(true);
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const zoom = getZoomFactor();
      setDragOffset({
        x: (e.clientX - rect.left) / zoom,
        y: (e.clientY - rect.top) / zoom
      });
    } else if (e.target === canvasRef.current) {
      // キャンバス上のマウスダウン位置を記録
      const rect = canvasRef.current.getBoundingClientRect();
      const zoom = getZoomFactor();
      setMouseDownPos({
        x: (e.clientX - rect.left) / zoom,
        y: (e.clientY - rect.top) / zoom
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const parentRect = containerRef.current.parentElement.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    const zoom = getZoomFactor();

    let newX = (e.clientX - parentRect.left) / zoom - dragOffset.x;
    let newY = (e.clientY - parentRect.top) / zoom - dragOffset.y;

    // 画面内に収まるように制限
    newX = Math.max(0, Math.min(newX, (parentRect.width - containerRect.width) / zoom));
    newY = Math.max(0, Math.min(newY, (parentRect.height - containerRect.height) / zoom));

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
    }
    setMouseDownPos(null);
  };

  // グローバルなマウスイベントリスナー
  useEffect(() => {
    if (isDragging || mouseDownPos) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, mouseDownPos]);

  // ミニマップ画像がなく、かつシーンに位置情報がない場合は非表示
  const hasPositions = scenes.some(s => s.minimap_position);
  if (!vrTour?.minimap_image_url && !hasPositions) {
    return null;
  }

  return (
    <Paper
      ref={containerRef}
      sx={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: 250,
        height: 200,
        overflow: 'hidden',
        borderRadius: 2,
        boxShadow: 3,
        cursor: isDragging ? 'grabbing' : 'auto',
        userSelect: 'none',
        zIndex: 20,
        willChange: isDragging ? 'transform' : 'auto',
        transition: isDragging ? 'none' : 'box-shadow 0.3s ease',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden'
      }}
    >
      <Box sx={{
        bgcolor: '#fff',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        isolation: 'isolate'
      }}>
        <Box
          className="minimap-header"
          onMouseDown={handleMouseDown}
          sx={{
            px: 1.5,
            py: 0.5,
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            cursor: 'grab',
            '&:active': {
              cursor: 'grabbing'
            }
          }}
        >
          <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
            ミニマップ
          </Typography>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <canvas
            ref={canvasRef}
            width={250}
            height={170}
            style={{ display: 'block', maxWidth: '100%', maxHeight: '100%', cursor: 'pointer' }}
            onClick={handleCanvasClick}
          />
        </Box>
      </Box>
    </Paper>
  );
}
