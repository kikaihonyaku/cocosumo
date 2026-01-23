import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Typography,
  Button,
  CircularProgress,
  Backdrop,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import muiTheme from '../theme/muiTheme';

// Components
import PhotoEditorHeader from './PhotoEditor/PhotoEditorHeader';
import PhotoEditorCanvas from './PhotoEditor/PhotoEditorCanvas';
import AIEditingPanel from './PhotoEditor/AIEditingPanel';
import CropPanel from './PhotoEditor/CropPanel';
import BasicAdjustmentsPanel from './PhotoEditor/BasicAdjustmentsPanel';
import SaveDialog from './PhotoEditor/SaveDialog';

// Constants
import { ASPECT_RATIOS, SIZE_PRESETS } from './PhotoEditor/constants';

export default function PhotoEditor() {
  const { roomId, buildingId, photoId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isBuilding = !!buildingId;
  const canvasRef = useRef(null);
  const originalImageRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const cachedImageRef = useRef(null);

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
  const [referenceImages, setReferenceImages] = useState([]);
  const [editMode, setEditMode] = useState('full');
  const [clickPoints, setClickPoints] = useState([]);
  const [watermarkProcessing, setWatermarkProcessing] = useState(false);

  // 編集履歴管理
  const [editHistory, setEditHistory] = useState([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const MAX_HISTORY = 10;

  // 保存オプション
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveOption, setSaveOption] = useState('overwrite');

  // クロップ機能
  const [cropMode, setCropMode] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('4:3');
  const [cropArea, setCropArea] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [resizeEnabled, setResizeEnabled] = useState(true);
  const [selectedPresetSize, setSelectedPresetSize] = useState(0);

  useEffect(() => {
    fetchPhoto();
  }, [roomId, buildingId, photoId]);

  useEffect(() => {
    if (photo && !loading) {
      const proxyUrl = isBuilding
        ? `/api/v1/buildings/${buildingId}/photos/${photoId}/proxy`
        : `/api/v1/rooms/${roomId}/room_photos/${photoId}/proxy`;
      loadImageToCanvas(proxyUrl);
    }
  }, [photo, loading]);

  useEffect(() => {
    if (originalImageRef.current) {
      applyFilters();
    }
  }, [brightness, contrast, saturation]);

  useEffect(() => {
    if (cropMode && cropArea && cachedImageRef.current) {
      requestAnimationFrame(() => {
        drawCropOverlay();
      });
    } else if (cropMode && !cropArea && cachedImageRef.current) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(cachedImageRef.current, 0, 0);
      }
    }
  }, [cropArea, cropMode]);

  useEffect(() => {
    const handleResize = () => {
      if (photo && !loading && originalImageRef.current) {
        resizeCanvasToFit();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [photo, loading, isMobile]);

  const fetchPhoto = async () => {
    try {
      setLoading(true);
      const url = isBuilding
        ? `/api/v1/buildings/${buildingId}/photos/${photoId}`
        : `/api/v1/rooms/${roomId}/room_photos/${photoId}`;

      const response = await fetch(url, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        const photoData = isBuilding ? data.photo : data;
        setPhoto(photoData);
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

    img.onload = () => {
      originalImageRef.current = img;
      const maxWidth = isMobile ? window.innerWidth * 0.95 : window.innerWidth * 0.7;
      const maxHeight = isMobile ? window.innerHeight * 0.5 : window.innerHeight * 0.85;
      let width = img.width;
      let height = img.height;

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
      ctx.drawImage(img, 0, 0, width, height);

      if (editHistory.length === 0) {
        const imageDataUrl = canvas.toDataURL('image/png');
        setEditHistory([imageDataUrl]);
        setCurrentHistoryIndex(0);
      }
    };

    img.onerror = () => setError('画像の読み込みに失敗しました');
    img.src = imageUrl;
  };

  const resizeCanvasToFit = () => {
    const canvas = canvasRef.current;
    const img = originalImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    const maxWidth = isMobile ? window.innerWidth * 0.95 : window.innerWidth * 0.7;
    const maxHeight = isMobile ? window.innerHeight * 0.5 : window.innerHeight * 0.85;

    let width = img.width;
    let height = img.height;

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
    ctx.drawImage(img, 0, 0, width, height);

    if (brightness !== 100 || contrast !== 100 || saturation !== 100) {
      applyFilters();
    }
  };

  const applyFilters = () => {
    const canvas = canvasRef.current;
    const img = originalImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const brightnessValue = brightness / 100;
    const contrastValue = contrast / 100;
    const saturationValue = saturation / 100;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      r *= brightnessValue;
      g *= brightnessValue;
      b *= brightnessValue;

      const contrastFactor = contrastValue;
      r = (r - 128) * contrastFactor + 128;
      g = (g - 128) * contrastFactor + 128;
      b = (b - 128) * contrastFactor + 128;

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

      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const handleReset = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  const handleAddReferenceImage = (event) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const newImages = [...referenceImages, ...imageFiles].slice(0, 3);
    setReferenceImages(newImages);
    event.target.value = '';
  };

  const handleRemoveReferenceImage = (index) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCanvasClick = (e) => {
    if (editMode !== 'point') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    if (x < 0 || x > 1 || y < 0 || y > 1) return;

    const newPoint = { x, y };
    if (clickPoints.length < 3) {
      setClickPoints([...clickPoints, newPoint]);
    }
  };

  const handleClearClickPoints = () => setClickPoints([]);

  const handleEditModeChange = (newMode) => {
    setEditMode(newMode);
    if (newMode === 'full') {
      setClickPoints([]);
    }
  };

  // Crop handlers
  const getAspectRatio = () => {
    const aspectRatioConfig = ASPECT_RATIOS.find(ar => ar.value === selectedAspectRatio);
    return aspectRatioConfig?.ratio;
  };

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handleCropMouseDown = (e) => {
    if (!cropMode) return;
    e.preventDefault();
    const coords = getCanvasCoordinates(e);
    if (!coords) return;
    setIsDragging(true);
    setDragStart(coords);
    setCropArea(null);
  };

  const handleCropMouseMove = (e) => {
    if (!cropMode || !isDragging || !dragStart) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    const aspectRatio = getAspectRatio();
    let width = Math.abs(coords.x - dragStart.x);
    let height = Math.abs(coords.y - dragStart.y);

    if (aspectRatio !== null) {
      if (width / height > aspectRatio) {
        width = height * aspectRatio;
      } else {
        height = width / aspectRatio;
      }
    }

    const maxWidth = canvas.width;
    const maxHeight = canvas.height;

    if (aspectRatio !== null) {
      if (width > maxWidth) { width = maxWidth; height = width / aspectRatio; }
      if (height > maxHeight) { height = maxHeight; width = height * aspectRatio; }
    } else {
      if (width > maxWidth) width = maxWidth;
      if (height > maxHeight) height = maxHeight;
    }

    let x = coords.x < dragStart.x ? dragStart.x - width : dragStart.x;
    let y = coords.y < dragStart.y ? dragStart.y - height : dragStart.y;

    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + width > maxWidth) x = maxWidth - width;
    if (y + height > maxHeight) y = maxHeight - height;

    setCropArea({ x, y, width, height });
  };

  const handleCropMouseUp = (e) => {
    if (!cropMode || !isDragging) return;
    e.preventDefault();
    setIsDragging(false);
    setDragStart(null);
  };

  const handleToggleCropMode = () => {
    const newCropMode = !cropMode;
    setCropMode(newCropMode);

    if (newCropMode) {
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
      setCropArea(null);
      setIsDragging(false);
      setDragStart(null);
      cachedImageRef.current = null;
    }
  };

  const handleCancelCrop = () => {
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

  const drawCropOverlay = () => {
    const canvas = canvasRef.current;
    const cachedImage = cachedImageRef.current;
    if (!canvas || !cropArea || !cachedImage) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(cachedImage, 0, 0);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(
      cachedImage,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height
    );

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

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

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageDataUrl = canvas.toDataURL('image/png');
    const newHistory = editHistory.slice(0, currentHistoryIndex + 1);
    newHistory.push(imageDataUrl);

    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
      setEditHistory(newHistory);
      setCurrentHistoryIndex(newHistory.length - 1);
    } else {
      setEditHistory(newHistory);
      setCurrentHistoryIndex(newHistory.length - 1);
    }
  };

  const handleUndo = () => {
    if (currentHistoryIndex <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const maxWidth = isMobile ? window.innerWidth * 0.95 : window.innerWidth * 0.7;
      const maxHeight = isMobile ? window.innerHeight * 0.5 : window.innerHeight * 0.85;

      let displayWidth = img.width;
      let displayHeight = img.height;

      if (displayWidth > maxWidth) {
        displayHeight = (displayHeight * maxWidth) / displayWidth;
        displayWidth = maxWidth;
      }
      if (displayHeight > maxHeight) {
        displayWidth = (displayWidth * maxHeight) / displayHeight;
        displayHeight = maxHeight;
      }

      canvas.width = displayWidth;
      canvas.height = displayHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
      originalImageRef.current = img;
      setCurrentHistoryIndex(currentHistoryIndex - 1);
    };

    img.src = editHistory[currentHistoryIndex - 1];
  };

  const handleRedo = () => {
    if (currentHistoryIndex >= editHistory.length - 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const maxWidth = isMobile ? window.innerWidth * 0.95 : window.innerWidth * 0.7;
      const maxHeight = isMobile ? window.innerHeight * 0.5 : window.innerHeight * 0.85;

      let displayWidth = img.width;
      let displayHeight = img.height;

      if (displayWidth > maxWidth) {
        displayHeight = (displayHeight * maxWidth) / displayWidth;
        displayWidth = maxWidth;
      }
      if (displayHeight > maxHeight) {
        displayWidth = (displayWidth * maxHeight) / displayHeight;
        displayHeight = maxHeight;
      }

      canvas.width = displayWidth;
      canvas.height = displayHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
      originalImageRef.current = img;
      setCurrentHistoryIndex(currentHistoryIndex + 1);
    };

    img.src = editHistory[currentHistoryIndex + 1];
  };

  const handleApplyCrop = () => {
    if (!cropArea) {
      alert('クロップ範囲を選択してください');
      return;
    }

    const canvas = canvasRef.current;
    const cachedImage = cachedImageRef.current;
    if (!canvas || !cachedImage) return;

    const ctx = canvas.getContext('2d');

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(cachedImage, 0, 0);

    const croppedImageData = tempCtx.getImageData(
      cropArea.x, cropArea.y, cropArea.width, cropArea.height
    );

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropArea.width;
    croppedCanvas.height = cropArea.height;
    const croppedCtx = croppedCanvas.getContext('2d');
    croppedCtx.putImageData(croppedImageData, 0, 0);

    let finalWidth, finalHeight;
    if (resizeEnabled && selectedAspectRatio !== 'free') {
      const presets = SIZE_PRESETS[selectedAspectRatio];
      if (presets && presets[selectedPresetSize]) {
        finalWidth = presets[selectedPresetSize].width;
        finalHeight = presets[selectedPresetSize].height;
      } else {
        finalWidth = cropArea.width;
        finalHeight = cropArea.height;
      }
    } else {
      finalWidth = cropArea.width;
      finalHeight = cropArea.height;
    }

    canvas.width = finalWidth;
    canvas.height = finalHeight;
    ctx.drawImage(croppedCanvas, 0, 0, finalWidth, finalHeight);

    const newImg = new Image();
    newImg.onload = () => {
      originalImageRef.current = newImg;

      const maxWidth = isMobile ? window.innerWidth * 0.95 : window.innerWidth * 0.7;
      const maxHeight = isMobile ? window.innerHeight * 0.5 : window.innerHeight * 0.85;

      let displayWidth = newImg.width;
      let displayHeight = newImg.height;

      if (displayWidth > maxWidth) {
        displayHeight = (displayHeight * maxWidth) / displayWidth;
        displayWidth = maxWidth;
      }
      if (displayHeight > maxHeight) {
        displayWidth = (displayWidth * maxHeight) / displayHeight;
        displayHeight = maxHeight;
      }

      canvas.width = displayWidth;
      canvas.height = displayHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(newImg, 0, 0, displayWidth, displayHeight);

      saveToHistory();
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
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.95);
      });

      const formData = new FormData();
      formData.append('image', blob, 'current_image.jpg');
      formData.append('prompt', aiPrompt);
      formData.append('edit_mode', editMode);

      if (editMode === 'point' && clickPoints.length > 0) {
        formData.append('coordinates', JSON.stringify(clickPoints));
      }

      referenceImages.forEach((refImage, index) => {
        formData.append('reference_images[]', refImage, `reference_${index}.jpg`);
      });

      const response = await fetch('/api/v1/imagen/edit_image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        const errorObj = {
          error: error.error || 'AI処理に失敗しました',
          details: error.details,
          suggestion: error.suggestion
        };
        throw new Error(JSON.stringify(errorObj));
      }

      const data = await response.json();

      if (data.success && data.image) {
        const img = new Image();
        img.onload = () => {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          originalImageRef.current = img;
          saveToHistory();
        };
        img.src = `data:image/png;base64,${data.image}`;
      } else {
        throw new Error('画像の編集に失敗しました');
      }
    } catch (err) {
      console.error('AI処理エラー:', err);
      let errorMessage = 'AI処理に失敗しました';
      let suggestion = '';

      if (err.message) {
        errorMessage = err.message;
      }

      try {
        const errorResponse = JSON.parse(err.message);
        if (errorResponse.error) errorMessage = errorResponse.error;
        if (errorResponse.suggestion) suggestion = '\n\n💡 ' + errorResponse.suggestion;
      } catch {
        // JSON parse failed
      }

      alert(errorMessage + suggestion);
    } finally {
      setAiProcessing(false);
    }
  };

  // AI透かしを追加
  const handleAddWatermark = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setWatermarkProcessing(true);

    try {
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.95);
      });

      const formData = new FormData();
      formData.append('image', blob, 'current_image.jpg');

      const response = await fetch('/api/v1/imagen/add_watermark', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '透かしの追加に失敗しました');
      }

      const data = await response.json();

      if (data.success && data.image) {
        const img = new Image();
        img.onload = () => {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          originalImageRef.current = img;
          saveToHistory();
        };
        img.src = `data:image/png;base64,${data.image}`;
      } else {
        throw new Error('透かしの追加に失敗しました');
      }
    } catch (err) {
      console.error('透かし追加エラー:', err);
      alert(err.message || '透かしの追加に失敗しました');
    } finally {
      setWatermarkProcessing(false);
    }
  };

  const handleSave = () => setSaveDialogOpen(true);

  const handleSaveConfirm = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setSaveDialogOpen(false);
    setSaving(true);
    try {
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
        navigate(-1);
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

  const handleSaveCancel = () => setSaveDialogOpen(false);

  const handleAspectRatioChange = (value) => {
    setSelectedAspectRatio(value);
    setSelectedPresetSize(0);
  };

  if (loading) {
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh * var(--vh-correction, 1))', bgcolor: 'background.default' }}>
          <CircularProgress size={60} />
        </Box>
      </ThemeProvider>
    );
  }

  if (error || !photo) {
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh * var(--vh-correction, 1))', bgcolor: 'background.default', gap: 2 }}>
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

      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1, flexDirection: 'column', gap: 2 }}
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

      <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh * var(--vh-correction, 1))', bgcolor: 'background.default' }}>
        <PhotoEditorHeader
          photo={photo}
          isBuilding={isBuilding}
          isMobile={isMobile}
          editHistory={editHistory}
          currentHistoryIndex={currentHistoryIndex}
          saving={saving}
          aiProcessing={aiProcessing}
          onBack={() => navigate(-1)}
          onSave={handleSave}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />

        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', width: '100%', height: '100%', overflow: 'hidden' }}>
            <PhotoEditorCanvas
              canvasRef={canvasRef}
              canvasContainerRef={canvasContainerRef}
              isMobile={isMobile}
              editMode={editMode}
              cropMode={cropMode}
              clickPoints={clickPoints}
              onCanvasClick={handleCanvasClick}
              onCropMouseDown={handleCropMouseDown}
              onCropMouseMove={handleCropMouseMove}
              onCropMouseUp={handleCropMouseUp}
            />

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
              <AIEditingPanel
                isMobile={isMobile}
                editMode={editMode}
                aiPrompt={aiPrompt}
                aiProcessing={aiProcessing}
                referenceImages={referenceImages}
                clickPoints={clickPoints}
                watermarkProcessing={watermarkProcessing}
                onEditModeChange={handleEditModeChange}
                onAiPromptChange={setAiPrompt}
                onAddReferenceImage={handleAddReferenceImage}
                onRemoveReferenceImage={handleRemoveReferenceImage}
                onClearClickPoints={handleClearClickPoints}
                onAddWatermark={handleAddWatermark}
                onAiProcess={handleAiProcess}
              />

              <CropPanel
                isMobile={isMobile}
                cropMode={cropMode}
                selectedAspectRatio={selectedAspectRatio}
                resizeEnabled={resizeEnabled}
                selectedPresetSize={selectedPresetSize}
                cropArea={cropArea}
                aiProcessing={aiProcessing}
                onAspectRatioChange={handleAspectRatioChange}
                onResizeEnabledChange={setResizeEnabled}
                onPresetSizeChange={setSelectedPresetSize}
                onToggleCropMode={handleToggleCropMode}
                onApplyCrop={handleApplyCrop}
                onCancelCrop={handleCancelCrop}
              />

              <BasicAdjustmentsPanel
                brightness={brightness}
                contrast={contrast}
                saturation={saturation}
                onBrightnessChange={setBrightness}
                onContrastChange={setContrast}
                onSaturationChange={setSaturation}
                onReset={handleReset}
              />
            </Box>
          </Box>
        </Box>

        <SaveDialog
          open={saveDialogOpen}
          saveOption={saveOption}
          onSaveOptionChange={setSaveOption}
          onConfirm={handleSaveConfirm}
          onCancel={handleSaveCancel}
        />
      </Box>
    </ThemeProvider>
  );
}
