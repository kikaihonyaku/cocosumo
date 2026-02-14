import React, { useRef, useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { getZoomFactor } from "../../utils/zoomUtils";

export default function MinimapDisplay({ vrTour, scenes, currentScene, viewAngle = 0, onSceneClick }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 68 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mouseDownPos, setMouseDownPos] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const EDITOR_WIDTH = 800;
  const EDITOR_HEIGHT = 600;

  const DISPLAY_WIDTH = 200;
  const DISPLAY_HEIGHT = 136;

  // 画像をロードしてキャッシュ
  useEffect(() => {
    if (vrTour?.minimap_image_url) {
      setImageLoaded(false);
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setImageLoaded(true);
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (imageRef.current) {
        ctx.globalAlpha = 0.85;
        ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      drawScenes(ctx);
    };

    draw();

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
    const scaleX = DISPLAY_WIDTH / EDITOR_WIDTH;
    const scaleY = DISPLAY_HEIGHT / EDITOR_HEIGHT;

    scenes.forEach((scene, index) => {
      const pos = scene.minimap_position;
      if (!pos) return;

      const scaledX = pos.x * scaleX;
      const scaledY = pos.y * scaleY;

      const isCurrentScene = currentScene?.id === scene.id;

      // 現在のシーンの視線方向コーン
      if (isCurrentScene) {
        const radius = 18;
        const fov = Math.PI / 3;
        const angle = -viewAngle + Math.PI / 2;

        ctx.save();
        ctx.translate(scaledX, scaledY);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, angle - fov / 2, angle + fov / 2);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        const lineLength = radius;
        ctx.lineTo(
          Math.cos(angle) * lineLength,
          Math.sin(angle) * lineLength
        );
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
      }

      // マーカーの円
      ctx.beginPath();
      ctx.arc(scaledX, scaledY, isCurrentScene ? 7 : 5, 0, 2 * Math.PI);
      ctx.fillStyle = isCurrentScene ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)';
      ctx.fill();
      if (isCurrentScene) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // シーン番号
      ctx.fillStyle = isCurrentScene ? '#000' : 'rgba(0, 0, 0, 0.7)';
      ctx.font = isCurrentScene ? 'bold 7px Arial' : '6px Arial';
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

    const scaleX = DISPLAY_WIDTH / EDITOR_WIDTH;
    const scaleY = DISPLAY_HEIGHT / EDITOR_HEIGHT;

    const clickRadius = 15;
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

  const hasPositions = scenes.some(s => s.minimap_position);
  if (!vrTour?.minimap_image_url && !hasPositions) {
    return null;
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: DISPLAY_WIDTH,
        height: DISPLAY_HEIGHT + 24,
        overflow: 'hidden',
        borderRadius: 2,
        bgcolor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        cursor: isDragging ? 'grabbing' : 'auto',
        userSelect: 'none',
        zIndex: 20,
        willChange: isDragging ? 'transform' : 'auto',
        transition: isDragging ? 'none' : 'box-shadow 0.3s ease',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      <Box sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        isolation: 'isolate',
      }}>
        <Box
          className="minimap-header"
          onMouseDown={handleMouseDown}
          sx={{
            px: 1.5,
            py: 0.25,
            cursor: 'grab',
            '&:active': { cursor: 'grabbing' },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: 600,
              fontSize: '0.6rem',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            MAP
          </Typography>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <canvas
            ref={canvasRef}
            width={DISPLAY_WIDTH}
            height={DISPLAY_HEIGHT}
            style={{ display: 'block', maxWidth: '100%', maxHeight: '100%', cursor: 'pointer' }}
            onClick={handleCanvasClick}
          />
        </Box>
      </Box>
    </Box>
  );
}
