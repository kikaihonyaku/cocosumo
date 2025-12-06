import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Fab,
  Tooltip,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Zoom,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
} from '@mui/material';
import {
  Home as HomeIcon,
  MyLocation as MyLocationIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Visibility as StreetViewIcon,
  Info as InfoIcon,
  Add as AddIcon,
  RadioButtonUnchecked as CircleIcon,
  Gesture as PolygonIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useGoogleMaps } from '../../hooks/useGoogleMaps';

export default function MapContainer({
  onMarkerSelect,
  selectedLayers = [],
  availableLayers = [],
  rightPanelVisible,
  onToggleRightPanel,
  selectedObject,
  properties = [],
  isLoading = false,
  onNewBuildingClick,
  // 描画ツール関連のprops
  drawingMode = null,
  onDrawingModeChange = null,
  geoFilter = null,
  onGeoFilterChange = null,
  onClearGeoFilter = null,
  onApplyFilters = null,
  showDrawingTools = false,
  // GISフィルタが有効かどうか
  hasGeoFilter = false,
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapType, setMapType] = useState('roadmap');
  const [layerLoadingStates, setLayerLoadingStates] = useState({});

  // 描画関連のref
  const circleRef = useRef(null);
  const polygonRef = useRef(null);
  const drawingManagerRef = useRef(null);
  // レイヤーポリゴンのInfoWindow参照（1つだけ表示）
  const layerInfoWindowRef = useRef(null);

  const {
    map,
    isLoaded,
    error,
    addMarker,
    clearMarkers,
    showInfoWindow,
    panToLocation,
    fitBounds
  } = useGoogleMaps('google-map', {
    center: { lat: 35.6812, lng: 139.7671 }, // 東京
    zoom: 10,
    mapTypeId: mapType
  });

  // 物件タイプに応じたアイコンを取得
  const getPropertyIcon = (property) => {
    // GISフィルタが有効で、範囲外の物件は紫で表示
    if (hasGeoFilter && property.isInGeoFilter === false) {
      return 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png'; // 範囲外 - 紫
    }

    // 空室率に応じてアイコンの色を決定（Google Maps標準アイコンを使用）
    const vacancyRate = property.room_cnt > 0 ? property.free_cnt / property.room_cnt : 0;

    if (vacancyRate === 0) {
      return 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'; // 満室 - 青
    } else if (vacancyRate <= 0.3) {
      return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'; // 低空室率 - 緑
    } else if (vacancyRate <= 0.6) {
      return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png'; // 中空室率 - 黄
    } else if (vacancyRate <= 0.9) {
      return 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png'; // 高空室率 - オレンジ
    } else {
      return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'; // 満空室 - 赤
    }
  };

  // InfoWindow用のHTMLコンテンツを生成（MUI風のスタイル）
  const createInfoWindowContent = (property) => {
    const vacancyRate = property.room_cnt > 0 ? ((property.free_cnt / property.room_cnt) * 100).toFixed(1) : '0.0';

    return `
      <div style="padding: 16px; min-width: 280px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <h3 style="margin: 0 0 12px 0; color: #333; font-size: 1.25rem; font-weight: 600;">${property.name}</h3>
        <p style="margin: 8px 0; color: #666; font-size: 0.875rem;">${property.address}</p>
        <div style="margin: 16px 0; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; padding: 8px; background: #f5f5f5; border-radius: 4px;">
            <span style="font-weight: 500; color: #666;">総戸数</span>
            <span style="font-weight: 600; color: #333;">${property.room_cnt || 0}戸</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px; background: #f5f5f5; border-radius: 4px;">
            <span style="font-weight: 500; color: #666;">空室数</span>
            <span style="font-weight: 600; color: #333;">${property.free_cnt || 0}戸</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px; background: #f5f5f5; border-radius: 4px;">
            <span style="font-weight: 500; color: #666;">空室率</span>
            <span style="font-weight: 600; color: ${vacancyRate == 0 ? '#4caf50' : vacancyRate <= 10 ? '#2196f3' : vacancyRate <= 30 ? '#ff9800' : '#f44336'};">${vacancyRate}%</span>
          </div>
        </div>
        <div style="margin-top: 16px; display: flex; gap: 8px;">
          <button onclick="window.openBuildingDetail(${property.id})"
                  style="background-color: #0168B7; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 500; flex: 1;">
            詳細ページを開く
          </button>
        </div>
      </div>
    `;
  };

  // フルスクリーンの切り替え
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // 地図タイプの変更
  const changeMapType = (newMapType) => {
    setMapType(newMapType);
    if (map) {
      map.setMapTypeId(newMapType);
    }
  };

  // 現在地に移動
  const goToCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        panToLocation(pos, 15);
      });
    }
  };

  // 初期位置に戻る
  const goToHomeLocation = () => {
    panToLocation({ lat: 35.6812, lng: 139.7671 }, 10);
  };

  // 全体表示
  const fitToAllProperties = () => {
    if (properties.length > 0) {
      const positions = properties
        .filter(p => p.latitude && p.longitude)
        .map(p => ({
          lat: parseFloat(p.latitude),
          lng: parseFloat(p.longitude)
        }));
      if (positions.length > 0) {
        fitBounds(positions);
      }
    }
  };

  // Google Maps PathをWKT形式に変換
  const pathToWKT = (path) => {
    const coordinates = [];
    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      coordinates.push(`${point.lng()} ${point.lat()}`);
    }
    // ポリゴンを閉じる
    if (coordinates.length > 0) {
      coordinates.push(coordinates[0]);
    }
    return `POLYGON((${coordinates.join(', ')}))`;
  };

  // 円形geoFilterを作成するヘルパー関数
  const createCircleGeoFilter = (center, radius) => ({
    type: 'circle',
    circle: { center: { lat: center.lat(), lng: center.lng() }, radius },
    polygon: null,
  });

  // ポリゴンgeoFilterを作成するヘルパー関数
  const createPolygonGeoFilter = (wkt) => ({
    type: 'polygon',
    circle: null,
    polygon: wkt,
  });

  // geoFilterを更新して検索を実行するヘルパー関数
  const updateGeoFilterAndSearch = useCallback((newGeoFilter) => {
    if (onGeoFilterChange) {
      onGeoFilterChange(newGeoFilter);
    }
    if (onApplyFilters) {
      onApplyFilters(null, newGeoFilter);
    }
  }, [onGeoFilterChange, onApplyFilters]);

  // 描画をクリア
  const clearDrawings = useCallback(() => {
    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
  }, []);

  // 描画クリアハンドラ
  const handleClearDrawing = useCallback(() => {
    clearDrawings();
    const clearedGeoFilter = { type: null, circle: null, polygon: null };
    onClearGeoFilter?.();
    onDrawingModeChange?.(null);
    updateGeoFilterAndSearch(clearedGeoFilter);
  }, [clearDrawings, onClearGeoFilter, onDrawingModeChange, updateGeoFilterAndSearch]);

  // Drawing Managerの初期化
  useEffect(() => {
    if (!map || !window.google || !showDrawingTools) return;

    // DrawingManagerを作成
    const drawingManager = new window.google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false, // カスタムUIを使用
      circleOptions: {
        fillColor: '#0168B7',
        fillOpacity: 0.2,
        strokeWeight: 2,
        strokeColor: '#0168B7',
        clickable: true,
        editable: true,
        draggable: true,
      },
      polygonOptions: {
        fillColor: '#0168B7',
        fillOpacity: 0.2,
        strokeWeight: 2,
        strokeColor: '#0168B7',
        clickable: true,
        editable: true,
        draggable: true,
      },
    });

    drawingManager.setMap(map);
    drawingManagerRef.current = drawingManager;

    // 円が描画完了した時のイベント
    window.google.maps.event.addListener(drawingManager, 'circlecomplete', (circle) => {
      clearDrawings();
      circleRef.current = circle;

      const newGeoFilter = createCircleGeoFilter(circle.getCenter(), circle.getRadius());
      onGeoFilterChange?.(newGeoFilter);
      onDrawingModeChange?.(null);
      drawingManager.setDrawingMode(null);

      // 円の変更イベントをリッスン
      window.google.maps.event.addListener(circle, 'center_changed', () => {
        const updatedGeoFilter = createCircleGeoFilter(circle.getCenter(), circle.getRadius());
        updateGeoFilterAndSearch(updatedGeoFilter);
      });

      window.google.maps.event.addListener(circle, 'radius_changed', () => {
        const updatedGeoFilter = createCircleGeoFilter(circle.getCenter(), circle.getRadius());
        updateGeoFilterAndSearch(updatedGeoFilter);
      });

      onApplyFilters?.(null, newGeoFilter);
    });

    // ポリゴンが描画完了した時のイベント
    window.google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon) => {
      clearDrawings();
      polygonRef.current = polygon;

      const path = polygon.getPath();
      const newGeoFilter = createPolygonGeoFilter(pathToWKT(path));
      onGeoFilterChange?.(newGeoFilter);
      onDrawingModeChange?.(null);
      drawingManager.setDrawingMode(null);

      // ポリゴンの変更イベントをリッスン
      const handlePathChange = () => {
        const updatedGeoFilter = createPolygonGeoFilter(pathToWKT(polygon.getPath()));
        updateGeoFilterAndSearch(updatedGeoFilter);
      };

      window.google.maps.event.addListener(path, 'set_at', handlePathChange);
      window.google.maps.event.addListener(path, 'insert_at', handlePathChange);

      onApplyFilters?.(null, newGeoFilter);
    });

    return () => {
      drawingManager.setMap(null);
    };
  }, [map, showDrawingTools, onGeoFilterChange, onDrawingModeChange, onApplyFilters, clearDrawings]);

  // 描画モードの変更
  useEffect(() => {
    if (!drawingManagerRef.current || !showDrawingTools) return;

    if (drawingMode === 'circle') {
      drawingManagerRef.current.setDrawingMode(window.google.maps.drawing.OverlayType.CIRCLE);
    } else if (drawingMode === 'polygon') {
      drawingManagerRef.current.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
    } else {
      drawingManagerRef.current.setDrawingMode(null);
    }
  }, [drawingMode, showDrawingTools]);


  // レイヤーポリゴンの状態管理（useRefを使用して無限ループを防ぐ）
  // 各レイヤーのポリゴンを動的に管理（レイヤーIDをキーとした配列）
  const layerPolygonsRef = React.useRef({});

  // ポリゴンを地図に表示（汎用化）
  const displayLayerPolygons = useCallback((geojson, layerId, color, opacity, attribution) => {
    if (!map || !geojson || !geojson.features) {
      return;
    }

    // 既存のポリゴンをクリア
    if (layerPolygonsRef.current[layerId]) {
      layerPolygonsRef.current[layerId].forEach(polygon => {
        polygon.setMap(null);
      });
    }

    const newPolygons = [];
    const fillOpacity = opacity || 0.15;

    geojson.features.forEach((feature, index) => {
      const geometry = feature.geometry;
      const properties = feature.properties;

      // GeoJSON座標からWKT形式のPOLYGONを生成するヘルパー関数
      const geometryToWKT = (geom) => {
        if (geom.type === 'Polygon') {
          const rings = geom.coordinates.map(ring => {
            const coords = ring.map(coord => `${coord[0]} ${coord[1]}`).join(', ');
            return `(${coords})`;
          });
          return `POLYGON(${rings.join(', ')})`;
        } else if (geom.type === 'MultiPolygon') {
          // MultiPolygonの場合は最初のポリゴンのみ使用
          const firstPolygon = geom.coordinates[0];
          const rings = firstPolygon.map(ring => {
            const coords = ring.map(coord => `${coord[0]} ${coord[1]}`).join(', ');
            return `(${coords})`;
          });
          return `POLYGON(${rings.join(', ')})`;
        }
        return null;
      };

      const createPolygonFromPaths = (paths, originalGeometry) => {
        const polygon = new google.maps.Polygon({
          paths: paths,
          strokeColor: color,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: color,
          fillOpacity: fillOpacity,
          map: map,
        });

        // マウスホバー時のハイライト効果
        polygon.addListener('mouseover', () => {
          polygon.setOptions({
            strokeWeight: 4,
            fillOpacity: fillOpacity + 0.2,
          });
        });

        polygon.addListener('mouseout', () => {
          polygon.setOptions({
            strokeWeight: 2,
            fillOpacity: fillOpacity,
          });
        });

        // クリックイベントを追加
        polygon.addListener('click', (event) => {
          const formattedAttribution = attribution ? attribution.replace(/\n/g, '<br>') : '';
          // プロパティから表示するフィールドを動的に構築
          const displayName = properties.school_name || properties.name || '不明';
          const displayDetails = [
            properties.name && properties.school_name ? properties.name : null,
            properties.city,
            properties.school_type,
          ].filter(Boolean);

          // 元のGeoJSON座標からWKT形式を生成（クロージャで保持）
          const wkt = geometryToWKT(originalGeometry);

          if (!wkt) {
            console.warn('Invalid geometry: could not convert to WKT');
            return;
          }

          const newGeoFilter = {
            type: 'polygon',
            circle: null,
            polygon: wkt,
          };

          // geoFilterを更新して検索を実行
          if (onGeoFilterChange) {
            onGeoFilterChange(newGeoFilter);
          }
          // GISフィルタAPIを呼び出して物件IDを取得
          if (onApplyFilters) {
            onApplyFilters(newGeoFilter);
          }

          // 既存のInfoWindowを閉じる
          if (layerInfoWindowRef.current) {
            layerInfoWindowRef.current.close();
          }

          // InfoWindowを表示（範囲指定したことを示す）
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; font-family: 'Segoe UI', sans-serif;">
                <h4 style="margin: 0 0 8px 0; font-size: 1rem; color: #0168B7;">${displayName}</h4>
                <p style="margin: 4px 0; font-size: 0.875rem; color: #333; font-weight: 600;">この範囲で絞り込みました</p>
                ${displayDetails.map(d => `<p style="margin: 4px 0; font-size: 0.875rem; color: #666;">${d}</p>`).join('')}
                ${formattedAttribution ? `<p style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 0.75rem; color: #999;">${formattedAttribution}</p>` : ''}
              </div>
            `,
            position: event.latLng,
          });
          infoWindow.open(map);

          // 新しいInfoWindowを参照に保存
          layerInfoWindowRef.current = infoWindow;
        });

        return polygon;
      };

      if (geometry.type === 'Polygon') {
        const paths = geometry.coordinates.map(ring =>
          ring.map(coord => ({ lat: coord[1], lng: coord[0] }))
        );
        newPolygons.push(createPolygonFromPaths(paths, geometry));
      } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach((polygonCoords, idx) => {
          const paths = polygonCoords.map(ring =>
            ring.map(coord => ({ lat: coord[1], lng: coord[0] }))
          );
          // MultiPolygonの各パーツに対応するgeometryを作成
          const partGeometry = {
            type: 'Polygon',
            coordinates: polygonCoords
          };
          newPolygons.push(createPolygonFromPaths(paths, partGeometry));
        });
      }
    });

    layerPolygonsRef.current[layerId] = newPolygons;
  }, [map, onGeoFilterChange, onApplyFilters]);

  // レイヤーのGeoJSONデータを取得
  const fetchLayerGeoJson = useCallback(async (layerId, color, opacity, attribution) => {
    try {
      // ローディング開始
      setLayerLoadingStates(prev => ({ ...prev, [layerId]: true }));

      const response = await fetch(`/api/v1/map_layers/${layerId}/geojson`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const geojson = await response.json();
        displayLayerPolygons(geojson, layerId, color, opacity, attribution);
      } else if (response.status === 401) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error(`Error fetching layer (${layerId}):`, error);
    } finally {
      // ローディング終了
      setLayerLoadingStates(prev => ({ ...prev, [layerId]: false }));
    }
  }, [displayLayerPolygons]);

  // レイヤーの非表示
  const hideLayer = useCallback((layerId) => {
    if (layerPolygonsRef.current[layerId]) {
      layerPolygonsRef.current[layerId].forEach(polygon => {
        polygon.setMap(null);
      });
      delete layerPolygonsRef.current[layerId];
    }
  }, []);

  // 動的レイヤーの表示/非表示を切り替え
  useEffect(() => {
    if (!isLoaded || !map) return;

    // 利用可能なレイヤーごとに表示/非表示を処理
    availableLayers.forEach(layer => {
      const layerId = layer.id;
      const isSelected = selectedLayers.includes(layerId);

      if (isSelected) {
        // レイヤーが選択されている場合
        const existingPolygons = layerPolygonsRef.current[layerId];
        const needsRedraw = existingPolygons && existingPolygons.length > 0 &&
                           existingPolygons[0]?.strokeColor !== layer.color;

        if (!existingPolygons || existingPolygons.length === 0 || needsRedraw) {
          if (needsRedraw) {
            hideLayer(layerId);
          }
          fetchLayerGeoJson(layerId, layer.color, layer.opacity, layer.attribution);
        }
      } else {
        // レイヤーが選択されていない場合は非表示
        hideLayer(layerId);
      }
    });

    // availableLayersに存在しないが表示されているレイヤーをクリア
    Object.keys(layerPolygonsRef.current).forEach(layerId => {
      const exists = availableLayers.some(l => l.id === layerId);
      if (!exists) {
        hideLayer(layerId);
      }
    });
  }, [selectedLayers, availableLayers, isLoaded, map, fetchLayerGeoJson, hideLayer]);

  // 地図が読み込まれたら物件マーカーを配置
  useEffect(() => {
    if (isLoaded && map) {
      // 詳細ページを新しいタブで開く関数
      window.openBuildingDetail = (propertyId) => {
        window.open(`/building/${propertyId}`, '_blank');
      };

      // グローバル関数として物件選択関数を設定（右パネル用）
      window.selectProperty = (propertyId) => {
        const property = properties.find(p => p.id === propertyId);
        if (property && property.latitude && property.longitude) {
          // InfoWindowを表示
          const content = createInfoWindowContent(property);
          // マーカーを取得してInfoWindowを表示（マーカーが存在する場合）
          showInfoWindow(content, null, {
            lat: parseFloat(property.latitude),
            lng: parseFloat(property.longitude)
          });

          // 地図の中心を移動
          panToLocation({
            lat: parseFloat(property.latitude),
            lng: parseFloat(property.longitude)
          }, 15);

          // 右パネルに詳細情報を表示
          if (onMarkerSelect) {
            onMarkerSelect('property', property);
          }
        }
      };

      // 既存のマーカーをクリア
      clearMarkers();

      // 各物件にマーカーを配置
      properties.forEach(property => {
        // 座標が設定されている物件のみマーカーを表示
        if (property.latitude && property.longitude) {
          const iconUrl = getPropertyIcon(property);

          const marker = addMarker(property.id, {
            position: {
              lat: parseFloat(property.latitude),
              lng: parseFloat(property.longitude)
            },
            title: property.name,
            icon: iconUrl,
            onClick: (marker, id) => {
              const content = createInfoWindowContent(property);
              showInfoWindow(content, marker);

              // 地図の中心を移動
              panToLocation({
                lat: parseFloat(property.latitude),
                lng: parseFloat(property.longitude)
              }, 15);

              // 右パネルに詳細情報を表示（MapSystemで自動的に右パネルも開かれる）
              if (onMarkerSelect) {
                onMarkerSelect('property', property);
              }
            }
          });
        }
      });

      // 全ての物件が見えるように地図をフィット（GISフィルタがない場合のみ）
      // GISフィルタがある場合は、ユーザーが範囲を指定しているのでリサイズしない
      if (!hasGeoFilter && properties.length > 0) {
        const positions = properties
          .filter(p => p.latitude && p.longitude)
          .map(p => ({
            lat: parseFloat(p.latitude),
            lng: parseFloat(p.longitude)
          }));
        if (positions.length > 0) {
          fitBounds(positions);
        }
      }
    }

    return () => {
      if (window.openPropertyDetail) {
        delete window.openPropertyDetail;
      }
      if (window.selectProperty) {
        delete window.selectProperty;
      }
    };
  }, [isLoaded, map, properties, hasGeoFilter]);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 常にmap要素を配置し、状態に応じてオーバーレイを表示 */}
      <Box
        id="google-map"
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: 0,
        }}
      >
        {/* Google Maps will be rendered here */}
      </Box>

      {/* エラー時のオーバーレイ */}
      {error && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(248, 249, 250, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            backdropFilter: 'blur(2px)',
          }}
        >
          <Card sx={{ maxWidth: 400, p: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="error" gutterBottom>
                地図の読み込みエラー
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {error}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Google Maps APIキーの設定を確認してください。
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* ローディング時のオーバーレイ */}
      {!isLoaded && !error && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(248, 249, 250, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            backdropFilter: 'blur(2px)',
          }}
        >
          <Card sx={{ maxWidth: 300, p: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  border: '4px solid',
                  borderColor: 'grey.300',
                  borderTopColor: 'primary.main',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
              <Typography variant="body2" color="text.secondary">
                地図を読み込み中...
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* 描画ツールバー */}
      {showDrawingTools && (
        <Paper
          elevation={2}
          sx={{
            position: 'absolute',
            top: 16,
            right: 60,
            p: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            zIndex: 100,
            bgcolor: 'primary.main',
            color: 'white',
          }}
        >
          <Typography variant="caption" sx={{ px: 1, color: 'white' }}>
            範囲指定
          </Typography>
          <ToggleButtonGroup
            value={drawingMode}
            exclusive
            onChange={(e, newMode) => onDrawingModeChange && onDrawingModeChange(newMode)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                },
                '&.Mui-selected': {
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                  },
                },
              },
            }}
          >
            <ToggleButton value="circle" aria-label="円で指定">
              <Tooltip title="円で範囲を指定">
                <CircleIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="polygon" aria-label="フリーハンドで指定">
              <Tooltip title="フリーハンドで範囲を指定">
                <PolygonIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
          {geoFilter && geoFilter.type && (
            <Tooltip title="範囲をクリア">
              <IconButton
                size="small"
                onClick={handleClearDrawing}
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Paper>
      )}

      {/* 範囲情報表示 */}
      {showDrawingTools && geoFilter && geoFilter.type === 'circle' && geoFilter.circle && (
        <Paper
          elevation={2}
          sx={{
            position: 'absolute',
            top: 70,
            right: 60,
            p: 1.5,
            zIndex: 100,
            bgcolor: 'primary.main',
            color: 'white',
          }}
        >
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            半径: {(geoFilter.circle.radius / 1000).toFixed(2)} km
          </Typography>
        </Paper>
      )}

      {/* 地図上の操作ボタン群 */}
      <Box
        sx={{
          position: 'absolute',
          top: 60, // GoogleMapボタンと重ならないよう調整
          right: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          zIndex: 100,
        }}
      >
        <Tooltip title="全体表示" placement="left">
          <Fab
            size="small"
            color="primary"
            onClick={fitToAllProperties}
            sx={{
              boxShadow: 2,
              '&:hover': {
                transform: 'scale(1.1)',
              },
            }}
          >
            <HomeIcon />
          </Fab>
        </Tooltip>

        <Tooltip title="初期位置に戻る" placement="left">
          <Fab
            size="small"
            color="primary"
            onClick={goToHomeLocation}
            sx={{
              boxShadow: 2,
              '&:hover': {
                transform: 'scale(1.1)',
              },
            }}
          >
            <MyLocationIcon />
          </Fab>
        </Tooltip>

        <Tooltip title="フルスクリーン" placement="left">
          <Fab
            size="small"
            color="primary"
            onClick={toggleFullscreen}
            sx={{
              boxShadow: 2,
              '&:hover': {
                transform: 'scale(1.1)',
              },
            }}
          >
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </Fab>
        </Tooltip>

        {/* 物件詳細表示ボタン - 右ペインが非表示の場合に表示 */}
        {!rightPanelVisible && (
          <Tooltip title="物件詳細を表示" placement="left">
            <Fab
              size="small"
              color="primary"
              onClick={onToggleRightPanel}
              sx={{
                boxShadow: 2,
                '&:hover': {
                  transform: 'scale(1.1)',
                },
              }}
            >
              <InfoIcon />
            </Fab>
          </Tooltip>
        )}

        {/* 物件新規登録ボタン */}
        <Tooltip title="物件新規登録" placement="left">
          <Fab
            size="small"
            color="secondary"
            onClick={onNewBuildingClick}
            sx={{
              boxShadow: 2,
              '&:hover': {
                transform: 'scale(1.1)',
              },
            }}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      </Box>

      {/* レイヤー読み込み中インジケーター */}
      {Object.entries(layerLoadingStates).some(([_, isLoading]) => isLoading) && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 2,
            boxShadow: 3,
            padding: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            zIndex: 100,
            backdropFilter: 'blur(4px)',
          }}
        >
          <CircularProgress size={20} thickness={4} />
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            レイヤーを読み込み中...
          </Typography>
        </Box>
      )}

    </Box>
  );
}
