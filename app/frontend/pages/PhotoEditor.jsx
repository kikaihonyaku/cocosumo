import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Paper,
  Button,
  IconButton,
  Slider,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Backdrop,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  AutoFixHigh as AutoFixHighIcon,
  AddPhotoAlternate as AddPhotoAlternateIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import muiTheme from '../theme/muiTheme';

export default function PhotoEditor() {
  const { roomId, buildingId, photoId } = useParams();
  const navigate = useNavigate();
  const isBuilding = !!buildingId; // buildingIdがある場合は建物写真
  const canvasRef = useRef(null);
  const originalImageRef = useRef(null);

  // photo_typeを日本語に変換
  const getPhotoTypeLabel = (photoType) => {
    const buildingPhotoTypes = {
      exterior: '外観',
      entrance: 'エントランス',
      common_area: '共用部',
      parking: '駐車場',
      surroundings: '周辺環境',
      other: 'その他'
    };

    const roomPhotoTypes = {
      interior: '内観',
      living: 'リビング',
      kitchen: 'キッチン',
      bathroom: 'バスルーム',
      floor_plan: '間取り図',
      exterior: '外観',
      other: 'その他'
    };

    const types = isBuilding ? buildingPhotoTypes : roomPhotoTypes;
    return types[photoType] || photoType;
  };

  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 画像調整パラメータ
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  // Gemini AI設定
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiProcessing, setAiProcessing] = useState(false);
  const [referenceImages, setReferenceImages] = useState([]); // 参照画像（File オブジェクトの配列）

  // 保存オプション
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveOption, setSaveOption] = useState('overwrite'); // 'overwrite' or 'new'

  useEffect(() => {
    fetchPhoto();
  }, [roomId, buildingId, photoId]);

  const fetchPhoto = async () => {
    try {
      setLoading(true);
      const url = isBuilding
        ? `/api/v1/buildings/${buildingId}/photos/${photoId}`
        : `/api/v1/rooms/${roomId}/room_photos/${photoId}`;

      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // 建物写真の場合はphotoオブジェクトの中にデータがある
        const photoData = isBuilding ? data.photo : data;
        setPhoto(photoData);
        loadImageToCanvas(photoData.photo_url || photoData.url);
      } else {
        setError('写真情報の取得に失敗しました');
      }
    } catch (err) {
      console.error('取得エラー:', err);
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const loadImageToCanvas = (imageUrl) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // オリジナル画像を保存
      originalImageRef.current = img;

      // Canvasのサイズを画像に合わせる（画面サイズに応じて動的に設定）
      const maxWidth = window.innerWidth * 0.7; // 画面幅の70%
      const maxHeight = window.innerHeight * 0.85; // 画面高さの85%
      let width = img.width;
      let height = img.height;

      // アスペクト比を保持してリサイズ
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // 画像を描画
      ctx.drawImage(img, 0, 0, width, height);
    };

    img.onerror = () => {
      setError('画像の読み込みに失敗しました');
    };

    img.src = imageUrl;
  };

  const applyFilters = () => {
    const canvas = canvasRef.current;
    const img = originalImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');

    // オリジナル画像を再描画
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // フィルターを適用
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const brightnessValue = brightness / 100;
    const contrastValue = contrast / 100;
    const saturationValue = saturation / 100;

    for (let i = 0; i < data.length; i += 4) {
      // RGB値を取得
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // 明度調整
      r *= brightnessValue;
      g *= brightnessValue;
      b *= brightnessValue;

      // コントラスト調整
      // コントラスト値が1.0（100%）のときは変化なし
      // 0.0で完全にグレー、2.0で2倍のコントラスト
      const contrastFactor = contrastValue;
      r = (r - 128) * contrastFactor + 128;
      g = (g - 128) * contrastFactor + 128;
      b = (b - 128) * contrastFactor + 128;

      // 彩度調整（HSLに変換して調整）
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        const s = l > 128 ? d / (510 - max - min) : d / (max + min);
        const h = max === r
          ? ((g - b) / d + (g < b ? 6 : 0)) / 6
          : max === g
          ? ((b - r) / d + 2) / 6
          : ((r - g) / d + 4) / 6;

        const newS = Math.min(1, s * saturationValue);
        const c = (1 - Math.abs(2 * l / 255 - 1)) * newS;
        const x = c * (1 - Math.abs((h * 6) % 2 - 1));
        const m = l / 255 - c / 2;

        let rPrime, gPrime, bPrime;
        if (h < 1/6) { rPrime = c; gPrime = x; bPrime = 0; }
        else if (h < 2/6) { rPrime = x; gPrime = c; bPrime = 0; }
        else if (h < 3/6) { rPrime = 0; gPrime = c; bPrime = x; }
        else if (h < 4/6) { rPrime = 0; gPrime = x; bPrime = c; }
        else if (h < 5/6) { rPrime = x; gPrime = 0; bPrime = c; }
        else { rPrime = c; gPrime = 0; bPrime = x; }

        r = (rPrime + m) * 255;
        g = (gPrime + m) * 255;
        b = (bPrime + m) * 255;
      }

      // RGB値をクリップして設定
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    ctx.putImageData(imageData, 0, 0);
  };

  useEffect(() => {
    if (originalImageRef.current) {
      applyFilters();
    }
  }, [brightness, contrast, saturation]);

  const handleReset = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  // 参照画像を追加
  const handleAddReferenceImage = (event) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    // 最大3枚まで
    const newImages = [...referenceImages, ...imageFiles].slice(0, 3);
    setReferenceImages(newImages);

    // input要素をリセット（同じファイルを再度選択できるように）
    event.target.value = '';
  };

  // 参照画像を削除
  const handleRemoveReferenceImage = (index) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAiProcess = async () => {
    if (!aiPrompt.trim()) {
      alert('AI処理の指示を入力してください');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      alert('画像が読み込まれていません');
      return;
    }

    setAiProcessing(true);
    try {
      // Canvasから画像Blobを取得
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.95);
      });

      // FormDataを作成
      const formData = new FormData();
      formData.append('image', blob, 'current_image.jpg');
      formData.append('prompt', aiPrompt);

      // 参照画像を追加
      referenceImages.forEach((refImage, index) => {
        formData.append('reference_images[]', refImage, `reference_${index}.jpg`);
      });

      // Imagen APIにリクエスト送信
      const response = await fetch('/api/v1/imagen/edit_image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        // エラーオブジェクト全体を文字列化して保持
        const errorObj = {
          error: error.error || 'AI処理に失敗しました',
          details: error.details,
          suggestion: error.suggestion
        };
        throw new Error(JSON.stringify(errorObj));
      }

      const data = await response.json();

      if (data.success && data.image) {
        // Base64画像をCanvasに描画
        const img = new Image();
        img.onload = () => {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // 編集後の画像を新しいオリジナルとして保存
          originalImageRef.current = img;
        };
        img.src = `data:image/png;base64,${data.image}`;
      } else {
        throw new Error('画像の編集に失敗しました');
      }

    } catch (err) {
      console.error('AI処理エラー:', err);

      // より詳細なエラーメッセージを表示
      let errorMessage = 'AI処理に失敗しました';
      let suggestion = '';

      if (err.message) {
        errorMessage = err.message;
      }

      // バックエンドからのsuggestionを取得
      try {
        const errorResponse = JSON.parse(err.message);
        if (errorResponse.error) {
          errorMessage = errorResponse.error;
        }
        if (errorResponse.suggestion) {
          suggestion = '\n\n💡 ' + errorResponse.suggestion;
        }
      } catch {
        // JSON解析失敗の場合は元のメッセージを使用
      }

      alert(errorMessage + suggestion);
    } finally {
      setAiProcessing(false);
    }
  };

  const handleSave = () => {
    setSaveDialogOpen(true);
  };

  const handleSaveConfirm = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setSaveDialogOpen(false);
    setSaving(true);
    try {
      // CanvasからBlobを取得
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.95);
      });

      const formData = new FormData();
      formData.append('photo', blob, 'edited_photo.jpg');
      formData.append('save_option', saveOption);

      let endpoint;
      if (isBuilding) {
        endpoint = saveOption === 'overwrite'
          ? `/api/v1/buildings/${buildingId}/photos/${photoId}/replace`
          : `/api/v1/buildings/${buildingId}/photos/${photoId}/duplicate`;
      } else {
        endpoint = saveOption === 'overwrite'
          ? `/api/v1/rooms/${roomId}/room_photos/${photoId}/replace`
          : `/api/v1/rooms/${roomId}/room_photos/${photoId}/duplicate`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        navigate(-1); // 前のページに戻る
      } else {
        const error = await response.json();
        throw new Error(error.error || '保存に失敗しました');
      }
    } catch (err) {
      console.error('保存エラー:', err);
      alert(err.message || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCancel = () => {
    setSaveDialogOpen(false);
  };

  if (loading) {
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
          <CircularProgress size={60} />
        </Box>
      </ThemeProvider>
    );
  }

  if (error || !photo) {
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default', gap: 2 }}>
          <Typography variant="h6" color="error">
            {error || '写真が見つかりません'}
          </Typography>
          <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
            戻る
          </Button>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />

      {/* AI処理中インジケーター */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: 'column',
          gap: 2
        }}
        open={aiProcessing || saving}
      >
        <CircularProgress color="inherit" size={60} />
        <Typography variant="h6">
          {aiProcessing ? 'AI編集中...' : '保存中...'}
        </Typography>
        <Typography variant="body2">
          {aiProcessing ? '自動的に最大3回まで試行します。画像の複雑さによっては時間がかかる場合があります。' : ''}
        </Typography>
      </Backdrop>

      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
        {/* ヘッダー */}
        <AppBar position="static" elevation={0} sx={{
          bgcolor: 'primary.main',
          borderRadius: '12px 12px 0 0'
        }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => navigate(-1)}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" component="h1" sx={{ flexGrow: 1, fontWeight: 600 }}>
              {isBuilding
                ? `建物写真編集${photo.building_name ? ` ${photo.building_name}` : ''}${photo.photo_type ? ` ${getPhotoTypeLabel(photo.photo_type)}` : ''} ID: ${photo.id}`
                : `部屋写真編集${photo.building_name ? ` ${photo.building_name}` : ''}${photo.room_name ? ` ${photo.room_name}` : ''}${photo.photo_type ? ` ${getPhotoTypeLabel(photo.photo_type)}` : ''} ID: ${photo.id}`
              }
            </Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '保存中...' : '保存'}
            </Button>
          </Toolbar>
        </AppBar>

        {/* メインコンテンツ */}
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 0, width: '100%', height: '100%' }}>
            {/* 左側: キャンバス */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#f5f5f5',
              p: 1,
              overflow: 'hidden'
            }}>
              <canvas
                ref={canvasRef}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              />
            </Box>

            {/* 右側: コントロールパネル */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              overflowY: 'auto',
              bgcolor: 'background.paper',
              p: 1.5,
              borderLeft: '1px solid',
              borderColor: 'divider'
            }}>
              {/* AI画像処理 */}
              <Paper elevation={2} sx={{ p: 1.5 }}>
                <Typography variant="h6" gutterBottom>
                  AI画像編集 (Nano Banana)
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="編集したい内容を具体的に入力してください&#10;例:&#10;・ソファを完全に削除&#10;・壁の色を白に変更&#10;・床のキズを修正"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  sx={{ mb: 2 }}
                  disabled={aiProcessing}
                  helperText="短い指示でOK！AIが自動的に詳細な編集指示に変換します"
                />

                {/* 参照画像セクション */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
                    参照画像（オプション）
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    照明やオブジェクトなどの画像を追加できます（最大3枚）
                  </Typography>

                  {/* 参照画像プレビュー */}
                  {referenceImages.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      {referenceImages.map((file, index) => (
                        <Box
                          key={index}
                          sx={{
                            position: 'relative',
                            width: 80,
                            height: 80,
                            borderRadius: 1,
                            overflow: 'hidden',
                            border: '2px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`参照画像${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveReferenceImage(index)}
                            sx={{
                              position: 'absolute',
                              top: 2,
                              right: 2,
                              bgcolor: 'rgba(0, 0, 0, 0.6)',
                              color: 'white',
                              '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.8)',
                              },
                              padding: '2px',
                            }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {/* 参照画像追加ボタン */}
                  {referenceImages.length < 3 && (
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<AddPhotoAlternateIcon />}
                      size="small"
                      disabled={aiProcessing}
                      fullWidth
                    >
                      参照画像を追加 ({referenceImages.length}/3)
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        multiple
                        onChange={handleAddReferenceImage}
                      />
                    </Button>
                  )}
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                  startIcon={<AutoFixHighIcon />}
                  onClick={handleAiProcess}
                  disabled={aiProcessing || !aiPrompt.trim()}
                >
                  {aiProcessing ? 'AI編集中...' : 'AI編集を実行'}
                </Button>

                <Alert severity="info" sx={{ mt: 2, fontSize: '0.75rem' }}>
                  <strong>効果的なプロンプトのコツ：</strong>
                  <br />
                  ✓ 「〇〇を削除」「〇〇を変更」など動作を明確に
                  <br />
                  ✓ 一度に1つの編集を指示すると成功率が高い
                  <br />
                  ✓ 失敗した場合は自動的に再試行されます
                  <br />
                  <br />
                  <strong>よく使われる例：</strong>
                  <br />
                  • 家具系：「ソファを完全に削除」「テーブルを完全に取り除く」
                  <br />
                  • 修正系：「壁の汚れを完全に消す」「床のキズを完全に修正」
                  <br />
                  • 変更系：「壁を白に塗る」「カーテンを追加」
                  <br />
                  <br />
                  <strong>参照画像の使い方：</strong>
                  <br />
                  • 照明器具の画像を追加して「この照明を追加」
                  <br />
                  • 家具の画像を追加して「この家具を配置」
                  <br />
                  • スタイル参考画像を追加して雰囲気を指定
                </Alert>
              </Paper>

              {/* 基本調整 */}
              <Paper elevation={2} sx={{ p: 1.5 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  基本調整
                  <IconButton size="small" onClick={handleReset} title="リセット">
                    <RefreshIcon />
                  </IconButton>
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3, px: 1 }}>
                  <Typography variant="body2" gutterBottom>
                    明度: {brightness}%
                  </Typography>
                  <Slider
                    value={brightness}
                    onChange={(e, value) => setBrightness(value)}
                    min={0}
                    max={200}
                    step={1}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 100, label: '100%' },
                      { value: 200, label: '200%' },
                    ]}
                  />
                </Box>

                <Box sx={{ mb: 3, px: 1 }}>
                  <Typography variant="body2" gutterBottom>
                    コントラスト: {contrast}%
                  </Typography>
                  <Slider
                    value={contrast}
                    onChange={(e, value) => setContrast(value)}
                    min={0}
                    max={200}
                    step={1}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 100, label: '100%' },
                      { value: 200, label: '200%' },
                    ]}
                  />
                </Box>

                <Box sx={{ mb: 0, px: 1 }}>
                  <Typography variant="body2" gutterBottom>
                    彩度: {saturation}%
                  </Typography>
                  <Slider
                    value={saturation}
                    onChange={(e, value) => setSaturation(value)}
                    min={0}
                    max={200}
                    step={1}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 100, label: '100%' },
                      { value: 200, label: '200%' },
                    ]}
                  />
                </Box>
              </Paper>
            </Box>
          </Box>
        </Box>

        {/* 保存確認ダイアログ */}
        <Dialog open={saveDialogOpen} onClose={handleSaveCancel}>
          <DialogTitle>保存オプション</DialogTitle>
          <DialogContent>
            <FormControl component="fieldset" sx={{ mt: 1 }}>
              <RadioGroup
                value={saveOption}
                onChange={(e) => setSaveOption(e.target.value)}
              >
                <FormControlLabel
                  value="overwrite"
                  control={<Radio />}
                  label="元の画像を上書き"
                />
                <FormControlLabel
                  value="new"
                  control={<Radio />}
                  label="新しい画像として保存"
                />
              </RadioGroup>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleSaveCancel}>
              キャンセル
            </Button>
            <Button onClick={handleSaveConfirm} variant="contained" color="success">
              保存
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}
