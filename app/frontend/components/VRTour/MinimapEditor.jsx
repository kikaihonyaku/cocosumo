import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  IconButton,
  Paper
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Save as SaveIcon
} from "@mui/icons-material";

export default function MinimapEditor({ vrTour, scenes, onUpdateScene, onUploadMinimap }) {
  const canvasRef = useRef(null);
  const [minimapImage, setMinimapImage] = useState(null);
  const [draggedScene, setDraggedScene] = useState(null);
  const [scenePositions, setScenePositions] = useState({});
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [hasChanges, setHasChanges] = useState(false);

  // 初期化: VRツアーのminimap_image_urlとシーンのminimap_positionを読み込み
  useEffect(() => {
    if (vrTour?.minimap_image_url) {
      setMinimapImage(vrTour.minimap_image_url);
    }

    // シーンの位置情報を読み込み
    const positions = {};
    scenes.forEach(scene => {
      if (scene.minimap_position) {
        positions[scene.id] = scene.minimap_position;
      } else {
        // デフォルト位置（中央付近にランダム配置）
        positions[scene.id] = {
          x: 400 + Math.random() * 100 - 50,
          y: 300 + Math.random() * 100 - 50
        };
      }
    });
    setScenePositions(positions);
  }, [vrTour, scenes]);

  // Canvasを描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景画像を描画
    if (minimapImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawScenes(ctx);
      };
      img.src = minimapImage;
    } else {
      // 背景画像がない場合はグレーの背景
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // グリッド線を描画
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      drawScenes(ctx);
    }
  }, [minimapImage, scenePositions, scenes]);

  // シーンマーカーを描画
  const drawScenes = (ctx) => {
    scenes.forEach((scene, index) => {
      const pos = scenePositions[scene.id];
      if (!pos) return;

      // マーカーの円を描画
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 20, 0, 2 * Math.PI);
      ctx.fillStyle = '#2196F3';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // シーン番号を描画
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((index + 1).toString(), pos.x, pos.y);

      // シーン名を描画
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.fillText(scene.title, pos.x, pos.y + 35);
    });
  };

  // ファイル選択ハンドラー
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 画像をプレビュー
    const reader = new FileReader();
    reader.onload = (event) => {
      setMinimapImage(event.target.result);
    };
    reader.readAsDataURL(file);

    // サーバーにアップロード
    if (onUploadMinimap) {
      await onUploadMinimap(file);
    }
  };

  // マウスイベントハンドラー
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // クリックされた位置にあるシーンを検索
    for (const scene of scenes) {
      const pos = scenePositions[scene.id];
      if (!pos) continue;

      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance <= 20) {
        setDraggedScene(scene.id);
        return;
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!draggedScene) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // シーン位置を更新
    setScenePositions(prev => ({
      ...prev,
      [draggedScene]: { x, y }
    }));
    setHasChanges(true);
  };

  const handleMouseUp = () => {
    setDraggedScene(null);
  };

  // 位置情報を保存
  const handleSave = async () => {
    for (const scene of scenes) {
      const pos = scenePositions[scene.id];
      if (pos && onUpdateScene) {
        await onUpdateScene(scene.id, { minimap_position: pos });
      }
    }
    setHasChanges(false);
  };

  // ミニマップ画像を削除
  const handleDeleteImage = () => {
    setMinimapImage(null);
    if (onUploadMinimap) {
      onUploadMinimap(null);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          ミニマップ設定
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadIcon />}
            size="small"
          >
            平面図をアップロード
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileChange}
            />
          </Button>

          {minimapImage && (
            <IconButton
              size="small"
              onClick={handleDeleteImage}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          )}

          {hasChanges && (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              size="small"
              sx={{ ml: 'auto' }}
            >
              位置を保存
            </Button>
          )}
        </Box>

        {!minimapImage && (
          <Alert severity="info" sx={{ mb: 2 }}>
            平面図画像をアップロードしてください。画像がない場合はグリッド背景が表示されます。
          </Alert>
        )}

        <Alert severity="info">
          シーンマーカーをドラッグして位置を調整できます。
        </Alert>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#f5f5f5' }}>
        <Paper sx={{ display: 'inline-block' }}>
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              cursor: draggedScene ? 'grabbing' : 'grab',
              display: 'block'
            }}
          />
        </Paper>
      </Box>
    </Box>
  );
}
