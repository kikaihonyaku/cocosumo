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
  useMediaQuery,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  Switch,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  AutoFixHigh as AutoFixHighIcon,
  AddPhotoAlternate as AddPhotoAlternateIcon,
  Close as CloseIcon,
  LocationOn as LocationOnIcon,
  CropFree as CropFreeIcon,
  Image as ImageIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Crop as CropIcon,
  AspectRatio as AspectRatioIcon,
} from '@mui/icons-material';
import muiTheme from '../theme/muiTheme';

// アスペクト比の定数定義
const ASPECT_RATIOS = [
  { value: '1:1', label: '1:1 (正方形)', ratio: 1 },
  { value: '4:3', label: '4:3 (横)', ratio: 4 / 3 },
  { value: '16:9', label: '16:9 (横)', ratio: 16 / 9 },
  { value: '3:4', label: '3:4 (縦)', ratio: 3 / 4 },
  { value: '9:16', label: '9:16 (縦)', ratio: 9 / 16 },
  { value: 'free', label: 'フリー (任意)', ratio: null },
];

// サイズプリセットの定義（Web用・SNS用）
const SIZE_PRESETS = {
  '1:1': [
    { label: '1200×1200 (大)', width: 1200, height: 1200 },
    { label: '1080×1080 (Instagram)', width: 1080, height: 1080 },
    { label: '800×800 (中)', width: 800, height: 800 },
  ],
  '4:3': [
    { label: '1200×900 (大)', width: 1200, height: 900 },
    { label: '800×600 (中)', width: 800, height: 600 },
  ],
  '16:9': [
    { label: '1920×1080 (Full HD)', width: 1920, height: 1080 },
    { label: '1280×720 (HD)', width: 1280, height: 720 },
    { label: '1200×675 (Twitter/X)', width: 1200, height: 675 },
    { label: '800×450 (小)', width: 800, height: 450 },
  ],
  '3:4': [
    { label: '1080×1440 (Instagram)', width: 1080, height: 1440 },
    { label: '900×1200 (大)', width: 900, height: 1200 },
    { label: '600×800 (中)', width: 600, height: 800 },
  ],
  '9:16': [
    { label: '1080×1920 (Instagram Story)', width: 1080, height: 1920 },
    { label: '675×1200 (大)', width: 675, height: 1200 },
    { label: '450×800 (中)', width: 450, height: 800 },
  ],
  'free': [],
};

