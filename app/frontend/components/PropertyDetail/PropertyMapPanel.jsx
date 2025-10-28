import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material';
import {
  MyLocation as MyLocationIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Map as MapIcon,
} from '@mui/icons-material';
import MapChatWidget from './MapChatWidget';

export default function PropertyMapPanel({ property, onLocationUpdate, visible = true, onFormChange, onSave, selectedPlace, onPlaceClick }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const selectedPlaceMarkerRef = useRef(null); // AI応答から選択された場所のマーカー
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingLocation, setEditingLocation] = useState(false);
  const [addressSearchOpen, setAddressSearchOpen] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const originalPositionRef = useRef(null);

  // Google Maps初期化
  useEffect(() => {
    if (!window.google || !window.google.maps) {
      loadGoogleMaps();
    } else {
      initializeMap();
    }
  }, []);

  // 物件情報が更新された時にマーカーを更新し、元の位置を保存
  useEffect(() => {
    if (mapInstanceRef.current && property?.latitude && property?.longitude) {
      const lat = parseFloat(property.latitude);
      const lng = parseFloat(property.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        updateMarkerPosition(lat, lng);
        // 元の位置を保存（編集開始時の比較用）
        if (!originalPositionRef.current) {
          originalPositionRef.current = { lat, lng };
        }
      }
    }
  }, [property]);

  // 未保存の変更を親コンポーネントに通知
  useEffect(() => {
    if (onFormChange) {
      onFormChange(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onFormChange]);

  // 表示状態が変更された時にマップをリサイズ
  useEffect(() => {
    if (visible && mapInstanceRef.current) {
      // 少し遅延させてからリサイズを実行（DOM更新を待つ）
      setTimeout(() => {
        if (mapInstanceRef.current) {
          window.google?.maps?.event?.trigger(mapInstanceRef.current, 'resize');
          // 中心位置も再設定
          if (property?.latitude && property?.longitude) {
            const lat = parseFloat(property.latitude);
            const lng = parseFloat(property.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
              mapInstanceRef.current.setCenter({ lat, lng });
            }
          }
        }
      }, 100);
    }
  }, [visible, property]);

  // AI応答から選択された場所を地図上に表示
  useEffect(() => {
    if (selectedPlace && selectedPlace.address && mapInstanceRef.current && window.google?.maps) {
      console.log('Selected place:', selectedPlace);

      // 既存の選択場所マーカーを削除
      if (selectedPlaceMarkerRef.current) {
        selectedPlaceMarkerRef.current.setMap(null);
        selectedPlaceMarkerRef.current = null;
      }

      // Geocoding APIで住所を緯度経度に変換
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: selectedPlace.address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();

          console.log('Geocoded location:', { lat, lng });

          // 地図を選択された場所にズームして中心を移動
          mapInstanceRef.current.setCenter({ lat, lng });
          mapInstanceRef.current.setZoom(17); // より詳細なズームレベル

          // 選択された場所に別のマーカーを追加（異なる色で表示）
          const marker = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapInstanceRef.current,
            title: selectedPlace.address,
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png', // 青いマーカー
            },
          });

          // 情報ウィンドウを表示
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px;">
                <h4 style="margin: 0 0 4px 0; color: #1976d2;">選択された場所</h4>
                <p style="margin: 0; font-size: 14px; color: #666;">${selectedPlace.address}</p>
              </div>
            `,
          });

          infoWindow.open(mapInstanceRef.current, marker);

          marker.addListener('click', () => {
            infoWindow.open(mapInstanceRef.current, marker);
          });

          selectedPlaceMarkerRef.current = marker;

        } else {
          console.error('Geocoding failed:', status);
        }
      });
    }
  }, [selectedPlace]);

  const loadGoogleMaps = () => {
    const apiKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || '';
    const isValidApiKey = apiKey && apiKey !== 'your_google_maps_api_key_here';

    // 有効なAPIキーがない場合は地図読み込みをスキップ
    if (!isValidApiKey) {
      console.warn('Google Maps APIキーが設定されていないため、地図を表示できません');
      setLoading(false);
      setMapLoaded(false);
      return;
    }

    // 既にscriptタグが存在するかチェック（重複読み込み防止）
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('Google Maps API already loaded, waiting for initialization...');
      // 既に読み込まれている場合は、APIが完全に利用可能になるまで待機
      const checkAndInit = (retries = 0) => {
        if (window.google && window.google.maps && window.google.maps.Map) {
          initializeMap();
        } else if (retries < 20) {
          setTimeout(() => checkAndInit(retries + 1), 200);
        } else {
          console.error('Google Maps APIの初期化タイムアウト');
          setLoading(false);
          setMapLoaded(false);
        }
      };
      checkAndInit();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = initializeMap;
    script.onerror = () => {
      console.error('Google Maps APIの読み込みに失敗しました');
      setLoading(false);
      setMapLoaded(false);
    };
    document.head.appendChild(script);
  };

  const initializeMap = () => {
    try {
      // Google Maps APIが完全に読み込まれているかチェック
      if (!window.google || !window.google.maps || !window.google.maps.Map) {
        console.warn('Google Maps APIがまだ読み込まれていません。リトライします...');
        // 少し待ってから再試行
        setTimeout(() => {
          if (window.google && window.google.maps && window.google.maps.Map) {
            initializeMap();
          } else {
            console.error('Google Maps APIの読み込みに失敗しました');
            setLoading(false);
            setMapLoaded(false);
          }
        }, 500);
        return;
      }

      const defaultLat = parseFloat(property?.latitude) || 35.6762;
      const defaultLng = parseFloat(property?.longitude) || 139.6503;

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: defaultLat, lng: defaultLng },
        zoom: 16,
        mapTypeId: 'roadmap', // 文字列で指定（MapTypeId.ROADMAPの代わり）
        streetViewControl: true,
        fullscreenControl: false,
        zoomControl: false,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle?.DROPDOWN_MENU || 0,
          position: window.google.maps.ControlPosition?.TOP_RIGHT || 2,
        },
      });

      const marker = new window.google.maps.Marker({
        position: { lat: defaultLat, lng: defaultLng },
        map: map,
        title: property?.name || '物件',
        draggable: false,
      });

      // 情報ウィンドウ
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h4 style="margin: 0 0 4px 0; color: #1976d2;">${property?.name || '物件'}</h4>
            <p style="margin: 0; font-size: 14px; color: #666;">${property?.address || ''}</p>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      setMapLoaded(true);
      setLoading(false);

    } catch (error) {
      console.error('地図の初期化に失敗しました:', error);
      setLoading(false);
    }
  };

  const updateMarkerPosition = (lat, lng) => {
    if (markerRef.current && mapInstanceRef.current) {
      const position = { lat, lng };
      markerRef.current.setPosition(position);
      mapInstanceRef.current.setCenter(position);
    }
  };

  const handleLocationEdit = async () => {
    if (!editingLocation) {
      // 編集開始
      setEditingLocation(true);
      if (markerRef.current) {
        markerRef.current.setDraggable(true);

        markerRef.current.addListener('dragend', (event) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();

          // 元の位置と比較して変更があれば未保存フラグを立てる
          if (originalPositionRef.current) {
            const latChanged = Math.abs(originalPositionRef.current.lat - lat) > 0.000001;
            const lngChanged = Math.abs(originalPositionRef.current.lng - lng) > 0.000001;
            if (latChanged || lngChanged) {
              setHasUnsavedChanges(true);
            }
          }

          onLocationUpdate(lat, lng);
        });
      }
    } else {
      // 編集完了 - 変更があれば自動保存
      setEditingLocation(false);
      if (markerRef.current) {
        markerRef.current.setDraggable(false);
      }

      // 未保存の変更がある場合は自動保存
      if (hasUnsavedChanges && onSave && property) {
        try {
          await onSave({
            ...property,
            latitude: property.latitude,
            longitude: property.longitude
          });
          // 保存成功後、未保存フラグをクリア
          setHasUnsavedChanges(false);
          // 元の位置を更新
          if (property.latitude && property.longitude) {
            originalPositionRef.current = {
              lat: parseFloat(property.latitude),
              lng: parseFloat(property.longitude)
            };
          }
        } catch (err) {
          console.error('位置情報の保存に失敗:', err);
        }
      }
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom();
      mapInstanceRef.current.setZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom();
      mapInstanceRef.current.setZoom(currentZoom - 1);
    }
  };

  const handleMyLocation = () => {
    if (navigator.geolocation && mapInstanceRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          mapInstanceRef.current.setCenter({ lat, lng });
          mapInstanceRef.current.setZoom(16);
        },
        (error) => {
          console.error('現在地の取得に失敗しました:', error);
        }
      );
    }
  };

  const handleAddressSearch = async () => {
    if (!searchAddress.trim()) return;

    try {
      setSearchLoading(true);
      const geocoder = new window.google.maps.Geocoder();

      geocoder.geocode({ address: searchAddress }, async (results, status) => {
        setSearchLoading(false);

        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();

          // 元の位置と比較して変更があるか確認
          let hasChanges = false;
          if (originalPositionRef.current) {
            const latChanged = Math.abs(originalPositionRef.current.lat - lat) > 0.000001;
            const lngChanged = Math.abs(originalPositionRef.current.lng - lng) > 0.000001;
            hasChanges = latChanged || lngChanged;
          }

          updateMarkerPosition(lat, lng);
          onLocationUpdate(lat, lng);
          setAddressSearchOpen(false);
          setSearchAddress('');

          // 変更がある場合は自動保存
          if (hasChanges && onSave && property) {
            try {
              await onSave({
                ...property,
                latitude: lat,
                longitude: lng
              });
              // 保存成功後、元の位置を更新
              originalPositionRef.current = { lat, lng };
            } catch (err) {
              console.error('位置情報の保存に失敗:', err);
              setHasUnsavedChanges(true);
            }
          }
        } else {
          alert('住所が見つかりませんでした');
        }
      });
    } catch (error) {
      setSearchLoading(false);
      console.error('住所検索に失敗しました:', error);
    }
  };

  const handleFullscreen = () => {
    if (mapRef.current) {
      if (mapRef.current.requestFullscreen) {
        mapRef.current.requestFullscreen();
      }
    }
  };

  return (
    <Box sx={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* 地図ヘッダー */}
      <Box sx={{
        px: 2,
        py: 1.5,
        bgcolor: 'background.paper',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        minHeight: 56
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 600, fontSize: '1.05rem' }}>
            <MapIcon color="primary" sx={{ fontSize: 26 }} />
            物件位置
          </Typography>
          {property?.address && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              {property.address}
            </Typography>
          )}
        </Box>
      </Box>

      {/* 地図コンテナ */}
      <Box
        ref={mapRef}
        sx={{
          flex: 1,
          width: '100%',
          bgcolor: 'grey.100',
        }}
      />

      {/* ローディング・エラー表示 */}
      {loading && (
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2,
          textAlign: 'center',
        }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            地図を読み込んでいます...
          </Typography>
        </Box>
      )}

      {/* APIキー未設定の場合の表示 */}
      {!loading && !mapLoaded && (
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2,
          textAlign: 'center',
          p: 2,
        }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            地図表示
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Google Maps APIキーが設定されていません
          </Typography>
          {property?.latitude && property?.longitude && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2">
                緯度: {parseFloat(property.latitude).toFixed(6)}
              </Typography>
              <Typography variant="body2">
                経度: {parseFloat(property.longitude).toFixed(6)}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* 地図コントロール */}
      {mapLoaded && (
        <Box sx={{
          position: 'absolute',
          top: 80,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          zIndex: 1,
        }}>
          <Tooltip title="ズームイン">
            <IconButton
              size="small"
              onClick={handleZoomIn}
              sx={{ bgcolor: 'white', boxShadow: 2 }}
            >
              <ZoomInIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="ズームアウト">
            <IconButton
              size="small"
              onClick={handleZoomOut}
              sx={{ bgcolor: 'white', boxShadow: 2 }}
            >
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="現在地">
            <IconButton
              size="small"
              onClick={handleMyLocation}
              sx={{ bgcolor: 'white', boxShadow: 2 }}
            >
              <MyLocationIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="フルスクリーン">
            <IconButton
              size="small"
              onClick={handleFullscreen}
              sx={{ bgcolor: 'white', boxShadow: 2 }}
            >
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* 位置編集コントロール - 左上に配置 */}
      {mapLoaded && (
        <Box sx={{
          position: 'absolute',
          top: 80,
          left: 16,
          display: 'flex',
          gap: 1,
          zIndex: 1,
        }}>
          <Button
            variant="contained"
            size="small"
            startIcon={editingLocation ? <CheckIcon /> : <EditIcon />}
            onClick={handleLocationEdit}
            color={editingLocation ? "success" : "primary"}
          >
            {editingLocation ? '完了' : '位置編集'}
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={() => setAddressSearchOpen(true)}
            sx={{ bgcolor: 'white' }}
          >
            住所検索
          </Button>
        </Box>
      )}

      {/* 住所検索ダイアログ */}
      <Dialog
        open={addressSearchOpen}
        onClose={() => setAddressSearchOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>住所検索</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="住所を入力"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddressSearch();
              }
            }}
            placeholder="例: 東京都千代田区丸の内1-1-1"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddressSearchOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleAddressSearch}
            variant="contained"
            disabled={searchLoading || !searchAddress.trim()}
          >
            {searchLoading ? <CircularProgress size={20} /> : '検索'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* AIチャットウィジェット */}
      {mapLoaded && (
        <MapChatWidget
          property={property}
          onPlaceClick={onPlaceClick}
        />
      )}
    </Box>
  );
}
