import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Card,
  CardContent,
  CardActionArea,
  useTheme,
  useMediaQuery,
  Alert,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  DirectionsWalk as WalkIcon,
  DirectionsCar as CarIcon,
  Train as TrainIcon,
  DirectionsBike as BikeIcon,
  CheckCircle as CheckIcon,
  AccessTime as TimeIcon,
  Straighten as DistanceIcon,
} from '@mui/icons-material';

// ルートの色設定
const ROUTE_COLORS = {
  selected: '#4285F4', // Google Maps青
  alternatives: ['#EA4335', '#34A853', '#FBBC04', '#9E9E9E'], // 赤、緑、黄、グレー
};

// 移動手段のアイコン
const TRAVEL_MODE_ICONS = {
  walking: WalkIcon,
  driving: CarIcon,
  transit: TrainIcon,
  bicycling: BikeIcon,
};

// 移動手段のラベル
const TRAVEL_MODE_LABELS = {
  walking: '徒歩',
  driving: '車',
  transit: '電車',
  bicycling: '自転車',
};

/**
 * 経路候補選択ダイアログ
 */
export default function RouteAlternativesDialog({
  open,
  onClose,
  candidates = [],
  routeParams = null,
  routeFormData = null,
  onConfirm,
  loading = false,
  error = null,
  buildingLocation = null,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedIndex, setSelectedIndex] = useState(0);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylinesRef = useRef([]);
  const markersRef = useRef([]);

  // 選択中のインデックスをリセット
  useEffect(() => {
    if (open) {
      setSelectedIndex(0);
    }
  }, [open, candidates]);

  // ルートの色を取得
  const getRouteColor = useCallback(
    (index) => {
      if (index === selectedIndex) {
        return ROUTE_COLORS.selected;
      }
      return ROUTE_COLORS.alternatives[index % ROUTE_COLORS.alternatives.length];
    },
    [selectedIndex]
  );

  // ポリラインをデコード
  const decodePolyline = useCallback((encoded) => {
    if (!encoded || !window.google?.maps?.geometry) {
      return [];
    }
    return window.google.maps.geometry.encoding.decodePath(encoded);
  }, []);

  // 地図を初期化・更新
  useEffect(() => {
    if (!open || !window.google?.maps || candidates.length === 0) {
      return;
    }

    // ダイアログが開いた直後はDOMがまだ準備できていない可能性があるため少し遅延
    const timeoutId = setTimeout(() => {
      if (!mapRef.current) {
        return;
      }

      // 前回のポリラインとマーカーをクリア
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      // 地図の初期化（初回のみ）
      if (!mapInstanceRef.current) {
        const defaultCenter = routeParams?.origin || buildingLocation || { lat: 35.6762, lng: 139.6503 };
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
      }

      const map = mapInstanceRef.current;
      const bounds = new window.google.maps.LatLngBounds();

      // 各候補のポリラインを描画
      candidates.forEach((candidate, index) => {
        const path = decodePolyline(candidate.encoded_polyline);
        if (path.length === 0) return;

        const isSelected = index === selectedIndex;

        const polyline = new window.google.maps.Polyline({
          path,
          strokeColor: getRouteColor(index),
          strokeWeight: isSelected ? 6 : 4,
          strokeOpacity: isSelected ? 0.9 : 0.5,
          map,
          zIndex: isSelected ? 100 : index,
        });

        // クリックで選択
        polyline.addListener('click', () => {
          setSelectedIndex(index);
        });

        // マウスオーバーでハイライト
        polyline.addListener('mouseover', () => {
          if (index !== selectedIndex) {
            polyline.setOptions({ strokeOpacity: 0.8, strokeWeight: 5 });
          }
        });

        polyline.addListener('mouseout', () => {
          if (index !== selectedIndex) {
            polyline.setOptions({ strokeOpacity: 0.5, strokeWeight: 4 });
          }
        });

        polylinesRef.current.push(polyline);

        // バウンズに追加
        path.forEach((point) => bounds.extend(point));
      });

      // 出発地マーカー
      if (routeParams?.origin) {
        const originMarker = new window.google.maps.Marker({
          position: routeParams.origin,
          map,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4CAF50',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
          title: '出発地',
        });
        markersRef.current.push(originMarker);
      }

      // 目的地マーカー
      if (routeParams?.destination) {
        const destMarker = new window.google.maps.Marker({
          position: routeParams.destination,
          map,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#F44336',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
          title: '目的地',
        });
        markersRef.current.push(destMarker);
      }

      // 地図をフィット
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 50 });
      }
    }, 100);

    // クリーンアップ
    return () => {
      clearTimeout(timeoutId);
      polylinesRef.current.forEach((p) => {
        window.google?.maps?.event?.clearInstanceListeners(p);
      });
    };
  }, [open, candidates, selectedIndex, routeParams, buildingLocation, decodePolyline, getRouteColor]);

  // 選択変更時にポリラインのスタイルを更新
  useEffect(() => {
    polylinesRef.current.forEach((polyline, index) => {
      const isSelected = index === selectedIndex;
      polyline.setOptions({
        strokeColor: getRouteColor(index),
        strokeWeight: isSelected ? 6 : 4,
        strokeOpacity: isSelected ? 0.9 : 0.5,
        zIndex: isSelected ? 100 : index,
      });
    });
  }, [selectedIndex, getRouteColor]);

  // ダイアログを閉じる時のクリーンアップ
  useEffect(() => {
    if (!open) {
      polylinesRef.current.forEach((p) => p?.setMap(null));
      polylinesRef.current = [];
      markersRef.current.forEach((m) => m?.setMap(null));
      markersRef.current = [];
      mapInstanceRef.current = null;
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm(selectedIndex);
  };

  const TravelIcon = TRAVEL_MODE_ICONS[routeFormData?.travel_mode] || WalkIcon;
  const travelModeLabel = TRAVEL_MODE_LABELS[routeFormData?.travel_mode] || '徒歩';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          height: isMobile ? '100%' : '80vh',
          maxHeight: isMobile ? '100%' : '80vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">経路を選択</Typography>
          <Chip
            icon={<TravelIcon sx={{ fontSize: 16 }} />}
            label={travelModeLabel}
            size="small"
            variant="outlined"
          />
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          p: 0,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* 地図エリア */}
        <Box
          ref={mapRef}
          sx={{
            flex: isMobile ? '0 0 50%' : '1 1 60%',
            minHeight: isMobile ? '40vh' : 300,
            bgcolor: 'grey.200',
          }}
        />

        {/* 候補リスト */}
        <Box
          sx={{
            flex: isMobile ? '1 1 auto' : '0 0 40%',
            overflow: 'auto',
            p: 2,
            bgcolor: 'grey.50',
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {candidates.length === 0 && !loading && (
            <Typography color="text.secondary" textAlign="center">
              経路候補がありません
            </Typography>
          )}

          {loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                経路を検索中...
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {candidates.map((candidate, index) => {
              const isSelected = index === selectedIndex;
              const routeColor = getRouteColor(index);

              return (
                <Card
                  key={index}
                  variant="outlined"
                  sx={{
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    borderWidth: isSelected ? 2 : 1,
                    bgcolor: isSelected ? 'rgba(1, 104, 183, 0.08)' : 'background.paper',
                    transition: 'all 0.2s',
                  }}
                >
                  <CardActionArea onClick={() => setSelectedIndex(index)}>
                    <CardContent sx={{ py: 1.5, px: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        {/* 色インジケーター */}
                        <Box
                          sx={{
                            width: 8,
                            height: '100%',
                            minHeight: 50,
                            borderRadius: 1,
                            bgcolor: routeColor,
                            flexShrink: 0,
                          }}
                        />

                        {/* 経路情報 */}
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              ルート {index + 1}
                            </Typography>
                            {isSelected && (
                              <CheckIcon color="primary" sx={{ fontSize: 20 }} />
                            )}
                          </Box>

                          {candidate.summary && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1 }}
                              noWrap
                            >
                              {candidate.summary}
                            </Typography>
                          )}

                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <DistanceIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                              <Typography variant="body2" fontWeight={500}>
                                {candidate.distance_text}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <TimeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                              <Typography variant="body2" fontWeight={500}>
                                {candidate.duration_text}
                              </Typography>
                            </Box>
                          </Box>

                          {candidate.warnings && candidate.warnings.length > 0 && (
                            <Typography
                              variant="caption"
                              color="warning.main"
                              sx={{ mt: 0.5, display: 'block' }}
                            >
                              {candidate.warnings[0]}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          キャンセル
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={loading || candidates.length === 0}
        >
          {loading ? <CircularProgress size={20} /> : 'この経路を保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
