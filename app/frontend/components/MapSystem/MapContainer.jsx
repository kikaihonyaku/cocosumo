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
  stores = [],
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
  // 地図から位置を選択するモード
  mapPickMode = false,
  onMapPick = null,
  onCancelMapPick = null,
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapType, setMapType] = useState('roadmap');
  const [layerLoadingStates, setLayerLoadingStates] = useState({});

  // 描画関連のref
  const circleRef = useRef(null);
  const polygonRef = useRef(null);
  // 自前描画用の状態
  const isDrawingRef = useRef(false);
  const drawingStartPointRef = useRef(null);
  const polygonPointsRef = useRef([]);
  const previewCircleRef = useRef(null);
  const previewPolygonRef = useRef(null);
  const previewPolylineRef = useRef(null);
  const drawingListenersRef = useRef([]);
  // レイヤーポリゴンのInfoWindow参照（1つだけ表示）
  const layerInfoWindowRef = useRef(null);
  // 店舗マーカーのref
  const storeMarkersRef = useRef([]);
  // レイヤーポイントマーカーのref（住所ポイント等）
  const layerPointMarkersRef = useRef({});
  // 地図選択モードのマーカーref
  const pickMarkerRef = useRef(null);
  // 地図選択モードのクリックリスナーref
  const pickClickListenerRef = useRef(null);

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

  // InfoWindowヘッダー用のDOM要素を生成
  const createInfoWindowHeader = (property) => {
    const header = document.createElement('div');
    header.style.cssText = 'cursor: pointer; color: #0168B7; font-weight: 600;';
    header.textContent = property.name;
    header.onclick = () => window.openBuildingDetail(property.id);
    return header;
  };

  // InfoWindow用のHTMLコンテンツを生成（シンプル版）
  const createInfoWindowContent = (property) => {
    return `
      <div style="padding: 8px 12px 12px; min-width: 200px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <p style="margin: 0; color: #666; font-size: 0.875rem;">${property.address}</p>
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

  // 描画オプション（共通）
  const drawingOptions = {
    fillColor: '#0168B7',
    fillOpacity: 0.2,
    strokeWeight: 2,
    strokeColor: '#0168B7',
    clickable: true,
    editable: true,
    draggable: true,
  };

  // プレビュー用オプション（編集不可）
  const previewOptions = {
    fillColor: '#0168B7',
    fillOpacity: 0.1,
    strokeWeight: 2,
    strokeColor: '#0168B7',
    strokeOpacity: 0.5,
    clickable: false,
    editable: false,
    draggable: false,
  };

  // 描画リスナーをクリアするヘルパー関数
  const clearDrawingListeners = useCallback(() => {
    drawingListenersRef.current.forEach(listener => {
      window.google?.maps?.event?.removeListener(listener);
    });
    drawingListenersRef.current = [];
  }, []);

  // プレビューをクリアするヘルパー関数
  const clearPreviews = useCallback(() => {
    if (previewCircleRef.current) {
      previewCircleRef.current.setMap(null);
      previewCircleRef.current = null;
    }
    if (previewPolygonRef.current) {
      previewPolygonRef.current.setMap(null);
      previewPolygonRef.current = null;
    }
    if (previewPolylineRef.current) {
      previewPolylineRef.current.setMap(null);
      previewPolylineRef.current = null;
    }
    polygonPointsRef.current = [];
    isDrawingRef.current = false;
    drawingStartPointRef.current = null;
  }, []);

  // 円の描画を完了するヘルパー関数
  const finishCircleDrawing = useCallback((center, radius) => {
    clearDrawings();
    clearPreviews();

    const circle = new window.google.maps.Circle({
      ...drawingOptions,
      center: center,
      radius: radius,
      map: map,
    });

    circleRef.current = circle;

    const newGeoFilter = createCircleGeoFilter(center, radius);
    onGeoFilterChange?.(newGeoFilter);
    onDrawingModeChange?.(null);

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
  }, [map, clearDrawings, clearPreviews, onGeoFilterChange, onDrawingModeChange, onApplyFilters, updateGeoFilterAndSearch]);

  // ポリゴンの描画を完了するヘルパー関数
  const finishPolygonDrawing = useCallback((points) => {
    if (points.length < 3) return;

    clearDrawings();
    clearPreviews();

    const polygon = new window.google.maps.Polygon({
      ...drawingOptions,
      paths: points,
      map: map,
    });

    polygonRef.current = polygon;

    const path = polygon.getPath();
    const newGeoFilter = createPolygonGeoFilter(pathToWKT(path));
    onGeoFilterChange?.(newGeoFilter);
    onDrawingModeChange?.(null);

    // ポリゴンの変更イベントをリッスン
    const handlePathChange = () => {
      const updatedGeoFilter = createPolygonGeoFilter(pathToWKT(polygon.getPath()));
      updateGeoFilterAndSearch(updatedGeoFilter);
    };

    window.google.maps.event.addListener(path, 'set_at', handlePathChange);
    window.google.maps.event.addListener(path, 'insert_at', handlePathChange);

    onApplyFilters?.(null, newGeoFilter);
  }, [map, clearDrawings, clearPreviews, onGeoFilterChange, onDrawingModeChange, onApplyFilters, updateGeoFilterAndSearch]);

  // 描画モードの変更と自前描画ロジック
  useEffect(() => {
    if (!map || !window.google || !showDrawingTools) return;

    // 既存のリスナーをクリア
    clearDrawingListeners();
    clearPreviews();

    if (drawingMode === 'circle') {
      // 円描画モード
      map.setOptions({ draggableCursor: 'crosshair' });

      const mousedownListener = map.addListener('mousedown', (e) => {
        isDrawingRef.current = true;
        drawingStartPointRef.current = e.latLng;

        // プレビュー円を作成
        previewCircleRef.current = new window.google.maps.Circle({
          ...previewOptions,
          center: e.latLng,
          radius: 0,
          map: map,
        });

        // ドラッグ中は地図の移動を無効化
        map.setOptions({ draggable: false });
      });

      const mousemoveListener = map.addListener('mousemove', (e) => {
        if (!isDrawingRef.current || !drawingStartPointRef.current || !previewCircleRef.current) return;

        // 中心からの距離を計算
        const center = drawingStartPointRef.current;
        const radius = window.google.maps.geometry?.spherical?.computeDistanceBetween(center, e.latLng);

        if (radius !== undefined) {
          previewCircleRef.current.setRadius(radius);
        } else {
          // geometry ライブラリがない場合は簡易計算
          const lat1 = center.lat();
          const lng1 = center.lng();
          const lat2 = e.latLng.lat();
          const lng2 = e.latLng.lng();
          const R = 6371000; // 地球の半径（メートル）
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLng = (lng2 - lng1) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;
          previewCircleRef.current.setRadius(distance);
        }
      });

      const mouseupListener = map.addListener('mouseup', (e) => {
        if (!isDrawingRef.current || !drawingStartPointRef.current || !previewCircleRef.current) return;

        const center = drawingStartPointRef.current;
        const radius = previewCircleRef.current.getRadius();

        // 地図のドラッグを再度有効化
        map.setOptions({ draggable: true });

        // 最小半径のチェック（10メートル以上）
        if (radius >= 10) {
          finishCircleDrawing(center, radius);
        } else {
          clearPreviews();
        }

        isDrawingRef.current = false;
        drawingStartPointRef.current = null;
      });

      drawingListenersRef.current = [mousedownListener, mousemoveListener, mouseupListener];

    } else if (drawingMode === 'polygon') {
      // ポリゴン描画モード
      map.setOptions({ draggableCursor: 'crosshair' });

      const clickListener = map.addListener('click', (e) => {
        polygonPointsRef.current.push(e.latLng);

        // プレビューポリゴンを更新
        if (polygonPointsRef.current.length >= 3) {
          if (!previewPolygonRef.current) {
            previewPolygonRef.current = new window.google.maps.Polygon({
              ...previewOptions,
              paths: polygonPointsRef.current,
              map: map,
            });
          } else {
            previewPolygonRef.current.setPath(polygonPointsRef.current);
          }
        }

        // プレビューポリラインを更新（最初の2点からでも線を表示）
        if (!previewPolylineRef.current) {
          previewPolylineRef.current = new window.google.maps.Polyline({
            ...previewOptions,
            path: polygonPointsRef.current,
            map: map,
          });
        } else {
          previewPolylineRef.current.setPath(polygonPointsRef.current);
        }
      });

      const dblclickListener = map.addListener('dblclick', (e) => {
        e.stop(); // デフォルトのズームを防止

        if (polygonPointsRef.current.length >= 3) {
          finishPolygonDrawing([...polygonPointsRef.current]);
        } else {
          clearPreviews();
        }
      });

      drawingListenersRef.current = [clickListener, dblclickListener];

    } else {
      // 通常モード
      map.setOptions({ draggableCursor: null, draggable: true });
    }

    return () => {
      clearDrawingListeners();
      if (map) {
        map.setOptions({ draggableCursor: null, draggable: true });
      }
    };
  }, [map, drawingMode, showDrawingTools, clearDrawingListeners, clearPreviews, finishCircleDrawing, finishPolygonDrawing]);


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

  // ポイントを地図に表示（住所ポイント等）
  const displayLayerPoints = useCallback((geojson, layerId, color, opacity, attribution) => {
    if (!map || !geojson || !geojson.features || !window.google) {
      return;
    }

    // 既存のマーカーをクリア
    if (layerPointMarkersRef.current[layerId]) {
      layerPointMarkersRef.current[layerId].forEach(marker => {
        marker.setMap(null);
      });
    }

    const newMarkers = [];

    geojson.features.forEach((feature) => {
      const geometry = feature.geometry;
      const properties = feature.properties;

      if (geometry.type !== 'Point') return;

      const [lng, lat] = geometry.coordinates;

      // カスタムSVGアイコン（小さい円形マーカー）
      const markerSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
          <circle cx="6" cy="6" r="5" fill="${color}" stroke="#ffffff" stroke-width="1" fill-opacity="${opacity || 0.8}"/>
        </svg>
      `;

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: properties.name || properties.full_address || '',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(markerSvg),
          scaledSize: new google.maps.Size(12, 12),
          anchor: new google.maps.Point(6, 6),
        },
        zIndex: 500, // 物件マーカーより下、ポリゴンより上
      });

      // クリックイベント
      marker.addListener('click', () => {
        const formattedAttribution = attribution ? attribution.replace(/\n/g, '<br>') : '';
        const displayName = properties.name || properties.full_address || '住所ポイント';

        // 既存のInfoWindowを閉じる
        if (layerInfoWindowRef.current) {
          layerInfoWindowRef.current.close();
        }

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; font-family: 'Segoe UI', sans-serif; min-width: 150px;">
              <h4 style="margin: 0 0 4px 0; font-size: 0.9rem; color: ${color};">${displayName}</h4>
              ${properties.prefecture ? `<p style="margin: 2px 0; font-size: 0.8rem; color: #666;">${properties.prefecture}${properties.city || ''}${properties.district || ''}${properties.block_number || ''}</p>` : ''}
              ${properties.representative ? '<p style="margin: 2px 0; font-size: 0.75rem; color: #1976d2;">代表点</p>' : ''}
              ${formattedAttribution ? `<p style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 0.7rem; color: #999;">${formattedAttribution}</p>` : ''}
            </div>
          `,
        });
        infoWindow.open(map, marker);
        layerInfoWindowRef.current = infoWindow;
      });

      newMarkers.push(marker);
    });

    layerPointMarkersRef.current[layerId] = newMarkers;
  }, [map]);

  // レイヤーのGeoJSONデータを取得
  const fetchLayerGeoJson = useCallback(async (layerId, color, opacity, attribution, layerType) => {
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

        // レイヤータイプまたはジオメトリタイプに応じて表示方法を切り替え
        if (layerType === 'address_points' ||
            (geojson.features && geojson.features.length > 0 && geojson.features[0].geometry?.type === 'Point')) {
          displayLayerPoints(geojson, layerId, color, opacity, attribution);
        } else {
          displayLayerPolygons(geojson, layerId, color, opacity, attribution);
        }
      } else if (response.status === 401) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error(`Error fetching layer (${layerId}):`, error);
    } finally {
      // ローディング終了
      setLayerLoadingStates(prev => ({ ...prev, [layerId]: false }));
    }
  }, [displayLayerPolygons, displayLayerPoints]);

  // レイヤーの非表示
  const hideLayer = useCallback((layerId) => {
    // ポリゴンをクリア
    if (layerPolygonsRef.current[layerId]) {
      layerPolygonsRef.current[layerId].forEach(polygon => {
        polygon.setMap(null);
      });
      delete layerPolygonsRef.current[layerId];
    }
    // ポイントマーカーをクリア
    if (layerPointMarkersRef.current[layerId]) {
      layerPointMarkersRef.current[layerId].forEach(marker => {
        marker.setMap(null);
      });
      delete layerPointMarkersRef.current[layerId];
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
        const existingPoints = layerPointMarkersRef.current[layerId];
        const hasExistingData = (existingPolygons && existingPolygons.length > 0) ||
                               (existingPoints && existingPoints.length > 0);
        const needsRedraw = existingPolygons && existingPolygons.length > 0 &&
                           existingPolygons[0]?.strokeColor !== layer.color;

        if (!hasExistingData || needsRedraw) {
          if (needsRedraw) {
            hideLayer(layerId);
          }
          fetchLayerGeoJson(layerId, layer.color, layer.opacity, layer.attribution, layer.layer_type);
        }
      } else {
        // レイヤーが選択されていない場合は非表示
        hideLayer(layerId);
      }
    });

    // availableLayersに存在しないが表示されているレイヤーをクリア
    const allLayerIds = new Set([
      ...Object.keys(layerPolygonsRef.current),
      ...Object.keys(layerPointMarkersRef.current)
    ]);
    allLayerIds.forEach(layerId => {
      const exists = availableLayers.some(l => String(l.id) === String(layerId));
      if (!exists) {
        hideLayer(layerId);
      }
    });
  }, [selectedLayers, availableLayers, isLoaded, map, fetchLayerGeoJson, hideLayer]);

  // 地図から位置を選択するモードの処理
  useEffect(() => {
    if (!isLoaded || !map || !window.google) return;

    // 既存のリスナーをクリア
    if (pickClickListenerRef.current) {
      google.maps.event.removeListener(pickClickListenerRef.current);
      pickClickListenerRef.current = null;
    }

    // 既存のマーカーをクリア
    if (pickMarkerRef.current) {
      pickMarkerRef.current.setMap(null);
      pickMarkerRef.current = null;
    }

    if (mapPickMode && onMapPick) {
      // カーソルを変更
      map.setOptions({ draggableCursor: 'crosshair' });

      // クリックリスナーを追加
      pickClickListenerRef.current = map.addListener('click', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        // 選択位置にマーカーを表示
        if (pickMarkerRef.current) {
          pickMarkerRef.current.setMap(null);
        }

        pickMarkerRef.current = new google.maps.Marker({
          position: { lat, lng },
          map: map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#e91e63',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          },
          zIndex: 2000,
          animation: google.maps.Animation.DROP,
        });

        // コールバックを呼び出し
        onMapPick({ lat, lng });
      });
    } else {
      // 通常モードに戻す
      map.setOptions({ draggableCursor: null });
    }

    return () => {
      if (pickClickListenerRef.current) {
        google.maps.event.removeListener(pickClickListenerRef.current);
        pickClickListenerRef.current = null;
      }
      if (pickMarkerRef.current) {
        pickMarkerRef.current.setMap(null);
        pickMarkerRef.current = null;
      }
      if (map) {
        map.setOptions({ draggableCursor: null });
      }
    };
  }, [isLoaded, map, mapPickMode, onMapPick]);

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
          const headerContent = createInfoWindowHeader(property);
          // マーカーを取得してInfoWindowを表示（マーカーが存在する場合）
          showInfoWindow(content, null, {
            lat: parseFloat(property.latitude),
            lng: parseFloat(property.longitude)
          }, { headerContent });

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
              const headerContent = createInfoWindowHeader(property);
              showInfoWindow(content, marker, null, { headerContent });

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

      // 全ての物件と店舗が見えるように地図をフィット（GISフィルタがない場合のみ）
      // GISフィルタがある場合は、ユーザーが範囲を指定しているのでリサイズしない
      if (!hasGeoFilter) {
        const propertyPositions = properties
          .filter(p => p.latitude && p.longitude)
          .map(p => ({
            lat: parseFloat(p.latitude),
            lng: parseFloat(p.longitude)
          }));
        const storePositions = stores
          .filter(s => s.latitude && s.longitude)
          .map(s => ({
            lat: parseFloat(s.latitude),
            lng: parseFloat(s.longitude)
          }));
        const allPositions = [...propertyPositions, ...storePositions];
        if (allPositions.length > 0) {
          fitBounds(allPositions);
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
  }, [isLoaded, map, properties, stores, hasGeoFilter]);

  // 店舗マーカー表示用のuseEffect
  useEffect(() => {
    if (!isLoaded || !map || !window.google) return;

    // 既存の店舗マーカーをクリア
    storeMarkersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    storeMarkersRef.current = [];

    // 座標を持つ店舗のマーカーを配置
    const storesWithLocation = stores.filter(store => store.latitude && store.longitude);

    storesWithLocation.forEach(store => {
      // 店舗アイコン（ビル/オフィスの形をしたピン）
      const storeIconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
          <!-- ピンの形（下向きの針） -->
          <path d="M18 44 L10 30 L26 30 Z" fill="#1565c0"/>
          <!-- 円形の背景 -->
          <circle cx="18" cy="15" r="14" fill="#1976d2" stroke="#ffffff" stroke-width="2"/>
          <!-- ビルアイコン -->
          <path d="M10 7 L10 23 L16 23 L16 19 L20 19 L20 23 L26 23 L26 7 Z" fill="#ffffff"/>
          <!-- 窓 -->
          <rect x="12" y="9" width="2.5" height="2.5" fill="#1976d2"/>
          <rect x="16.75" y="9" width="2.5" height="2.5" fill="#1976d2"/>
          <rect x="21.5" y="9" width="2.5" height="2.5" fill="#1976d2"/>
          <rect x="12" y="13.5" width="2.5" height="2.5" fill="#1976d2"/>
          <rect x="16.75" y="13.5" width="2.5" height="2.5" fill="#1976d2"/>
          <rect x="21.5" y="13.5" width="2.5" height="2.5" fill="#1976d2"/>
        </svg>
      `;

      const marker = new google.maps.Marker({
        position: {
          lat: parseFloat(store.latitude),
          lng: parseFloat(store.longitude)
        },
        map: map,
        title: store.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(storeIconSvg),
          scaledSize: new google.maps.Size(36, 44),
          anchor: new google.maps.Point(18, 44),
        },
        zIndex: 1000, // 物件マーカーより上に表示
      });

      // 店舗のInfoWindow用ヘッダーを作成
      const headerContent = document.createElement('div');
      headerContent.style.cssText = 'font-weight: 600; color: #1976d2;';
      headerContent.textContent = store.name;

      // 店舗のInfoWindow
      const infoWindow = new google.maps.InfoWindow({
        headerContent: headerContent,
        content: `
          <div style="padding: 8px 12px 12px; min-width: 150px;">
            ${store.address ? `<div style="font-size: 12px; color: #666;">${store.address}</div>` : ''}
            <div style="font-size: 11px; color: #999; margin-top: 4px;">
              紐付き物件: ${store.buildings_count || 0}件
            </div>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      storeMarkersRef.current.push(marker);
    });

    return () => {
      storeMarkersRef.current.forEach(marker => {
        marker.setMap(null);
      });
      storeMarkersRef.current = [];
    };
  }, [isLoaded, map, stores]);

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

      {/* 物件検索中インジケーター */}
      {isLoading && (
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
            物件を検索中...
          </Typography>
        </Box>
      )}

      {/* レイヤー読み込み中インジケーター */}
      {!isLoading && Object.entries(layerLoadingStates).some(([_, isLayerLoading]) => isLayerLoading) && (
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

      {/* 地図選択モードインジケーター */}
      {mapPickMode && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            zIndex: 200,
            bgcolor: 'secondary.main',
            color: 'white',
            borderRadius: 2,
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            📍 地図上をクリックして位置を選択してください
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={onCancelMapPick}
            sx={{
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                borderColor: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            キャンセル
          </Button>
        </Paper>
      )}

    </Box>
  );
}
