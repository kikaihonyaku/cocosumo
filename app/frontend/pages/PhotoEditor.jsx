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
} from '@mui/icons-material';
import muiTheme from '../theme/muiTheme';

export default function PhotoEditor() {
  const { roomId, photoId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const originalImageRef = useRef(null);

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

  // 保存オプション
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveOption, setSaveOption] = useState('overwrite'); // 'overwrite' or 'new'

  useEffect(() => {
    fetchPhoto();
  }, [roomId, photoId]);

  const fetchPhoto = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/rooms/${roomId}/room_photos/${photoId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPhoto(data);
        loadImageToCanvas(data.photo_url);
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

      // Canvasのサイズを画像に合わせる
      const maxWidth = 800;
      const maxHeight = 600;
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

      // Imagen APIにリクエスト送信
      const response = await fetch('/api/v1/imagen/edit_image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'AI処理に失敗しました');
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
      alert(err.message || 'AI処理に失敗しました');
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

      const endpoint = saveOption === 'overwrite'
        ? `/api/v1/rooms/${roomId}/room_photos/${photoId}/replace`
        : `/api/v1/rooms/${roomId}/room_photos/${photoId}/duplicate`;

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        window.close(); // 新しいタブを閉じる
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
          <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => window.close()}>
            閉じる
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
          {aiProcessing ? 'しばらくお待ちください' : ''}
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
              onClick={() => window.close()}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" component="h1" sx={{ flexGrow: 1, fontWeight: 600 }}>
              画像編集
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
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 2, height: '100%' }}>
            {/* 左側: キャンバス */}
            <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <canvas
                ref={canvasRef}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  border: '1px solid #ddd',
                }}
              />
            </Paper>

            {/* 右側: コントロールパネル */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* AI画像処理 */}
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  AI画像編集 (Nano Banana)
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="例: テーブルを削除、椅子を消去、家具を取り除く"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  sx={{ mb: 2 }}
                  disabled={aiProcessing}
                />

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
                  Gemini 2.5 Flash (Nano Banana)が画像を編集します。
                  <br />
                  例: 「ソファを削除」「テーブルを取り除く」「家具を消す」
                  <br />
                  ※ 編集には数秒かかる場合があります。
                </Alert>
              </Paper>

              {/* 基本調整 */}
              <Paper elevation={3} sx={{ p: 2 }}>
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
