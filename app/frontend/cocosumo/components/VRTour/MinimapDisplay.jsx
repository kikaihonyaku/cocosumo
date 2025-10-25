import React, { useRef, useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";

export default function MinimapDisplay({ vrTour, scenes, currentScene }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // MinimapEditorのキャンバスサイズ
  const EDITOR_WIDTH = 800;
  const EDITOR_HEIGHT = 600;

  // Displayのキャンバスサイズ
  const DISPLAY_WIDTH = 250;
  const DISPLAY_HEIGHT = 170;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景画像を描画
    if (vrTour?.minimap_image_url) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawScenes(ctx);
      };
      img.src = vrTour.minimap_image_url;
    } else {
      // 背景画像がない場合はグレーの背景
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawScenes(ctx);
    }
  }, [vrTour, scenes, currentScene]);

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

  // ドラッグハンドラー
  const handleMouseDown = (e) => {
    // ヘッダー部分をクリックした場合のみドラッグ開始
    if (e.target.closest('.minimap-header')) {
      setIsDragging(true);
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const parentRect = containerRef.current.parentElement.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    let newX = e.clientX - parentRect.left - dragOffset.x;
    let newY = e.clientY - parentRect.top - dragOffset.y;

    // 画面内に収まるように制限
    newX = Math.max(0, Math.min(newX, parentRect.width - containerRect.width));
    newY = Math.max(0, Math.min(newY, parentRect.height - containerRect.height));

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // グローバルなマウスイベントリスナー
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

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
        userSelect: 'none'
      }}
    >
      <Box sx={{ bgcolor: '#f5f5f5', height: '100%', display: 'flex', flexDirection: 'column' }}>
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
            style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }}
          />
        </Box>
      </Box>
    </Paper>
  );
}
