import React, { useRef, useEffect } from "react";
import { Box, Paper, Typography } from "@mui/material";

export default function MinimapDisplay({ vrTour, scenes, currentScene }) {
  const canvasRef = useRef(null);

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

  // ミニマップ画像がなく、かつシーンに位置情報がない場合は非表示
  const hasPositions = scenes.some(s => s.minimap_position);
  if (!vrTour?.minimap_image_url && !hasPositions) {
    return null;
  }

  return (
    <Paper
      sx={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        width: 250,
        height: 200,
        overflow: 'hidden',
        borderRadius: 2,
        boxShadow: 3
      }}
    >
      <Box sx={{ bgcolor: '#f5f5f5', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ px: 1.5, py: 0.5, bgcolor: 'rgba(0, 0, 0, 0.7)' }}>
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
