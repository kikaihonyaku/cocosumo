import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  PhotoLibrary as PhotoLibraryIcon
} from "@mui/icons-material";

// カテゴリ定義
const PHOTO_CATEGORIES = {
  interior: '室内',
  living: 'リビング',
  kitchen: 'キッチン',
  bathroom: 'バスルーム',
  floor_plan: '間取り図',
  exterior: '外観',
  other: 'その他',
};

export default function MinimapEditor({ vrTour, scenes, onUpdateScene, onUploadMinimap, onSelectExistingPhoto, onRefreshScenes }) {
  const canvasRef = useRef(null);
  const hasSavedRef = useRef(false);
  const animationFrameRef = useRef(null);
  const backgroundImageRef = useRef(null);
  const [minimapImage, setMinimapImage] = useState(null);
  const [draggedScene, setDraggedScene] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [scenePositions, setScenePositions] = useState({});
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [hasChanges, setHasChanges] = useState(false);
  const [roomPhotos, setRoomPhotos] = useState([]);
  const [selectPhotoDialogOpen, setSelectPhotoDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 初期化: VRツアーのminimap_image_urlとシーンのminimap_positionを読み込み
  useEffect(() => {
    if (vrTour?.minimap_image_url) {
      setMinimapImage(vrTour.minimap_image_url);
    }

    // 部屋の写真を取得
    if (vrTour?.room?.id) {
      fetchRoomPhotos(vrTour.room.id);
    }

    // クリーンアップ: アニメーションフレームをキャンセル
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [vrTour]);

  // 背景画像を事前に読み込んでキャッシュ（ちらつき防止）
  useEffect(() => {
    if (minimapImage) {
      const img = new Image();
      img.onload = () => {
        backgroundImageRef.current = img;
        drawCanvas();
      };
      img.src = minimapImage;
    } else {
      backgroundImageRef.current = null;
      drawCanvas();
    }
  }, [minimapImage]);

  // シーンの位置情報を読み込み（既存の位置は維持）
  useEffect(() => {
    // 保存中は位置更新をスキップ（保存中のscenes更新による意図しない位置変更を防ぐ）
    if (isSaving) {
      return;
    }

    setScenePositions(prevPositions => {
      const positions = { ...prevPositions };

      scenes.forEach(scene => {
        // 既に位置が設定されている場合は、サーバーから取得した位置で更新
        if (scene.minimap_position) {
          positions[scene.id] = scene.minimap_position;
        } else if (!positions[scene.id]) {
          // まだ位置が設定されていない新しいシーンの場合のみランダム配置
          positions[scene.id] = {
            x: 400 + Math.random() * 100 - 50,
            y: 300 + Math.random() * 100 - 50
          };
        }
      });

      return positions;
    });
  }, [scenes, isSaving]);

  // 保存完了フラグが変わった時に位置を更新
  useEffect(() => {
    // 保存が完了した直後（isSavingがtrueからfalseに変わった時）のみ実行
    if (!isSaving && hasSavedRef.current) {
      hasSavedRef.current = false;

      // 保存完了後は位置を更新しない（ユーザーがドラッグした位置を保持）
      // サーバーから返ってくる位置が信頼できないため、コメントアウト
      /*
      const timer = setTimeout(() => {
        console.log('保存完了後の位置更新を実行');
        setScenePositions(prevPositions => {
          const newPositions = {};

          scenes.forEach(scene => {
            if (scene.minimap_position) {
              console.log(`Scene ${scene.id} (${scene.title}) - 保存された位置:`, scene.minimap_position);
              // サーバーから取得した保存済み位置を使用
              newPositions[scene.id] = { ...scene.minimap_position };
            } else if (prevPositions[scene.id]) {
              // 保存されていない場合は現在の位置を維持
              newPositions[scene.id] = prevPositions[scene.id];
            }
          });

          return newPositions;
        });
      }, 200);

      return () => clearTimeout(timer);
      */
    }
  }, [isSaving, scenes]);

  // 部屋の写真を取得
  const fetchRoomPhotos = async (roomId) => {
    try {
      const response = await fetch(`/api/v1/rooms/${roomId}/room_photos`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRoomPhotos(data.photos || data || []);
      }
    } catch (err) {
      console.error('部屋写真の取得エラー:', err);
    }
  };

  // Canvas描画関数（requestAnimationFrameで呼び出される）
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // キャッシュされた背景画像を描画
    if (backgroundImageRef.current) {
      ctx.drawImage(backgroundImageRef.current, 0, 0, canvas.width, canvas.height);
      drawScenes(ctx);
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
  };

  // Canvasを描画（ドラッグ中以外）
  useEffect(() => {
    // ドラッグ中はrequestAnimationFrameで描画するため、ここでは描画しない
    if (draggedScene) return;

    drawCanvas();
  }, [minimapImage, scenePositions, scenes, draggedScene]);

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
        // マーカーの中心とマウス位置のオフセットを保存
        setDragOffset({
          x: x - pos.x,
          y: y - pos.y
        });
        return;
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!draggedScene) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // オフセットを考慮してマーカーの新しい位置を計算
    const newX = mouseX - dragOffset.x;
    const newY = mouseY - dragOffset.y;

    // キャンバスの範囲内に制限
    const clampedX = Math.max(20, Math.min(canvas.width - 20, newX));
    const clampedY = Math.max(20, Math.min(canvas.height - 20, newY));

    // 前回のアニメーションフレームをキャンセル
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // requestAnimationFrameで描画を最適化
    animationFrameRef.current = requestAnimationFrame(() => {
      // シーン位置を更新
      setScenePositions(prev => ({
        ...prev,
        [draggedScene]: { x: clampedX, y: clampedY }
      }));
      setHasChanges(true);

      // 即座に再描画
      drawCanvas();
    });
  };

  const handleMouseUp = () => {
    // アニメーションフレームをキャンセル
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setDraggedScene(null);
    setDragOffset({ x: 0, y: 0 });

    // ドラッグ終了後に再描画
    requestAnimationFrame(() => {
      drawCanvas();
    });
  };

  // 位置情報を保存
  const handleSave = async () => {
    setIsSaving(true);
    hasSavedRef.current = true;

    // 保存前の位置を記録
    const positionsToSave = {};
    scenes.forEach(scene => {
      positionsToSave[scene.id] = { ...scenePositions[scene.id] };
    });

    try {
      // すべてのシーンを順番に保存（skipSceneUpdate=true で保存中のscenes更新を防ぐ）
      for (const scene of scenes) {
        const pos = positionsToSave[scene.id];
        if (pos && onUpdateScene) {
          await onUpdateScene(scene.id, { minimap_position: pos }, true);
        }
      }
      setHasChanges(false);

      // すべての保存が完了したら、シーンを再取得
      if (onRefreshScenes) {
        await onRefreshScenes();
      }
    } finally {
      // 保存完了後、少し待ってからフラグを解除
      // これにより、すべてのシーンの更新が完了するまで待つ
      setTimeout(() => {
        setIsSaving(false);
      }, 100);
    }
  };

  // ミニマップ画像を削除
  const handleDeleteImage = () => {
    setMinimapImage(null);
    if (onUploadMinimap) {
      onUploadMinimap(null);
    }
  };

  // 写真の表示名を生成
  const getPhotoDisplayName = (photo) => {
    const categoryName = photo.photo_type ? PHOTO_CATEGORIES[photo.photo_type] || photo.photo_type : '';
    const baseName = photo.caption || `写真${photo.id}`;

    if (categoryName) {
      return `[${categoryName}] ${baseName}`;
    }
    return baseName;
  };

  // 既存の写真を選択してミニマップとして設定
  const handleSelectPhoto = async (photo) => {
    setMinimapImage(photo.photo_url);
    setSelectPhotoDialogOpen(false);

    // サーバーに選択した写真IDを保存
    if (onSelectExistingPhoto) {
      await onSelectExistingPhoto(photo.id);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          ミニマップ設定
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
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

          <Button
            variant="outlined"
            startIcon={<PhotoLibraryIcon />}
            size="small"
            onClick={() => setSelectPhotoDialogOpen(true)}
          >
            部屋の画像から選択
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
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '位置を保存'}
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

      {/* 画像選択ダイアログ */}
      <Dialog
        open={selectPhotoDialogOpen}
        onClose={() => setSelectPhotoDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>部屋の画像から選択</DialogTitle>
        <DialogContent>
          {roomPhotos.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              部屋に登録されている写真がありません。先に部屋詳細ページで写真を登録してください。
            </Alert>
          ) : (
            <Box sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              mt: 2,
              p: 1,
              bgcolor: 'grey.50',
              borderRadius: 1,
              maxHeight: 400,
              overflowY: 'auto'
            }}>
              {roomPhotos.map((photo) => (
                <Box
                  key={photo.id}
                  onClick={() => handleSelectPhoto(photo)}
                  sx={{
                    width: 80,
                    height: 80,
                    flexShrink: 0,
                    cursor: 'pointer',
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: '2px solid transparent',
                    boxShadow: 1,
                    transition: 'all 0.15s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  <img
                    src={photo.photo_url}
                    alt={getPhotoDisplayName(photo)}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectPhotoDialogOpen(false)}>
            キャンセル
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