export default function PhotoEditor() {
  const { roomId, buildingId, photoId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // md以下（960px未満）をモバイル判定
  const isBuilding = !!buildingId; // buildingIdがある場合は建物写真
  const canvasRef = useRef(null);
  const originalImageRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const tempCanvasRef = useRef(null); // クロップオーバーレイ用の一時Canvas
  const cachedImageRef = useRef(null); // クロップモード時のキャッシュ画像

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
  const [editMode, setEditMode] = useState('full'); // 'full' or 'point'
  const [clickPoints, setClickPoints] = useState([]); // クリック座標の配列 [{x: 0-1, y: 0-1}]

  // 編集履歴管理
  const [editHistory, setEditHistory] = useState([]); // 編集履歴の配列（ImageDataを保持）
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1); // 現在の履歴インデックス
  const MAX_HISTORY = 10; // 最大履歴数

  // 保存オプション
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveOption, setSaveOption] = useState('overwrite'); // 'overwrite' or 'new'

  // クロップ機能
  const [cropMode, setCropMode] = useState(false); // クロップモードのON/OFF
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('4:3'); // アスペクト比
  const [cropArea, setCropArea] = useState(null); // {x, y, width, height} クロップ範囲（Canvas座標）
  const [isDragging, setIsDragging] = useState(false); // ドラッグ中かどうか
  const [dragStart, setDragStart] = useState(null); // {x, y} ドラッグ開始位置（Canvas座標）
  const [resizeEnabled, setResizeEnabled] = useState(true); // リサイズあり/なし
  const [selectedPresetSize, setSelectedPresetSize] = useState(0); // 選択されたプリセットサイズのインデックス

  useEffect(() => {
    fetchPhoto();
  }, [roomId, buildingId, photoId]);

  // photoが設定されたら画像をcanvasに読み込む（初回ロード時のみ）
  useEffect(() => {
    if (photo && !loading) {
      const proxyUrl = isBuilding
        ? `/api/v1/buildings/${buildingId}/photos/${photoId}/proxy`
        : `/api/v1/rooms/${roomId}/room_photos/${photoId}/proxy`;
      loadImageToCanvas(proxyUrl);
    }
  }, [photo, loading]);

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
        // 画像の読み込みはuseEffectで行う（loading=falseになってcanvasがレンダリングされた後）
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
    // プロキシ経由なので同一オリジン、crossOrigin不要

    img.onload = () => {
      // オリジナル画像を保存
      originalImageRef.current = img;

      // Canvasのサイズを画像に合わせる（画面サイズに応じて動的に設定）
      // モバイルでは画面幅いっぱい、デスクトップでは右パネル分を引いた幅
      const maxWidth = isMobile
        ? window.innerWidth * 0.95 // モバイルでは画面幅の95%
        : window.innerWidth * 0.7; // デスクトップでは画面幅の70%
      const maxHeight = isMobile
        ? window.innerHeight * 0.5 // モバイルでは画面高さの50%（下部にコントロールパネルがあるため）
        : window.innerHeight * 0.85; // デスクトップでは画面高さの85%
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

      // 初回ロード時: オリジナル画像を履歴に保存
      if (editHistory.length === 0) {
        const imageDataUrl = canvas.toDataURL('image/png');
        setEditHistory([imageDataUrl]);
        setCurrentHistoryIndex(0);
      }
    };

    img.onerror = () => {
      setError('画像の読み込みに失敗しました');
    };

    img.src = imageUrl;
  };

  // 既存の画像を使用してcanvasをリサイズ（AI編集後の画像を保持）
  const resizeCanvasToFit = () => {
    const canvas = canvasRef.current;
    const img = originalImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');

    // 画面サイズに応じてcanvasサイズを計算
    const maxWidth = isMobile
      ? window.innerWidth * 0.95
      : window.innerWidth * 0.7;
    const maxHeight = isMobile
      ? window.innerHeight * 0.5
      : window.innerHeight * 0.85;

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

    // 既存の画像を再描画
    ctx.drawImage(img, 0, 0, width, height);

    // フィルターを再適用（適用されている場合）
    if (brightness !== 100 || contrast !== 100 || saturation !== 100) {
      applyFilters();
    }
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

  // クロップ範囲が変更されたときにオーバーレイを再描画
  useEffect(() => {
    if (cropMode && cropArea && cachedImageRef.current) {
      // キャッシュ画像を使うので常に軽量
      requestAnimationFrame(() => {
        drawCropOverlay();
      });
    } else if (cropMode && !cropArea && cachedImageRef.current) {
      // クロップ範囲がない場合はキャッシュ画像を復元
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(cachedImageRef.current, 0, 0);
      }
    }
  }, [cropArea, cropMode]);

  // ウィンドウサイズ変更時に画像をリサイズ（AI編集後の画像を保持）
  useEffect(() => {
    const handleResize = () => {
      if (photo && !loading && originalImageRef.current) {
        resizeCanvasToFit();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [photo, loading, isMobile]);

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

  // Canvasクリック/タッチイベントハンドラー（座標指定編集用）
  const handleCanvasClick = (e) => {
    if (editMode !== 'point') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // タッチイベントとマウスイベントの両方に対応
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const rect = canvas.getBoundingClientRect();

    // Canvas内の相対座標を計算（0-1の範囲に正規化）
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    // 範囲外のクリックは無視
    if (x < 0 || x > 1 || y < 0 || y > 1) return;

    // 正規化した座標（0-1の範囲）を保存
    const newPoint = { x, y };

    // 最大3点まで保存
    if (clickPoints.length < 3) {
      setClickPoints([...clickPoints, newPoint]);
    }
  };

  // クリック座標をクリア
  const handleClearClickPoints = () => {
    setClickPoints([]);
  };

  // クロップ用のマウスイベントハンドラー
  // アスペクト比の取得
  const getAspectRatio = () => {
    const aspectRatioConfig = ASPECT_RATIOS.find(ar => ar.value === selectedAspectRatio);
    return aspectRatioConfig?.ratio;
  };

  // Canvasの座標を取得
  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // クロップドラッグ開始
  const handleCropMouseDown = (e) => {
    if (!cropMode) return;
    e.preventDefault();

    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    setIsDragging(true);
    setDragStart(coords);
    setCropArea(null);
  };

  // クロップドラッグ中
  const handleCropMouseMove = (e) => {
    if (!cropMode || !isDragging || !dragStart) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    const aspectRatio = getAspectRatio();

    // ドラッグ方向とサイズを計算
    let width = Math.abs(coords.x - dragStart.x);
    let height = Math.abs(coords.y - dragStart.y);

    // アスペクト比を維持して調整（フリーフォームの場合はスキップ）
    if (aspectRatio !== null) {
      // 横幅を基準にする
      if (width / height > aspectRatio) {
        // 横が長すぎる場合、横を調整
        width = height * aspectRatio;
      } else {
        // 縦が長すぎる場合、縦を調整
        height = width / aspectRatio;
      }
    }

    // Canvas境界内に収める
    const maxWidth = canvas.width;
    const maxHeight = canvas.height;

    if (aspectRatio !== null) {
      // アスペクト比固定の場合
      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
    } else {
      // フリーフォームの場合
      if (width > maxWidth) {
        width = maxWidth;
      }
      if (height > maxHeight) {
        height = maxHeight;
      }
    }

    // 左上座標を計算（ドラッグ方向に応じて調整）
    let x = coords.x < dragStart.x ? dragStart.x - width : dragStart.x;
    let y = coords.y < dragStart.y ? dragStart.y - height : dragStart.y;

    // Canvas境界を超えないように調整
    if (x < 0) {
      x = 0;
    }
    if (y < 0) {
      y = 0;
    }
    if (x + width > maxWidth) {
      x = maxWidth - width;
    }
    if (y + height > maxHeight) {
      y = maxHeight - height;
    }

    setCropArea({ x, y, width, height });
  };

  // クロップドラッグ終了
  const handleCropMouseUp = (e) => {
    if (!cropMode || !isDragging) return;
    e.preventDefault();

    setIsDragging(false);
    setDragStart(null);
  };

  // クロップモードの切り替え
  const handleToggleCropMode = () => {
    const newCropMode = !cropMode;
    setCropMode(newCropMode);

    if (newCropMode) {
      // クロップモードをONにする場合、現在の画像をキャッシュ
      const canvas = canvasRef.current;
      if (canvas) {
        const cacheCanvas = document.createElement('canvas');
        cacheCanvas.width = canvas.width;
        cacheCanvas.height = canvas.height;
        const cacheCtx = cacheCanvas.getContext('2d');
        cacheCtx.drawImage(canvas, 0, 0);
        cachedImageRef.current = cacheCanvas;
      }
    } else {
      // クロップモードをOFFにする場合、状態をクリア
      setCropArea(null);
      setIsDragging(false);
      setDragStart(null);
      cachedImageRef.current = null;
    }
  };

  // クロップのキャンセル
  const handleCancelCrop = () => {
    // キャッシュ画像を復元
    const canvas = canvasRef.current;
    const cachedImage = cachedImageRef.current;
    if (canvas && cachedImage) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(cachedImage, 0, 0);
    }

    setCropArea(null);
    setIsDragging(false);
    setDragStart(null);
  };

  // クロップオーバーレイを描画
  const drawCropOverlay = () => {
    const canvas = canvasRef.current;
    const cachedImage = cachedImageRef.current;
    if (!canvas || !cropArea || !cachedImage) return;

    const ctx = canvas.getContext('2d');

    // キャッシュ画像を描画（元の画像を復元）
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(cachedImage, 0, 0);

    // 半透明の暗いオーバーレイを全体に描画
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // クロップ範囲に元の画像を再描画（オーバーレイなし）
    ctx.drawImage(
      cachedImage,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height
    );

    // クロップ範囲の枠線を描画
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

    // サイズ情報を表示
    let sizeText = '';
    if (resizeEnabled && selectedAspectRatio !== 'free') {
      const presets = SIZE_PRESETS[selectedAspectRatio];
      if (presets && presets[selectedPresetSize]) {
        const preset = presets[selectedPresetSize];
        sizeText = `${preset.width} × ${preset.height}px`;
      }
    } else if (selectedAspectRatio === 'free') {
      sizeText = `${Math.round(cropArea.width)} × ${Math.round(cropArea.height)}px`;
    } else {
      sizeText = `${Math.round(cropArea.width)} × ${Math.round(cropArea.height)}px (リサイズなし)`;
    }

    if (sizeText) {
      ctx.font = isMobile ? '12px Arial' : '16px Arial';
      ctx.fillStyle = '#00ff00';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 3;

      const textX = cropArea.x + 10;
      const textY = cropArea.y + (isMobile ? 20 : 25);

      ctx.strokeText(sizeText, textX, textY);
      ctx.fillText(sizeText, textX, textY);
    }
  };

  // 現在のCanvas画像を履歴に保存
  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 現在のCanvasの画像データをBase64で取得
    const imageDataUrl = canvas.toDataURL('image/png');

    // 現在の履歴インデックスより後ろの履歴を削除（新しい分岐を作成）
    const newHistory = editHistory.slice(0, currentHistoryIndex + 1);

    // 新しい画像を履歴に追加
    newHistory.push(imageDataUrl);

    // 履歴の上限を超えた場合は古い履歴を削除
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
      setEditHistory(newHistory);
      setCurrentHistoryIndex(newHistory.length - 1);
    } else {
      setEditHistory(newHistory);
      setCurrentHistoryIndex(newHistory.length - 1);
    }
  };

  // Undo: 1つ前の画像に戻る
  const handleUndo = () => {
    if (currentHistoryIndex <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Canvasを画面サイズに合わせてリサイズ
      const maxWidth = isMobile
        ? window.innerWidth * 0.95
        : window.innerWidth * 0.7;
      const maxHeight = isMobile
        ? window.innerHeight * 0.5
        : window.innerHeight * 0.85;

      let displayWidth = img.width;
      let displayHeight = img.height;

      // アスペクト比を保持してリサイズ
      if (displayWidth > maxWidth) {
        displayHeight = (displayHeight * maxWidth) / displayWidth;
        displayWidth = maxWidth;
      }
      if (displayHeight > maxHeight) {
        displayWidth = (displayWidth * maxHeight) / displayHeight;
        displayHeight = maxHeight;
      }

      // Canvasのサイズを調整
      canvas.width = displayWidth;
      canvas.height = displayHeight;

      // 画像を再描画
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
      originalImageRef.current = img;
      setCurrentHistoryIndex(currentHistoryIndex - 1);
    };

    img.src = editHistory[currentHistoryIndex - 1];
  };

  // Redo: 1つ後の画像に進む
  const handleRedo = () => {
    if (currentHistoryIndex >= editHistory.length - 1) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Canvasを画面サイズに合わせてリサイズ
      const maxWidth = isMobile
        ? window.innerWidth * 0.95
        : window.innerWidth * 0.7;
      const maxHeight = isMobile
        ? window.innerHeight * 0.5
        : window.innerHeight * 0.85;

      let displayWidth = img.width;
      let displayHeight = img.height;

      // アスペクト比を保持してリサイズ
      if (displayWidth > maxWidth) {
        displayHeight = (displayHeight * maxWidth) / displayWidth;
        displayWidth = maxWidth;
      }
      if (displayHeight > maxHeight) {
        displayWidth = (displayWidth * maxHeight) / displayHeight;
        displayHeight = maxHeight;
      }

      // Canvasのサイズを調整
      canvas.width = displayWidth;
      canvas.height = displayHeight;

      // 画像を再描画
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
      originalImageRef.current = img;
      setCurrentHistoryIndex(currentHistoryIndex + 1);
    };

    img.src = editHistory[currentHistoryIndex + 1];
  };

  // クロップを適用
  const handleApplyCrop = () => {
    if (!cropArea) {
      alert('クロップ範囲を選択してください');
      return;
    }

    const canvas = canvasRef.current;
    const cachedImage = cachedImageRef.current;
    if (!canvas || !cachedImage) return;

    const ctx = canvas.getContext('2d');

    // キャッシュ画像からクロップ範囲を抽出（フィルター適用済み）
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(cachedImage, 0, 0);

    // クロップ範囲を抽出
    const croppedImageData = tempCtx.getImageData(
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height
    );

    // 一時Canvasにクロップした画像を描画
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropArea.width;
    croppedCanvas.height = cropArea.height;
    const croppedCtx = croppedCanvas.getContext('2d');
    croppedCtx.putImageData(croppedImageData, 0, 0);

    // 最終出力サイズを決定
    let finalWidth, finalHeight;
    if (resizeEnabled && selectedAspectRatio !== 'free') {
      // リサイズありの場合、プリセットサイズを使用
      const presets = SIZE_PRESETS[selectedAspectRatio];
      if (presets && presets[selectedPresetSize]) {
        finalWidth = presets[selectedPresetSize].width;
        finalHeight = presets[selectedPresetSize].height;
      } else {
        // プリセットがない場合は元のサイズ
        finalWidth = cropArea.width;
        finalHeight = cropArea.height;
      }
    } else {
      // リサイズなし、またはフリーフォームの場合は元のサイズ
      finalWidth = cropArea.width;
      finalHeight = cropArea.height;
    }

    // メインCanvasを最終サイズにリサイズ
    canvas.width = finalWidth;
    canvas.height = finalHeight;

    // メインCanvasに最終サイズで描画（リサイズありの場合は拡大縮小される）
    ctx.drawImage(croppedCanvas, 0, 0, finalWidth, finalHeight);

    // 新しい画像を作成してoriginalImageRefを更新
    const newImg = new Image();
    newImg.onload = () => {
      originalImageRef.current = newImg;

      // Canvasを画面サイズに合わせてリサイズ
      const maxWidth = isMobile
        ? window.innerWidth * 0.95
        : window.innerWidth * 0.7;
      const maxHeight = isMobile
        ? window.innerHeight * 0.5
        : window.innerHeight * 0.85;

      let displayWidth = newImg.width;
      let displayHeight = newImg.height;

      // アスペクト比を保持してリサイズ
      if (displayWidth > maxWidth) {
        displayHeight = (displayHeight * maxWidth) / displayWidth;
        displayWidth = maxWidth;
      }
      if (displayHeight > maxHeight) {
        displayWidth = (displayWidth * maxHeight) / displayHeight;
        displayHeight = maxHeight;
      }

      // Canvasのサイズを調整
      canvas.width = displayWidth;
      canvas.height = displayHeight;

      // 画像を再描画
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(newImg, 0, 0, displayWidth, displayHeight);

      // 履歴に保存
      saveToHistory();
      // クロップモードを終了
      setCropMode(false);
      setCropArea(null);
      setIsDragging(false);
      setDragStart(null);
      cachedImageRef.current = null;
    };
    newImg.src = canvas.toDataURL('image/png');
  };

  const handleAiProcess = async () => {
    if (!aiPrompt.trim()) {
      alert('AI処理の指示を入力してください');
      return;
    }

    // 座標指定モード時のバリデーション
    if (editMode === 'point' && clickPoints.length === 0) {
      alert('座標指定モードでは、画像上をクリックして編集位置を指定してください');
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
      formData.append('edit_mode', editMode);

      // 座標指定モード時は座標データを追加
      if (editMode === 'point' && clickPoints.length > 0) {
        formData.append('coordinates', JSON.stringify(clickPoints));
      }

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

          // 編集後の画像を履歴に保存
          saveToHistory();
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
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          borderRadius: '12px 12px 0 0'
        }}>
          <Toolbar variant="dense" sx={{ minHeight: 52 }}>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => navigate(-1)}
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h6" component="h1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                {isBuilding ? '建物写真編集' : '部屋写真編集'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.85rem' }}>
                {isBuilding
                  ? `${photo.building_name || ''}${photo.photo_type ? ` ${getPhotoTypeLabel(photo.photo_type)}` : ''}`
                  : `${photo.building_name || ''}${photo.room_name ? ` ${photo.room_name}` : ''}${photo.photo_type ? ` ${getPhotoTypeLabel(photo.photo_type)}` : ''}`
                }
              </Typography>
            </Box>
            {/* 編集履歴（Undo/Redo） */}
            {editHistory.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                <IconButton
                  color="inherit"
                  onClick={handleUndo}
                  disabled={currentHistoryIndex <= 0 || aiProcessing}
                  title="元に戻す"
                  sx={{
                    '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)' }
                  }}
                >
                  <UndoIcon />
                </IconButton>
                <IconButton
                  color="inherit"
                  onClick={handleRedo}
                  disabled={currentHistoryIndex >= editHistory.length - 1 || aiProcessing}
                  title="やり直す"
                  sx={{
                    '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)' }
                  }}
                >
                  <RedoIcon />
                </IconButton>
              </Box>
            )}
            {isMobile ? (
              <IconButton
                color="inherit"
                onClick={handleSave}
                disabled={saving}
                sx={{
                  bgcolor: 'success.main',
                  '&:hover': { bgcolor: 'success.dark' },
                  '&.Mui-disabled': { bgcolor: 'action.disabledBackground' }
                }}
              >
                <SaveIcon />
              </IconButton>
            ) : (
              <Button
                variant="contained"
                color="success"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? '保存中...' : '保存'}
              </Button>
            )}
          </Toolbar>
        </AppBar>

        {/* メインコンテンツ */}
        <Box sx={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <Box sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            width: '100%',
            height: '100%',
            overflow: 'hidden'
          }}>
            {/* 左側（モバイルでは上部）: キャンバス */}
            <Box
              ref={canvasContainerRef}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f5f5f5',
                p: 1,
                overflow: 'auto',
                flex: isMobile ? '0 0 auto' : 1,
                minHeight: isMobile ? 'auto' : '100%',
                position: 'relative'
              }}
            >
              <canvas
                ref={canvasRef}
                onClick={cropMode ? undefined : handleCanvasClick}
                onTouchStart={cropMode ? undefined : handleCanvasClick}
                onMouseDown={cropMode ? handleCropMouseDown : undefined}
                onMouseMove={cropMode ? handleCropMouseMove : undefined}
                onMouseUp={cropMode ? handleCropMouseUp : undefined}
                onTouchMove={cropMode ? handleCropMouseMove : undefined}
                onTouchEnd={cropMode ? handleCropMouseUp : undefined}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: cropMode ? 'crosshair' : (editMode === 'point' ? 'crosshair' : 'default'),
                  touchAction: (cropMode || editMode === 'point') ? 'none' : 'auto',
                }}
              />

              {/* クリックポイントのマーカー */}
              {editMode === 'point' && clickPoints.map((point, index) => {
                const canvas = canvasRef.current;
                const container = canvasContainerRef.current;
                if (!canvas || !container) return null;

                const canvasRect = canvas.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();

                // Canvas上の絶対位置を計算（containerを基準に）
                const left = canvasRect.left - containerRect.left + (point.x * canvasRect.width);
                const top = canvasRect.top - containerRect.top + (point.y * canvasRect.height);

                // マーカーのサイズをモバイルとデスクトップで調整
                const markerSize = isMobile ? 32 : 40;
                const numberSize = isMobile ? 16 : 20;
                const numberTopOffset = isMobile ? -20 : -24;

                return (
                  <Box
                    key={index}
                    sx={{
                      position: 'absolute',
                      left: `${left}px`,
                      top: `${top}px`,
                      transform: 'translate(-50%, -100%)',
                      pointerEvents: 'none',
                      zIndex: 1000
                    }}
                  >
                    <LocationOnIcon
                      sx={{
                        fontSize: markerSize,
                        color: 'error.main',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: `${numberTopOffset}px`,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bgcolor: 'error.main',
                        color: 'white',
                        borderRadius: '50%',
                        width: numberSize,
                        height: numberSize,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isMobile ? '0.625rem' : '0.75rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {index + 1}
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* 右側（モバイルでは下部）: コントロールパネル */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              overflowY: 'auto',
              bgcolor: 'background.paper',
              p: 1.5,
              borderLeft: isMobile ? 'none' : '1px solid',
              borderTop: isMobile ? '1px solid' : 'none',
              borderColor: 'divider',
              width: isMobile ? '100%' : '360px',
              flex: isMobile ? 1 : '0 0 360px'
            }}>
              {/* AI画像処理 */}
              <Paper elevation={2} sx={{ p: 1.5 }}>
                <Typography variant="h6" gutterBottom>
                  AI画像編集 (Nano Banana)
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {/* 編集モード切り替え */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
                    編集モード
                  </Typography>
                  <ToggleButtonGroup
                    value={editMode}
                    exclusive
                    onChange={(e, newMode) => {
                      if (newMode !== null) {
                        setEditMode(newMode);
                        // モード切り替え時に座標をクリア
                        if (newMode === 'full') {
                          setClickPoints([]);
                        }
                      }
                    }}
                    fullWidth
                    size="small"
                    disabled={aiProcessing}
                  >
                    <ToggleButton value="full" sx={{ py: 1, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 0.5 : 1 }}>
                      <ImageIcon sx={{ mr: isMobile ? 0 : 1 }} />
                      {isMobile ? (
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>全体</Typography>
                      ) : (
                        '全体編集'
                      )}
                    </ToggleButton>
                    <ToggleButton value="point" sx={{ py: 1, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 0.5 : 1 }}>
                      <CropFreeIcon sx={{ mr: isMobile ? 0 : 1 }} />
                      {isMobile ? (
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>座標指定</Typography>
                      ) : (
                        '座標指定編集'
                      )}
                    </ToggleButton>
                  </ToggleButtonGroup>

                  {/* 座標指定モード時のヘルプテキストとクリアボタン */}
                  {editMode === 'point' && (
                    <Box sx={{ mt: 1 }}>
                      <Alert severity="info" sx={{ mb: 1, fontSize: isMobile ? '0.7rem' : '0.75rem', py: isMobile ? 0.5 : 1 }}>
                        {isMobile ? '画像をタップして編集位置を指定（最大3点）' : '画像上をクリックして編集したい位置を指定してください（最大3点）'}
                      </Alert>
                      {clickPoints.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
                            {clickPoints.length}点指定済み
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={handleClearClickPoints}
                            disabled={aiProcessing}
                            sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem', px: isMobile ? 1 : 2 }}
                          >
                            {isMobile ? 'クリア' : '座標をクリア'}
                          </Button>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>

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

              {/* サイズ調整 */}
              <Paper elevation={2} sx={{ p: 1.5 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CropIcon />
                  サイズ調整
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {/* アスペクト比選択 */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
                    アスペクト比を選択
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={selectedAspectRatio}
                      onChange={(e) => {
                        setSelectedAspectRatio(e.target.value);
                        setSelectedPresetSize(0); // アスペクト比変更時はプリセットをリセット
                      }}
                      disabled={cropMode}
                    >
                      {ASPECT_RATIOS.map((ar) => (
                        <MenuItem key={ar.value} value={ar.value}>
                          {ar.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* リサイズトグル */}
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={resizeEnabled}
                        onChange={(e) => setResizeEnabled(e.target.checked)}
                        disabled={cropMode || selectedAspectRatio === 'free'}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        リサイズあり
                      </Typography>
                    }
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4, fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
                    {resizeEnabled
                      ? 'トリミング後、指定サイズにリサイズします'
                      : 'トリミング範囲をそのまま切り出します'}
                  </Typography>
                </Box>

                {/* プリセットサイズ選択（リサイズありかつフリーでない場合のみ表示） */}
                {resizeEnabled && selectedAspectRatio !== 'free' && SIZE_PRESETS[selectedAspectRatio]?.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
                      出力サイズを選択
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={selectedPresetSize}
                        onChange={(e) => setSelectedPresetSize(e.target.value)}
                        disabled={cropMode}
                      >
                        {SIZE_PRESETS[selectedAspectRatio].map((preset, index) => (
                          <MenuItem key={index} value={index}>
                            {preset.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}

                {/* クロップモード切り替え */}
                <Box sx={{ mb: 2 }}>
                  <Button
                    fullWidth
                    variant={cropMode ? "contained" : "outlined"}
                    color={cropMode ? "primary" : "secondary"}
                    startIcon={<AspectRatioIcon />}
                    onClick={handleToggleCropMode}
                    disabled={aiProcessing}
                  >
                    {cropMode ? 'クロップモード ON' : 'クロップモードを開始'}
                  </Button>
                </Box>

                {/* クロップモード時の説明 */}
                {cropMode && (
                  <Box sx={{ mb: 2 }}>
                    <Alert severity="info" sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem', py: isMobile ? 0.5 : 1 }}>
                      {isMobile
                        ? '画像をドラッグしてクロップ範囲を選択してください'
                        : selectedAspectRatio === 'free'
                        ? '画像上でドラッグして自由にクロップ範囲を選択してください。'
                        : '画像上でドラッグしてクロップ範囲を選択してください。アスペクト比は自動的に維持されます。'
                      }
                    </Alert>

                    {cropArea && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
                          選択範囲: {Math.round(cropArea.width)} × {Math.round(cropArea.height)}px
                          <br />
                          {resizeEnabled && selectedAspectRatio !== 'free' && SIZE_PRESETS[selectedAspectRatio]?.[selectedPresetSize] && (
                            <>
                              出力サイズ: {SIZE_PRESETS[selectedAspectRatio][selectedPresetSize].width} × {SIZE_PRESETS[selectedAspectRatio][selectedPresetSize].height}px
                            </>
                          )}
                          {(!resizeEnabled || selectedAspectRatio === 'free') && (
                            <>
                              出力サイズ: {Math.round(cropArea.width)} × {Math.round(cropArea.height)}px (リサイズなし)
                            </>
                          )}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* 適用/キャンセルボタン */}
                {cropMode && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={handleCancelCrop}
                      disabled={aiProcessing}
                    >
                      キャンセル
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      onClick={handleApplyCrop}
                      disabled={!cropArea || aiProcessing}
                    >
                      適用
                    </Button>
                  </Box>
                )}
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
