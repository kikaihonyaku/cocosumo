import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Collapse,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Close as CloseIcon,
  MyLocation as MyLocationIcon,
  Search as SearchIcon,
  Map as MapIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Place as PlaceIcon,
} from '@mui/icons-material';

// 経路タイプの選択肢
const ROUTE_TYPES = [
  { value: 'station', label: '駅まで' },
  { value: 'school', label: '学校まで' },
  { value: 'custom', label: 'カスタム' },
];

// 移動手段の選択肢
const TRAVEL_MODES = [
  { value: 'walking', label: '徒歩' },
  { value: 'driving', label: '車' },
  { value: 'transit', label: '電車' },
  { value: 'bicycling', label: '自転車' },
];

// フォームの初期値
const INITIAL_FORM_DATA = {
  name: '',
  route_type: 'custom',
  travel_mode: 'walking',
  destination_name: '',
  destination_lat: '',
  destination_lng: '',
  description: '',
  use_building_origin: true,
  origin_name: '',
  origin_lat: null,
  origin_lng: null,
};

export default function RouteEditor({
  open,
  onClose,
  route,
  buildingLocation,
  onSave,
  loading = false,
  isMobile = false,
  onStartMapPick = null, // 外部地図で位置を選択するコールバック (formData, field) => void
  initialLocation = null, // 外部地図から選択された位置 { lat, lng, field: 'destination' | 'origin' }
  initialFormData = null, // 地図選択前のフォームデータを復元用
}) {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [originSearchQuery, setOriginSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [originSearching, setOriginSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [showDestinationMap, setShowDestinationMap] = useState(false);
  const [showOriginMap, setShowOriginMap] = useState(false);
  const [tempMapPosition, setTempMapPosition] = useState(null);
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);
  const originInputRef = useRef(null);
  const destMapRef = useRef(null);
  const originMapRef = useRef(null);
  const destMapInstanceRef = useRef(null);
  const originMapInstanceRef = useRef(null);
  const destMarkerRef = useRef(null);
  const originMarkerRef = useRef(null);

  // フォームの初期化ロジック
  // 優先順位: 1) 地図選択からの復帰（initialFormData + initialLocation）, 2) 既存ルート編集, 3) 新規作成
  useEffect(() => {
    if (!open) return; // ダイアログが閉じている場合は何もしない

    // 外部地図から位置が選択された場合（新規・編集どちらでも優先）
    if (initialLocation?.lat && initialLocation?.lng) {
      const coordsName = `${initialLocation.lat.toFixed(6)}, ${initialLocation.lng.toFixed(6)}`;
      const isOrigin = initialLocation.field === 'origin';

      if (initialFormData) {
        // 地図選択前のフォームデータを復元し、選択された位置を上書き
        if (isOrigin) {
          setFormData({
            ...initialFormData,
            use_building_origin: false, // 明示的にfalseを設定
            origin_lat: initialLocation.lat,
            origin_lng: initialLocation.lng,
            origin_name: coordsName, // 座標から名前を設定
          });
          setSearchQuery(initialFormData.destination_name || '');
          setOriginSearchQuery(coordsName);
        } else {
          setFormData({
            ...initialFormData,
            destination_lat: initialLocation.lat,
            destination_lng: initialLocation.lng,
            destination_name: coordsName, // 座標から名前を設定
          });
          setSearchQuery(coordsName);
          setOriginSearchQuery(initialFormData.origin_name || '');
        }
      } else {
        // フォームデータがない場合は新規作成として位置のみ設定
        if (isOrigin) {
          setFormData({
            ...INITIAL_FORM_DATA,
            use_building_origin: false,
            origin_name: coordsName,
            origin_lat: initialLocation.lat,
            origin_lng: initialLocation.lng,
          });
          setSearchQuery('');
          setOriginSearchQuery(coordsName);
        } else {
          setFormData({
            ...INITIAL_FORM_DATA,
            destination_name: coordsName,
            destination_lat: initialLocation.lat,
            destination_lng: initialLocation.lng,
          });
          setSearchQuery(coordsName);
          setOriginSearchQuery('');
        }
      }
    } else if (route) {
      // 既存ルート編集モード（initialLocationがない場合）
      const hasCustomOrigin = route.origin_latlng &&
        buildingLocation &&
        (Math.abs(route.origin_latlng.lat - buildingLocation.lat) > 0.00001 ||
         Math.abs(route.origin_latlng.lng - buildingLocation.lng) > 0.00001);

      setFormData({
        name: route.name || '',
        route_type: route.route_type || 'custom',
        travel_mode: route.travel_mode || 'walking',
        destination_name: route.destination_name || '',
        destination_lat: route.destination_latlng?.lat || '',
        destination_lng: route.destination_latlng?.lng || '',
        description: route.description || '',
        use_building_origin: !hasCustomOrigin,
        origin_name: hasCustomOrigin ? (route.origin_name || '') : '',
        origin_lat: hasCustomOrigin ? route.origin_latlng?.lat : null,
        origin_lng: hasCustomOrigin ? route.origin_latlng?.lng : null,
      });
      setSearchQuery(route.destination_name || '');
      setOriginSearchQuery(hasCustomOrigin ? (route.origin_name || '') : '');
    } else {
      // 新規作成時はリセット
      setFormData(INITIAL_FORM_DATA);
      setSearchQuery('');
      setOriginSearchQuery('');
    }
    setSearchError(null);
    setShowDestinationMap(false);
    setShowOriginMap(false);
    setTempMapPosition(null);
  }, [route, open, buildingLocation, initialLocation, initialFormData]);

  // Google Places Autocomplete の初期化
  useEffect(() => {
    if (!open || !window.google?.maps?.places) return;

    const input = inputRef.current;
    if (!input) return;

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ['establishment', 'geocode'],
      componentRestrictions: { country: 'jp' },
      fields: ['name', 'geometry', 'formatted_address'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const name = place.name || place.formatted_address;

        setFormData((prev) => ({
          ...prev,
          destination_name: name,
          destination_lat: lat,
          destination_lng: lng,
        }));
        setSearchQuery(name);

        // 経路名が空の場合は自動設定
        if (!formData.name) {
          const typeLabel = ROUTE_TYPES.find((t) => t.value === formData.route_type)?.label || '';
          setFormData((prev) => ({
            ...prev,
            name: `${name}${typeLabel ? `（${typeLabel}）` : ''}`,
          }));
        }
      }
    });

    autocompleteRef.current = autocomplete;

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [open, formData.route_type, formData.name]);

  // 住所検索（手動）
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchError(null);

    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await new Promise((resolve, reject) => {
        geocoder.geocode({ address: searchQuery }, (results, status) => {
          if (status === 'OK' && results[0]) {
            resolve(results[0]);
          } else {
            reject(new Error('住所が見つかりませんでした'));
          }
        });
      });

      const location = result.geometry.location;
      setFormData((prev) => ({
        ...prev,
        destination_name: result.formatted_address,
        destination_lat: location.lat(),
        destination_lng: location.lng(),
      }));
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearching(false);
    }
  };

  // 開始位置の住所検索
  const handleOriginSearch = async () => {
    if (!originSearchQuery.trim()) return;

    setOriginSearching(true);
    setSearchError(null);

    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await new Promise((resolve, reject) => {
        geocoder.geocode({ address: originSearchQuery }, (results, status) => {
          if (status === 'OK' && results[0]) {
            resolve(results[0]);
          } else {
            reject(new Error('住所が見つかりませんでした'));
          }
        });
      });

      const location = result.geometry.location;
      setFormData((prev) => ({
        ...prev,
        origin_name: result.formatted_address,
        origin_lat: location.lat(),
        origin_lng: location.lng(),
      }));
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setOriginSearching(false);
    }
  };

  // 地図の初期化（目的地用）
  const initDestinationMap = useCallback(() => {
    if (!destMapRef.current || !window.google?.maps) return;

    const center = formData.destination_lat && formData.destination_lng
      ? { lat: formData.destination_lat, lng: formData.destination_lng }
      : buildingLocation
        ? { lat: parseFloat(buildingLocation.lat), lng: parseFloat(buildingLocation.lng) }
        : { lat: 35.6762, lng: 139.6503 };

    const map = new window.google.maps.Map(destMapRef.current, {
      center,
      zoom: 16,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    destMapInstanceRef.current = map;

    // 既存の位置にマーカーを表示
    if (formData.destination_lat && formData.destination_lng) {
      destMarkerRef.current = new window.google.maps.Marker({
        position: { lat: formData.destination_lat, lng: formData.destination_lng },
        map,
        draggable: true,
      });
      setTempMapPosition({ lat: formData.destination_lat, lng: formData.destination_lng });

      destMarkerRef.current.addListener('dragend', () => {
        const pos = destMarkerRef.current.getPosition();
        setTempMapPosition({ lat: pos.lat(), lng: pos.lng() });
      });
    }

    // 地図クリックでマーカーを配置
    map.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setTempMapPosition({ lat, lng });

      if (destMarkerRef.current) {
        destMarkerRef.current.setPosition({ lat, lng });
      } else {
        destMarkerRef.current = new window.google.maps.Marker({
          position: { lat, lng },
          map,
          draggable: true,
        });

        destMarkerRef.current.addListener('dragend', () => {
          const pos = destMarkerRef.current.getPosition();
          setTempMapPosition({ lat: pos.lat(), lng: pos.lng() });
        });
      }
    });
  }, [formData.destination_lat, formData.destination_lng, buildingLocation]);

  // 地図の初期化（開始位置用）
  const initOriginMap = useCallback(() => {
    if (!originMapRef.current || !window.google?.maps) return;

    const center = formData.origin_lat && formData.origin_lng
      ? { lat: formData.origin_lat, lng: formData.origin_lng }
      : buildingLocation
        ? { lat: parseFloat(buildingLocation.lat), lng: parseFloat(buildingLocation.lng) }
        : { lat: 35.6762, lng: 139.6503 };

    const map = new window.google.maps.Map(originMapRef.current, {
      center,
      zoom: 16,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    originMapInstanceRef.current = map;

    // 既存の位置にマーカーを表示
    if (formData.origin_lat && formData.origin_lng) {
      originMarkerRef.current = new window.google.maps.Marker({
        position: { lat: formData.origin_lat, lng: formData.origin_lng },
        map,
        draggable: true,
      });
      setTempMapPosition({ lat: formData.origin_lat, lng: formData.origin_lng });

      originMarkerRef.current.addListener('dragend', () => {
        const pos = originMarkerRef.current.getPosition();
        setTempMapPosition({ lat: pos.lat(), lng: pos.lng() });
      });
    }

    // 地図クリックでマーカーを配置
    map.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setTempMapPosition({ lat, lng });

      if (originMarkerRef.current) {
        originMarkerRef.current.setPosition({ lat, lng });
      } else {
        originMarkerRef.current = new window.google.maps.Marker({
          position: { lat, lng },
          map,
          draggable: true,
        });

        originMarkerRef.current.addListener('dragend', () => {
          const pos = originMarkerRef.current.getPosition();
          setTempMapPosition({ lat: pos.lat(), lng: pos.lng() });
        });
      }
    });
  }, [formData.origin_lat, formData.origin_lng, buildingLocation]);

  // 目的地地図の表示切り替え
  useEffect(() => {
    if (showDestinationMap) {
      setTimeout(initDestinationMap, 100);
    } else {
      if (destMarkerRef.current) {
        destMarkerRef.current.setMap(null);
        destMarkerRef.current = null;
      }
      destMapInstanceRef.current = null;
    }
  }, [showDestinationMap, initDestinationMap]);

  // 開始位置地図の表示切り替え
  useEffect(() => {
    if (showOriginMap) {
      setTimeout(initOriginMap, 100);
    } else {
      if (originMarkerRef.current) {
        originMarkerRef.current.setMap(null);
        originMarkerRef.current = null;
      }
      originMapInstanceRef.current = null;
    }
  }, [showOriginMap, initOriginMap]);

  // 目的地を地図から確定
  const handleConfirmDestinationFromMap = () => {
    if (tempMapPosition) {
      setFormData((prev) => ({
        ...prev,
        destination_lat: tempMapPosition.lat,
        destination_lng: tempMapPosition.lng,
        destination_name: prev.destination_name || `${tempMapPosition.lat.toFixed(6)}, ${tempMapPosition.lng.toFixed(6)}`,
      }));
      setShowDestinationMap(false);
      setTempMapPosition(null);
    }
  };

  // 開始位置を地図から確定
  const handleConfirmOriginFromMap = () => {
    if (tempMapPosition) {
      setFormData((prev) => ({
        ...prev,
        origin_lat: tempMapPosition.lat,
        origin_lng: tempMapPosition.lng,
        origin_name: prev.origin_name || `${tempMapPosition.lat.toFixed(6)}, ${tempMapPosition.lng.toFixed(6)}`,
      }));
      setShowOriginMap(false);
      setTempMapPosition(null);
    }
  };

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = () => {
    // バリデーション
    if (!formData.name.trim()) {
      setSearchError('経路名を入力してください');
      return;
    }
    if (!formData.destination_lat || !formData.destination_lng) {
      setSearchError('目的地を検索して選択してください');
      return;
    }

    onSave(formData);
  };

  const isEdit = !!route;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography component="span" variant="h6">{isEdit ? '経路を編集' : '経路を追加'}</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {/* 経路タイプ */}
          <FormControl fullWidth size="small">
            <InputLabel>経路タイプ</InputLabel>
            <Select
              value={formData.route_type}
              onChange={handleChange('route_type')}
              label="経路タイプ"
            >
              {ROUTE_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 経路名 */}
          <TextField
            label="経路名"
            value={formData.name}
            onChange={handleChange('name')}
            size="small"
            fullWidth
            required
            placeholder="例: 最寄り駅まで"
          />

          {/* 開始位置 */}
          <Box sx={{ bgcolor: 'grey.50', p: 1.5, borderRadius: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.use_building_origin}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      use_building_origin: e.target.checked,
                      origin_lat: e.target.checked ? null : prev.origin_lat,
                      origin_lng: e.target.checked ? null : prev.origin_lng,
                      origin_name: e.target.checked ? '' : prev.origin_name,
                    }));
                    if (e.target.checked) {
                      setShowOriginMap(false);
                      setOriginSearchQuery('');
                    }
                  }}
                  size="small"
                />
              }
              label={
                <Typography variant="body2">
                  建物位置を開始位置として使用
                  {buildingLocation && (
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      ({parseFloat(buildingLocation.lat).toFixed(6)}, {parseFloat(buildingLocation.lng).toFixed(6)})
                    </Typography>
                  )}
                </Typography>
              }
            />

            <Collapse in={!formData.use_building_origin}>
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  開始位置
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
                    <TextField
                      inputRef={originInputRef}
                      value={originSearchQuery}
                      onChange={(e) => setOriginSearchQuery(e.target.value)}
                      size="small"
                      fullWidth
                      placeholder="住所や施設名を入力..."
                      onKeyPress={(e) => e.key === 'Enter' && handleOriginSearch()}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: isMobile ? 'flex-end' : 'flex-start' }}>
                    <IconButton onClick={handleOriginSearch} disabled={originSearching} title="検索">
                      {originSearching ? <CircularProgress size={20} /> : <SearchIcon />}
                    </IconButton>
                    {/* 外部地図が使えない場合のみダイアログ内地図を表示 */}
                    {!onStartMapPick && (
                      <IconButton
                        onClick={() => {
                          setShowOriginMap(!showOriginMap);
                          setShowDestinationMap(false);
                        }}
                        color={showOriginMap ? 'primary' : 'default'}
                        title="ここで地図を展開"
                      >
                        {showOriginMap ? <ExpandLessIcon /> : <MapIcon />}
                      </IconButton>
                    )}
                    {onStartMapPick && (
                      <IconButton
                        onClick={() => onStartMapPick(formData, 'origin')}
                        color="secondary"
                        title="建物詳細の地図から選択"
                      >
                        <PlaceIcon />
                      </IconButton>
                    )}
                  </Box>
                </Box>

                {/* 開始位置の地図選択エリア（外部地図が使えない場合のみ） */}
                <Collapse in={showOriginMap && !onStartMapPick}>
                  <Box sx={{ mt: 1 }}>
                    <Box
                      ref={originMapRef}
                      sx={{
                        height: isMobile ? '35vh' : 250,
                        width: '100%',
                        bgcolor: 'grey.200',
                        borderRadius: 1,
                      }}
                    />
                    {tempMapPosition && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        選択位置: {tempMapPosition.lat.toFixed(6)}, {tempMapPosition.lng.toFixed(6)}
                      </Typography>
                    )}
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={handleConfirmOriginFromMap}
                        disabled={!tempMapPosition}
                      >
                        位置を確定
                      </Button>
                    </Box>
                  </Box>
                </Collapse>

                {formData.origin_lat && formData.origin_lng && !showOriginMap && (
                  <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block' }}>
                    <MyLocationIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                    {formData.origin_name} ({formData.origin_lat.toFixed(6)}, {formData.origin_lng.toFixed(6)})
                  </Typography>
                )}
              </Box>
            </Collapse>
          </Box>

          {/* 目的地検索 */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              目的地
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
                <TextField
                  inputRef={inputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="small"
                  fullWidth
                  placeholder="住所や施設名を入力..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: isMobile ? 'flex-end' : 'flex-start' }}>
                <IconButton onClick={handleSearch} disabled={searching} title="検索">
                  {searching ? <CircularProgress size={20} /> : <SearchIcon />}
                </IconButton>
                {/* 外部地図が使えない場合のみダイアログ内地図を表示 */}
                {!onStartMapPick && (
                  <IconButton
                    onClick={() => {
                      setShowDestinationMap(!showDestinationMap);
                      setShowOriginMap(false);
                    }}
                    color={showDestinationMap ? 'primary' : 'default'}
                    title="ここで地図を展開"
                  >
                    {showDestinationMap ? <ExpandLessIcon /> : <MapIcon />}
                  </IconButton>
                )}
                {onStartMapPick && (
                  <IconButton
                    onClick={() => onStartMapPick(formData, 'destination')}
                    color="secondary"
                    title="建物詳細の地図から選択"
                  >
                    <PlaceIcon />
                  </IconButton>
                )}
              </Box>
            </Box>

            {/* 目的地の地図選択エリア（外部地図が使えない場合のみ） */}
            <Collapse in={showDestinationMap && !onStartMapPick}>
              <Box sx={{ mt: 1 }}>
                <Box
                  ref={destMapRef}
                  sx={{
                    height: isMobile ? '35vh' : 250,
                    width: '100%',
                    bgcolor: 'grey.200',
                    borderRadius: 1,
                  }}
                />
                {tempMapPosition && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    選択位置: {tempMapPosition.lat.toFixed(6)}, {tempMapPosition.lng.toFixed(6)}
                  </Typography>
                )}
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleConfirmDestinationFromMap}
                    disabled={!tempMapPosition}
                  >
                    位置を確定
                  </Button>
                </Box>
              </Box>
            </Collapse>

            {formData.destination_lat && formData.destination_lng && !showDestinationMap && (
              <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block' }}>
                <MyLocationIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                {formData.destination_name} ({formData.destination_lat.toFixed(6)},{' '}
                {formData.destination_lng.toFixed(6)})
              </Typography>
            )}
          </Box>

          {/* 移動手段 */}
          <FormControl fullWidth size="small">
            <InputLabel>移動手段</InputLabel>
            <Select
              value={formData.travel_mode}
              onChange={handleChange('travel_mode')}
              label="移動手段"
            >
              {TRAVEL_MODES.map((mode) => (
                <MenuItem key={mode.value} value={mode.value}>
                  {mode.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 説明 */}
          <TextField
            label="メモ（任意）"
            value={formData.description}
            onChange={handleChange('description')}
            size="small"
            fullWidth
            multiline
            rows={2}
            placeholder="経路に関するメモ..."
          />

          {/* エラー表示 */}
          {searchError && (
            <Alert severity="error" onClose={() => setSearchError(null)}>
              {searchError}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          キャンセル
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : isEdit ? '更新' : '作成'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
