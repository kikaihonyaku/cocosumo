import React, { useState, useRef, useEffect } from 'react';
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
  Alert,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardActionArea,
  CardContent,
  Chip
} from '@mui/material';
import {
  DirectionsWalk as DirectionsWalkIcon,
  DirectionsTransit as DirectionsTransitIcon,
  DirectionsCar as DirectionsCarIcon,
  Search as SearchIcon,
  MyLocation as MyLocationIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import axios from 'axios';

export default function CustomerRouteDialog({
  open,
  onClose,
  accessToken,
  buildingLocation,
  onCreated
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    destination_name: '',
    destination_address: '',
    destination_lat: null,
    destination_lng: null,
    travel_mode: 'walking'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addressSearching, setAddressSearching] = useState(false);
  const [inputMode, setInputMode] = useState('address');

  // 経路候補関連
  const [routeCandidates, setRouteCandidates] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const buildingMarkerRef = useRef(null);
  const polylineRefs = useRef([]);

  const steps = ['目的地を設定', '経路を選択'];

  // 地図の初期化
  useEffect(() => {
    if (open && inputMode === 'map' && mapRef.current && !mapInstanceRef.current) {
      initMap();
    }
  }, [open, inputMode]);

  // 経路プレビュー用の地図初期化
  useEffect(() => {
    if (open && activeStep === 1 && mapRef.current && routeCandidates.length > 0) {
      initRoutePreviewMap();
    }
  }, [open, activeStep, routeCandidates]);

  // ダイアログが閉じたらリセット
  useEffect(() => {
    if (!open) {
      setFormData({
        name: '',
        destination_name: '',
        destination_address: '',
        destination_lat: null,
        destination_lng: null,
        travel_mode: 'walking'
      });
      setError(null);
      setInputMode('address');
      setActiveStep(0);
      setRouteCandidates([]);
      setSelectedRouteIndex(null);
      clearMapResources();
    }
  }, [open]);

  const clearMapResources = () => {
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
    if (buildingMarkerRef.current) {
      buildingMarkerRef.current.setMap(null);
      buildingMarkerRef.current = null;
    }
    polylineRefs.current.forEach(p => p.setMap(null));
    polylineRefs.current = [];
    mapInstanceRef.current = null;
  };

  const initMap = async () => {
    if (!window.google?.maps || !buildingLocation) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: buildingLocation.lat, lng: buildingLocation.lng },
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;

    buildingMarkerRef.current = new window.google.maps.Marker({
      position: { lat: buildingLocation.lat, lng: buildingLocation.lng },
      map: map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      title: '物件位置',
    });

    map.addListener('click', (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      setFormData(prev => ({
        ...prev,
        destination_lat: lat,
        destination_lng: lng,
      }));

      if (markerRef.current) {
        markerRef.current.setPosition({ lat, lng });
      } else {
        markerRef.current = new window.google.maps.Marker({
          position: { lat, lng },
          map: map,
          icon: {
            path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: '#EA4335',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            rotation: 180,
          },
          title: '目的地',
          draggable: true,
        });

        markerRef.current.addListener('dragend', (e) => {
          setFormData(prev => ({
            ...prev,
            destination_lat: e.latLng.lat(),
            destination_lng: e.latLng.lng(),
          }));
        });
      }

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setFormData(prev => ({
            ...prev,
            destination_address: results[0].formatted_address,
          }));
        }
      });
    });
  };

  const initRoutePreviewMap = () => {
    if (!window.google?.maps || !buildingLocation) return;

    clearMapResources();

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: buildingLocation.lat, lng: buildingLocation.lng },
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;

    // 物件マーカー
    buildingMarkerRef.current = new window.google.maps.Marker({
      position: { lat: buildingLocation.lat, lng: buildingLocation.lng },
      map: map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      title: '物件位置',
    });

    // 目的地マーカー
    if (formData.destination_lat && formData.destination_lng) {
      markerRef.current = new window.google.maps.Marker({
        position: { lat: formData.destination_lat, lng: formData.destination_lng },
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#EA4335',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          rotation: 180,
        },
        title: '目的地',
      });
    }

    // 経路候補のポリラインを描画
    const colors = ['#1976d2', '#388e3c', '#f57c00'];
    const bounds = new window.google.maps.LatLngBounds();

    routeCandidates.forEach((candidate, index) => {
      if (candidate.encoded_polyline) {
        const path = window.google.maps.geometry.encoding.decodePath(candidate.encoded_polyline);
        const polyline = new window.google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: colors[index % colors.length],
          strokeOpacity: selectedRouteIndex === index ? 1.0 : 0.5,
          strokeWeight: selectedRouteIndex === index ? 6 : 4,
          map: map,
        });

        polyline.addListener('click', () => {
          setSelectedRouteIndex(index);
        });

        polylineRefs.current.push(polyline);
        path.forEach(p => bounds.extend(p));
      }
    });

    // 物件と目的地をboundsに含める
    bounds.extend({ lat: buildingLocation.lat, lng: buildingLocation.lng });
    if (formData.destination_lat && formData.destination_lng) {
      bounds.extend({ lat: formData.destination_lat, lng: formData.destination_lng });
    }

    map.fitBounds(bounds, { padding: 50 });
  };

  // 選択された経路のスタイルを更新
  useEffect(() => {
    if (polylineRefs.current.length > 0 && selectedRouteIndex !== null) {
      const colors = ['#1976d2', '#388e3c', '#f57c00'];
      polylineRefs.current.forEach((polyline, index) => {
        polyline.setOptions({
          strokeOpacity: selectedRouteIndex === index ? 1.0 : 0.3,
          strokeWeight: selectedRouteIndex === index ? 6 : 3,
        });
      });
    }
  }, [selectedRouteIndex]);

  const handleAddressSearch = async () => {
    if (!formData.destination_address.trim()) return;

    setAddressSearching(true);
    setError(null);

    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await new Promise((resolve, reject) => {
        geocoder.geocode({ address: formData.destination_address }, (results, status) => {
          if (status === 'OK' && results[0]) {
            resolve(results[0]);
          } else {
            reject(new Error('住所が見つかりませんでした'));
          }
        });
      });

      const location = result.geometry.location;
      setFormData(prev => ({
        ...prev,
        destination_lat: location.lat(),
        destination_lng: location.lng(),
        destination_address: result.formatted_address,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setAddressSearching(false);
    }
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      // バリデーション
      if (!formData.name.trim()) {
        setError('経路名を入力してください');
        return;
      }
      if (!formData.destination_lat || !formData.destination_lng) {
        setError('目的地を設定してください');
        return;
      }

      // 経路候補を取得
      setPreviewLoading(true);
      setError(null);

      try {
        const response = await axios.post(
          `/api/v1/customer/${accessToken}/routes/preview`,
          { customer_route: formData }
        );

        if (response.data.candidates && response.data.candidates.length > 0) {
          setRouteCandidates(response.data.candidates);
          setSelectedRouteIndex(0);
          setActiveStep(1);
        } else {
          setError('経路が見つかりませんでした');
        }
      } catch (err) {
        console.error('Failed to preview routes:', err);
        setError(err.response?.data?.error || '経路の取得に失敗しました');
      } finally {
        setPreviewLoading(false);
      }
    }
  };

  const handleBack = () => {
    setActiveStep(0);
    setRouteCandidates([]);
    setSelectedRouteIndex(null);
    clearMapResources();
  };

  const handleSubmit = async () => {
    if (selectedRouteIndex === null) {
      setError('経路を選択してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `/api/v1/customer/${accessToken}/routes`,
        {
          customer_route: formData,
          selected_index: selectedRouteIndex
        }
      );

      if (response.data.success) {
        onCreated?.(response.data.route);
        onClose();
      }
    } catch (err) {
      console.error('Failed to create route:', err);
      setError(err.response?.data?.error || '経路の登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getTravelModeIcon = (mode) => {
    switch (mode) {
      case 'walking': return <DirectionsWalkIcon fontSize="small" />;
      case 'transit': return <DirectionsTransitIcon fontSize="small" />;
      case 'driving': return <DirectionsCarIcon fontSize="small" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">経路を追加</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Step 1: 目的地設定 */}
        {activeStep === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="経路名"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="例：会社、最寄り駅、子供の学校"
              required
              fullWidth
            />

            <TextField
              label="目的地名（任意）"
              value={formData.destination_name}
              onChange={(e) => setFormData(prev => ({ ...prev, destination_name: e.target.value }))}
              placeholder="例：〇〇駅、△△会社"
              fullWidth
            />

            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                目的地の設定方法
              </Typography>
              <ToggleButtonGroup
                value={inputMode}
                exclusive
                onChange={(e, newMode) => newMode && setInputMode(newMode)}
                size="small"
                fullWidth
              >
                <ToggleButton value="address">
                  <SearchIcon sx={{ mr: 0.5 }} fontSize="small" />
                  住所入力
                </ToggleButton>
                <ToggleButton value="map">
                  <MyLocationIcon sx={{ mr: 0.5 }} fontSize="small" />
                  地図で選択
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {inputMode === 'address' && (
              <TextField
                label="目的地の住所"
                value={formData.destination_address}
                onChange={(e) => setFormData(prev => ({ ...prev, destination_address: e.target.value }))}
                placeholder="住所を入力して検索"
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleAddressSearch}
                        disabled={addressSearching || !formData.destination_address.trim()}
                      >
                        {addressSearching ? <CircularProgress size={20} /> : <SearchIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddressSearch();
                  }
                }}
                helperText={
                  formData.destination_lat && formData.destination_lng
                    ? '✓ 目的地が設定されました'
                    : '住所を入力してEnterまたは検索ボタンを押してください'
                }
              />
            )}

            {inputMode === 'map' && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  地図上をクリックして目的地を設定してください
                </Typography>
                <Box
                  ref={mapRef}
                  sx={{
                    height: 300,
                    width: '100%',
                    borderRadius: 1,
                    bgcolor: 'grey.200',
                  }}
                />
                {formData.destination_address && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    選択した場所: {formData.destination_address}
                  </Typography>
                )}
              </Box>
            )}

            <FormControl fullWidth>
              <InputLabel>移動手段</InputLabel>
              <Select
                value={formData.travel_mode}
                onChange={(e) => setFormData(prev => ({ ...prev, travel_mode: e.target.value }))}
                label="移動手段"
              >
                <MenuItem value="walking">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DirectionsWalkIcon fontSize="small" />
                    徒歩
                  </Box>
                </MenuItem>
                <MenuItem value="transit">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DirectionsTransitIcon fontSize="small" />
                    電車
                  </Box>
                </MenuItem>
                <MenuItem value="driving">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DirectionsCarIcon fontSize="small" />
                    車
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Step 2: 経路選択 */}
        {activeStep === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              経路を選択してください（地図上のラインまたは下のカードをクリック）
            </Typography>

            {/* 経路プレビュー地図 */}
            <Box
              ref={mapRef}
              sx={{
                height: 300,
                width: '100%',
                borderRadius: 1,
                bgcolor: 'grey.200',
              }}
            />

            {/* 経路候補リスト */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {routeCandidates.map((candidate, index) => (
                <Card
                  key={index}
                  variant="outlined"
                  sx={{
                    border: selectedRouteIndex === index ? '2px solid' : '1px solid',
                    borderColor: selectedRouteIndex === index ? 'primary.main' : 'divider',
                    bgcolor: selectedRouteIndex === index ? 'action.selected' : 'background.paper',
                  }}
                >
                  <CardActionArea onClick={() => setSelectedRouteIndex(index)}>
                    <CardContent sx={{ py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: ['#1976d2', '#388e3c', '#f57c00'][index % 3],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                      }}>
                        {index + 1}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2">
                          {candidate.summary || `経路 ${index + 1}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {candidate.distance_text} / 約{Math.ceil(candidate.duration_seconds / 60)}分
                        </Typography>
                      </Box>
                      {selectedRouteIndex === index && (
                        <Chip
                          icon={<CheckIcon />}
                          label="選択中"
                          color="primary"
                          size="small"
                        />
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {activeStep === 0 ? (
          <>
            <Button onClick={onClose} disabled={previewLoading}>
              キャンセル
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={previewLoading || !formData.name.trim() || !formData.destination_lat}
            >
              {previewLoading ? <CircularProgress size={24} /> : '次へ'}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleBack} disabled={loading} startIcon={<ArrowBackIcon />}>
              戻る
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading || selectedRouteIndex === null}
            >
              {loading ? <CircularProgress size={24} /> : '経路を追加'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
