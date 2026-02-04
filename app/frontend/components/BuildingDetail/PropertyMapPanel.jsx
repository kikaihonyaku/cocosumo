import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Fade,
  Slider,
  Select,
  MenuItem,
  Fab,
  Collapse,
  Chip,
  Divider,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
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
  Streetview as StreetviewIcon,
  AddLocation as AddLocationIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  SkipPrevious as SkipPreviousIcon,
  SkipNext as SkipNextIcon,
  OpenInFull as OpenInFullIcon,
  LocalConvenienceStore as LocalConvenienceStoreIcon,
  LocalHospital as LocalHospitalIcon,
  ShoppingCart as ShoppingCartIcon,
  School as SchoolIcon,
  Park as ParkIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Layers as LayersIcon,
  Place as PlaceIcon,
  Info as InfoIcon,
  ChildCare as ChildCareIcon,
  AccountBalance as AccountBalanceIcon,
  LocalPostOffice as LocalPostOfficeIcon,
  Apartment as ApartmentIcon,
} from '@mui/icons-material';
import MapChatWidget from './MapChatWidget';

// SVGマーカーアイコンを生成するヘルパー関数
const createSvgMarkerIcon = (svgPath, color, size = 32) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="11" fill="${color}" stroke="white" stroke-width="2"/>
      <g transform="scale(0.5) translate(12, 12)" fill="white">
        <path d="${svgPath}"/>
      </g>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

// 周辺施設カテゴリ定義
const NEARBY_FACILITY_CATEGORIES = [
  {
    id: 'convenience_store',
    label: 'コンビニ',
    placeType: 'convenience_store',
    Icon: LocalConvenienceStoreIcon,
    markerColor: '#FF6B6B',
    svgPath: 'M19.5,3.5L18,2l-1.5,1.5L15,2l-1.5,1.5L12,2l-1.5,1.5L9,2L7.5,3.5L6,2v14H3v3c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V2L19.5,3.5z M19,19H5V5h14V19z M9,7h2v2H9V7z M12,7h2v2h-2V7z M15,7h2v2h-2V7z',
  },
  {
    id: 'hospital',
    label: '病院',
    placeType: 'hospital',
    Icon: LocalHospitalIcon,
    markerColor: '#4ECDC4',
    svgPath: 'M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z',
  },
  {
    id: 'supermarket',
    label: 'スーパー',
    placeType: 'supermarket',
    Icon: ShoppingCartIcon,
    markerColor: '#45B7D1',
    svgPath: 'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z',
  },
  {
    id: 'kindergarten',
    label: '幼稚園・保育園',
    placeType: 'preschool',
    Icon: ChildCareIcon,
    markerColor: '#FF69B4',
    svgPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z',
  },
  {
    id: 'school',
    label: '小学校・中学校',
    placeType: 'school',
    Icon: SchoolIcon,
    markerColor: '#96CEB4',
    svgPath: 'M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z',
  },
  {
    id: 'park',
    label: '公園',
    placeType: 'park',
    Icon: ParkIcon,
    markerColor: '#FFD700',
    svgPath: 'M17 12h2L12 2 5 12h2l-3 9h7v-5h2v5h7l-3-9z',
  },
  {
    id: 'bank_post',
    label: '銀行・郵便局',
    placeType: 'bank',
    placeTypes: ['bank', 'post_office'],
    Icon: LocalPostOfficeIcon,
    markerColor: '#9370DB',
    svgPath: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
  },
  {
    id: 'government',
    label: '行政機関',
    placeType: 'local_government_office',
    Icon: ApartmentIcon,
    markerColor: '#708090',
    svgPath: 'M17 11V3H7v4H3v14h8v-4h2v4h8V11h-4zM7 19H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm4 4H9v-2h2v2zm0-4H9V9h2v2zm0-4H9V5h2v2zm4 8h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm4 12h-2v-2h2v2zm0-4h-2v-2h2v2z',
  },
];

// 周辺施設検索設定
const NEARBY_SEARCH_CONFIG = {
  radius: 1000, // 検索半径（メートル）
  maxResultsPerCategory: 10, // カテゴリごとの最大結果数
};

export default function PropertyMapPanel({
  property,
  onLocationUpdate,
  visible = true,
  onFormChange,
  onSave,
  selectedPlace,
  onPlaceClick,
  widgetContextToken,
  onWidgetTokenChange,
  isMobile = false,
  activeRoute = null, // 現在選択されている経路
  slideshowPosition = null, // スライドショーからの位置情報
  routes = [], // 全経路（複数ポリライン描画用）
  onRouteSelect, // 経路選択コールバック（ポリラインクリック用）
  onRouteAdd, // 経路追加コールバック（目的地確定時）
  // インラインスライドショー用props
  slideshowActive = false, // スライドショーがアクティブか
  slideshowPoints = [], // 経路上のストリートビューポイント
  onSlideshowEnd, // スライドショー終了時のコールバック
  onFullscreenSlideshow, // フルスクリーンスライドショーを開くコールバック
  // 外部からの経路追加モード制御
  externalRouteAddMode = false,
  onExternalRouteAddModeCancel = null,
  // 顧客向け表示オプション
  hideHeader = false, // ヘッダーを非表示
  chatRightOffset = 0, // チャット入力欄の右オフセット（ペグマン対応）
  accessToken = null, // カスタマーアクセストークン
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const selectedPlaceMarkerRef = useRef(null); // AI応答から選択された場所のマーカー
  const addressMarkersRef = useRef([]); // AI応答から抽出された住所のマーカー群
  const widgetElementRef = useRef(null); // Google Maps Grounding Widget要素
  const streetViewRef = useRef(null); // ストリートビューコンテナ
  const panoramaRef = useRef(null); // ストリートビューパノラマインスタンス
  const routePolylineRef = useRef(null); // 経路ポリライン
  const routeMarkerRef = useRef(null); // 経路上の現在位置マーカー
  const routePolylinesRef = useRef([]); // 複数経路のポリライン配列
  const tempDestMarkerRef = useRef(null); // 経路追加モードの目的地マーカー
  const mapClickListenerRef = useRef(null); // マップクリックリスナー
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingLocation, setEditingLocation] = useState(false);
  const [addressSearchOpen, setAddressSearchOpen] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [streetViewVisible, setStreetViewVisible] = useState(false); // ストリートビュー表示状態
  const originalPositionRef = useRef(null);
  const [widgetVisible, setWidgetVisible] = useState(false); // ウィジェットの表示状態
  const [internalRouteAddMode, setInternalRouteAddMode] = useState(false); // 内部経路追加モード
  const [tempDestination, setTempDestination] = useState(null); // 仮の目的地
  // 経路追加モード（内部または外部から制御）
  const routeAddMode = internalRouteAddMode || externalRouteAddMode;

  // インラインスライドショー用state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [controlsVisible, setControlsVisible] = useState(true);
  const playIntervalRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // 地図オプションパネル用state
  const [mapOptionsOpen, setMapOptionsOpen] = useState(false);
  const [activeOptionsTab, setActiveOptionsTab] = useState(0); // 0: 周辺施設, 1: レイヤー

  // 周辺施設用state/ref
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [nearbyFacilities, setNearbyFacilities] = useState({});
  const [facilitySearchLoading, setFacilitySearchLoading] = useState(false);
  const nearbyMarkersRef = useRef({});
  const nearbyInfoWindowRef = useRef(null);

  // レイヤー用state/ref
  const [availableLayers, setAvailableLayers] = useState([]);
  const [selectedLayers, setSelectedLayers] = useState([]);
  const [layersLoading, setLayersLoading] = useState(false);
  const layerPolygonsRef = useRef({});
  const layerMarkersRef = useRef({});
  const layerInfoWindowRef = useRef(null);

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

  // Google Maps Grounding Widgetの更新
  useEffect(() => {
    if (widgetContextToken && mapLoaded) {
      // contextTokenが更新されたらまずウィジェットを表示
      setWidgetVisible(true);

      // 次のレンダリング後にcontextTokenを設定
      setTimeout(() => {
        if (widgetElementRef.current) {
          try {
            widgetElementRef.current.contextToken = widgetContextToken;
          } catch (error) {
            console.error('Failed to update widget context token:', error);
          }
        }
      }, 100);
    }
  }, [widgetContextToken, mapLoaded]);

  // 複数経路のポリライン描画（クリック選択対応）
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    // 既存のポリラインを削除
    routePolylinesRef.current.forEach((p) => p.setMap(null));
    routePolylinesRef.current = [];

    // 単一アクティブ経路用のポリラインも削除
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }

    // 経路がない場合は終了
    if (!routes?.length) return;

    try {
      routes.forEach((route) => {
        if (!route.encoded_polyline) return;

        const path = window.google.maps.geometry.encoding.decodePath(route.encoded_polyline);
        const isActive = activeRoute?.id === route.id;

        const polyline = new window.google.maps.Polyline({
          path: path,
          strokeColor: isActive ? '#4285F4' : '#9E9E9E',
          strokeWeight: isActive ? 6 : 4,
          strokeOpacity: isActive ? 0.9 : 0.5,
          clickable: true,
          map: mapInstanceRef.current,
          zIndex: isActive ? 10 : 1,
        });

        // ホバー時のスタイル変更
        polyline.addListener('mouseover', () => {
          if (activeRoute?.id !== route.id) {
            polyline.setOptions({
              strokeColor: '#64B5F6',
              strokeWeight: 5,
              strokeOpacity: 0.7,
            });
          }
        });

        polyline.addListener('mouseout', () => {
          if (activeRoute?.id !== route.id) {
            polyline.setOptions({
              strokeColor: '#9E9E9E',
              strokeWeight: 4,
              strokeOpacity: 0.5,
            });
          }
        });

        // クリック時に経路を選択
        polyline.addListener('click', () => {
          onRouteSelect?.(route);
        });

        routePolylinesRef.current.push(polyline);
      });

      // アクティブな経路がある場合、その経路が見えるようにboundsを調整
      if (activeRoute?.encoded_polyline) {
        const path = window.google.maps.geometry.encoding.decodePath(activeRoute.encoded_polyline);
        const bounds = new window.google.maps.LatLngBounds();
        path.forEach((point) => bounds.extend(point));
        mapInstanceRef.current.fitBounds(bounds, { padding: 50 });
      }
    } catch (error) {
      console.error('Failed to draw route polylines:', error);
    }

    return () => {
      routePolylinesRef.current.forEach((p) => p.setMap(null));
      routePolylinesRef.current = [];
    };
  }, [routes, activeRoute, onRouteSelect]);

  // 経路追加モード：マップクリックイベント
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    // 既存のリスナーを削除
    if (mapClickListenerRef.current) {
      window.google.maps.event.removeListener(mapClickListenerRef.current);
      mapClickListenerRef.current = null;
    }

    if (!routeAddMode) {
      // モード終了時に目的地マーカーを削除
      if (tempDestMarkerRef.current) {
        tempDestMarkerRef.current.setMap(null);
        tempDestMarkerRef.current = null;
      }
      setTempDestination(null);
      return;
    }

    // マップクリックリスナーを追加
    mapClickListenerRef.current = mapInstanceRef.current.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setTempDestination({ lat, lng });

      // 目的地マーカーを表示/更新
      if (tempDestMarkerRef.current) {
        tempDestMarkerRef.current.setPosition({ lat, lng });
      } else {
        tempDestMarkerRef.current = new window.google.maps.Marker({
          position: { lat, lng },
          map: mapInstanceRef.current,
          draggable: true,
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          },
          zIndex: 100,
        });

        // ドラッグ終了時に位置を更新
        tempDestMarkerRef.current.addListener('dragend', () => {
          const pos = tempDestMarkerRef.current.getPosition();
          setTempDestination({ lat: pos.lat(), lng: pos.lng() });
        });
      }
    });

    // カーソルをcrosshairに変更
    mapInstanceRef.current.setOptions({ draggableCursor: 'crosshair' });

    return () => {
      if (mapClickListenerRef.current) {
        window.google.maps.event.removeListener(mapClickListenerRef.current);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setOptions({ draggableCursor: null });
      }
    };
  }, [routeAddMode]);

  // スライドショー位置に応じてストリートビューを更新
  useEffect(() => {
    if (!slideshowPosition || !panoramaRef.current) return;

    const { lat, lng, heading } = slideshowPosition;
    panoramaRef.current.setPosition({ lat, lng });
    panoramaRef.current.setPov({ heading: heading || 0, pitch: 0 });

    // ストリートビューが表示されていなければ表示
    if (!streetViewVisible) {
      setStreetViewVisible(true);
    }

    // 経路上の現在位置マーカーを更新
    if (mapInstanceRef.current && window.google?.maps) {
      if (!routeMarkerRef.current) {
        routeMarkerRef.current = new window.google.maps.Marker({
          position: { lat, lng },
          map: mapInstanceRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#FF5722',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
          zIndex: 100,
        });
      } else {
        routeMarkerRef.current.setPosition({ lat, lng });
      }
    }
  }, [slideshowPosition, streetViewVisible]);

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

  // AI応答から抽出された住所をマーカーとして表示
  // addressesは { address: string, name: string }[] の形式
  const handleAddressesFound = (addresses) => {
    if (!mapInstanceRef.current || !window.google?.maps || addresses.length === 0) return;

    console.log('Addresses found:', addresses);

    // 既存のマーカーを削除
    addressMarkersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    addressMarkersRef.current = [];

    const geocoder = new window.google.maps.Geocoder();
    const bounds = new window.google.maps.LatLngBounds();
    let geocodedCount = 0;

    // 物件位置をboundsに追加
    if (property?.latitude && property?.longitude) {
      const propertyLat = parseFloat(property.latitude);
      const propertyLng = parseFloat(property.longitude);
      if (!isNaN(propertyLat) && !isNaN(propertyLng)) {
        bounds.extend({ lat: propertyLat, lng: propertyLng });
      }
    }

    addresses.forEach((item, index) => {
      const { address, name } = item;
      geocoder.geocode({ address }, (results, status) => {
        geocodedCount++;

        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();

          console.log(`Geocoded address ${index + 1}:`, { name, address }, { lat, lng });

          // マーカーを作成
          const marker = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapInstanceRef.current,
            title: name || address,
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png', // 緑のマーカー
            },
            label: {
              text: String(index + 1),
              color: 'white',
              fontWeight: 'bold',
            },
          });

          // 情報ウィンドウを作成（名称がある場合は名称も表示）
          const infoContent = name
            ? `
              <div style="padding: 8px; max-width: 280px;">
                <h4 style="margin: 0 0 6px 0; font-size: 14px; color: #1976d2; font-weight: 600;">${name}</h4>
                <p style="margin: 0; font-size: 12px; color: #666;">${address}</p>
              </div>
            `
            : `
              <div style="padding: 8px; max-width: 250px;">
                <p style="margin: 0; font-size: 13px; color: #333;">${address}</p>
              </div>
            `;

          const infoWindow = new window.google.maps.InfoWindow({
            content: infoContent,
          });

          marker.addListener('click', () => {
            infoWindow.open(mapInstanceRef.current, marker);
          });

          addressMarkersRef.current.push(marker);
          bounds.extend({ lat, lng });
        } else {
          console.error(`Geocoding failed for address ${index + 1}:`, address, status);
        }

        // 全てのジオコーディングが完了したら地図の表示範囲を調整
        if (geocodedCount === addresses.length && addressMarkersRef.current.length > 0) {
          mapInstanceRef.current.fitBounds(bounds);
          // ズームが細かすぎる場合は調整
          const listener = window.google.maps.event.addListenerOnce(mapInstanceRef.current, 'idle', () => {
            if (mapInstanceRef.current.getZoom() > 16) {
              mapInstanceRef.current.setZoom(16);
            }
          });
        }
      });
    });
  };

  // ストリートビュー表示切り替え時に地図をリサイズ
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        window.google?.maps?.event?.trigger(mapInstanceRef.current, 'resize');
        // 中心位置を再設定
        if (property?.latitude && property?.longitude) {
          const lat = parseFloat(property.latitude);
          const lng = parseFloat(property.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            mapInstanceRef.current.setCenter({ lat, lng });
          }
        }
      }, 100);
    }
  }, [streetViewVisible, property]);

  // インラインスライドショーがアクティブになった時の処理
  useEffect(() => {
    if (slideshowActive && slideshowPoints.length > 0) {
      // ストリートビューを表示（パノラマのsetVisibleを呼ぶ）
      if (panoramaRef.current) {
        // 最初のポイントを設定
        const firstPoint = slideshowPoints[0];
        if (firstPoint) {
          panoramaRef.current.setPosition({ lat: firstPoint.lat, lng: firstPoint.lng });
          panoramaRef.current.setPov({ heading: firstPoint.heading || 0, pitch: 0 });
        }
        panoramaRef.current.setVisible(true);
      }
      // 最初のポイントに移動
      setCurrentPointIndex(0);
      setIsPlaying(true);
      setControlsVisible(true);
    } else {
      // スライドショー終了時にリセット
      setIsPlaying(false);
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }
  }, [slideshowActive, slideshowPoints]);

  // スライドショー再生ロジック
  useEffect(() => {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }

    if (isPlaying && slideshowActive && slideshowPoints.length > 0) {
      const interval = 2000 / playbackSpeed; // 基本2秒間隔、速度で調整
      playIntervalRef.current = setInterval(() => {
        setCurrentPointIndex((prev) => {
          const next = prev + 1;
          if (next >= slideshowPoints.length) {
            // 最後まで到達したら停止
            setIsPlaying(false);
            return prev;
          }
          return next;
        });
      }, interval);
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, slideshowActive, slideshowPoints.length, playbackSpeed]);

  // 現在のポイントでパノラマを更新
  useEffect(() => {
    if (!slideshowActive || !slideshowPoints.length || !panoramaRef.current) return;

    const point = slideshowPoints[currentPointIndex];
    if (!point) return;

    const { lat, lng, heading } = point;
    panoramaRef.current.setPosition({ lat, lng });
    panoramaRef.current.setPov({ heading: heading || 0, pitch: 0 });

    // 経路上の現在位置マーカーを更新
    if (mapInstanceRef.current && window.google?.maps) {
      if (!routeMarkerRef.current) {
        routeMarkerRef.current = new window.google.maps.Marker({
          position: { lat, lng },
          map: mapInstanceRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#FF5722',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
          zIndex: 100,
        });
      } else {
        routeMarkerRef.current.setPosition({ lat, lng });
      }
    }
  }, [currentPointIndex, slideshowActive, slideshowPoints]);

  // スライドショーを閉じる（ストリートビューも閉じる）
  const handleCloseSlideshow = useCallback(() => {
    onSlideshowEnd?.();
    setStreetViewVisible(false);
  }, [onSlideshowEnd]);

  // キーボードショートカット
  useEffect(() => {
    if (!slideshowActive) return;

    const handleKeyDown = (e) => {
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          setIsPlaying((prev) => !prev);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setCurrentPointIndex((prev) => Math.max(0, prev - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setCurrentPointIndex((prev) => Math.min(slideshowPoints.length - 1, prev + 1));
          break;
        case 'Escape':
          e.preventDefault();
          handleCloseSlideshow();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slideshowActive, slideshowPoints.length, handleCloseSlideshow]);

  // コントロールの自動非表示
  const handleMouseMove = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    }
  }, [isPlaying]);

  // レイヤー一覧を取得
  const fetchMapLayers = useCallback(async () => {
    try {
      setLayersLoading(true);
      const response = await fetch('/api/v1/map_layers', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('レイヤー一覧の取得に失敗しました');
      const data = await response.json();
      const layers = data.map(layer => ({
        id: layer.layer_key,
        label: layer.name,
        description: `${layer.feature_count || 0}件`,
        color: layer.color || '#FF6B00',
        opacity: layer.opacity || 0.15,
        layerType: layer.layer_type,
        attribution: layer.attribution,
      }));
      setAvailableLayers(layers);
    } catch (error) {
      console.error('レイヤー取得エラー:', error);
    } finally {
      setLayersLoading(false);
    }
  }, []);

  // レイヤーのGeoJSONを取得して描画
  const fetchAndDisplayLayer = useCallback(async (layerId) => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    const layer = availableLayers.find(l => l.id === layerId);
    if (!layer) return;

    try {
      const response = await fetch(`/api/v1/map_layers/${layerId}/geojson`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('GeoJSONの取得に失敗しました');
      const geojson = await response.json();

      if (!geojson.features || geojson.features.length === 0) return;

      const firstFeature = geojson.features[0];
      const isPoint = firstFeature.geometry.type === 'Point';

      if (isPoint) {
        displayLayerPoints(geojson, layerId, layer);
      } else {
        displayLayerPolygons(geojson, layerId, layer);
      }
    } catch (error) {
      console.error(`レイヤー ${layerId} の取得エラー:`, error);
    }
  }, [availableLayers]);

  // レイヤーポリゴンを描画
  const displayLayerPolygons = useCallback((geojson, layerId, layer) => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    // 既存のポリゴンをクリア
    if (layerPolygonsRef.current[layerId]) {
      layerPolygonsRef.current[layerId].forEach(p => p.setMap(null));
    }
    layerPolygonsRef.current[layerId] = [];

    geojson.features.forEach(feature => {
      if (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon') return;

      const paths = feature.geometry.type === 'Polygon'
        ? [feature.geometry.coordinates[0].map(coord => ({ lat: coord[1], lng: coord[0] }))]
        : feature.geometry.coordinates.map(poly => poly[0].map(coord => ({ lat: coord[1], lng: coord[0] })));

      paths.forEach(path => {
        const polygon = new window.google.maps.Polygon({
          paths: path,
          strokeColor: layer.color,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: layer.color,
          fillOpacity: layer.opacity,
          map: mapInstanceRef.current,
          zIndex: 1,
        });

        // クリックで情報表示
        polygon.addListener('click', (e) => {
          if (!layerInfoWindowRef.current) {
            layerInfoWindowRef.current = new window.google.maps.InfoWindow();
          }
          const name = feature.properties?.name || feature.properties?.school_name || 'エリア';
          layerInfoWindowRef.current.setContent(`
            <div style="padding: 8px; max-width: 200px;">
              <h4 style="margin: 0 0 4px 0; font-size: 14px; color: ${layer.color};">${name}</h4>
              ${layer.attribution ? `<p style="margin: 0; font-size: 11px; color: #888;">出典: ${layer.attribution}</p>` : ''}
            </div>
          `);
          layerInfoWindowRef.current.setPosition(e.latLng);
          layerInfoWindowRef.current.open(mapInstanceRef.current);
        });

        layerPolygonsRef.current[layerId].push(polygon);
      });
    });
  }, []);

  // レイヤーポイントを描画
  const displayLayerPoints = useCallback((geojson, layerId, layer) => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    // 既存のマーカーをクリア
    if (layerMarkersRef.current[layerId]) {
      layerMarkersRef.current[layerId].forEach(m => m.setMap(null));
    }
    layerMarkersRef.current[layerId] = [];

    geojson.features.forEach(feature => {
      if (feature.geometry.type !== 'Point') return;

      const [lng, lat] = feature.geometry.coordinates;
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: layer.color,
          fillOpacity: 0.8,
          strokeColor: '#FFFFFF',
          strokeWeight: 1,
        },
        zIndex: 5,
      });

      const name = feature.properties?.name || feature.properties?.station_name || '地点';
      marker.addListener('click', () => {
        if (!layerInfoWindowRef.current) {
          layerInfoWindowRef.current = new window.google.maps.InfoWindow();
        }
        layerInfoWindowRef.current.setContent(`
          <div style="padding: 8px; max-width: 200px;">
            <h4 style="margin: 0 0 4px 0; font-size: 14px; color: ${layer.color};">${name}</h4>
            ${layer.attribution ? `<p style="margin: 0; font-size: 11px; color: #888;">出典: ${layer.attribution}</p>` : ''}
          </div>
        `);
        layerInfoWindowRef.current.open(mapInstanceRef.current, marker);
      });

      layerMarkersRef.current[layerId].push(marker);
    });
  }, []);

  // レイヤーを非表示
  const hideLayer = useCallback((layerId) => {
    if (layerPolygonsRef.current[layerId]) {
      layerPolygonsRef.current[layerId].forEach(p => p.setMap(null));
      delete layerPolygonsRef.current[layerId];
    }
    if (layerMarkersRef.current[layerId]) {
      layerMarkersRef.current[layerId].forEach(m => m.setMap(null));
      delete layerMarkersRef.current[layerId];
    }
  }, []);

  // レイヤー選択変更時の処理
  useEffect(() => {
    if (!mapLoaded) return;

    // 選択されたレイヤーを表示
    selectedLayers.forEach(layerId => {
      if (!layerPolygonsRef.current[layerId] && !layerMarkersRef.current[layerId]) {
        fetchAndDisplayLayer(layerId);
      }
    });

    // 選択解除されたレイヤーを非表示
    Object.keys(layerPolygonsRef.current).forEach(layerId => {
      if (!selectedLayers.includes(layerId)) {
        hideLayer(layerId);
      }
    });
    Object.keys(layerMarkersRef.current).forEach(layerId => {
      if (!selectedLayers.includes(layerId)) {
        hideLayer(layerId);
      }
    });
  }, [selectedLayers, mapLoaded, fetchAndDisplayLayer, hideLayer]);

  // 周辺施設を検索
  const searchNearbyFacilities = useCallback(async (categoryId) => {
    if (!mapInstanceRef.current || !window.google?.maps?.places) return;
    if (!property?.latitude || !property?.longitude) return;

    const category = NEARBY_FACILITY_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return;

    // 既にキャッシュがあれば使用
    if (nearbyFacilities[categoryId]) {
      createNearbyMarkers(categoryId, nearbyFacilities[categoryId]);
      return;
    }

    setFacilitySearchLoading(true);

    const service = new window.google.maps.places.PlacesService(mapInstanceRef.current);
    const center = { lat: parseFloat(property.latitude), lng: parseFloat(property.longitude) };

    // 複数タイプを検索する場合（例：銀行・郵便局）
    const placeTypes = category.placeTypes || [category.placeType];

    const searchPromises = placeTypes.map(placeType => {
      return new Promise((resolve) => {
        service.nearbySearch({
          location: center,
          radius: NEARBY_SEARCH_CONFIG.radius,
          type: placeType,
        }, (places, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && places) {
            resolve(places);
          } else {
            resolve([]);
          }
        });
      });
    });

    try {
      const results = await Promise.all(searchPromises);
      // 複数の結果をマージして重複を除去
      const allPlaces = results.flat();
      const uniquePlaces = allPlaces.filter((place, index, self) =>
        index === self.findIndex(p => p.place_id === place.place_id)
      );
      const limitedPlaces = uniquePlaces.slice(0, NEARBY_SEARCH_CONFIG.maxResultsPerCategory);

      setNearbyFacilities(prev => ({ ...prev, [categoryId]: limitedPlaces }));
      createNearbyMarkers(categoryId, limitedPlaces);
    } catch (error) {
      console.error('周辺施設検索エラー:', error);
      setNearbyFacilities(prev => ({ ...prev, [categoryId]: [] }));
    } finally {
      setFacilitySearchLoading(false);
    }
  }, [property, nearbyFacilities]);

  // 周辺施設マーカーを作成
  const createNearbyMarkers = useCallback((categoryId, places) => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    const category = NEARBY_FACILITY_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return;

    // 既存のマーカーをクリア
    if (nearbyMarkersRef.current[categoryId]) {
      nearbyMarkersRef.current[categoryId].forEach(m => m.setMap(null));
    }
    nearbyMarkersRef.current[categoryId] = [];

    places.forEach((place, index) => {
      const iconUrl = createSvgMarkerIcon(category.svgPath, category.markerColor, 36);
      const marker = new window.google.maps.Marker({
        position: place.geometry.location,
        map: mapInstanceRef.current,
        title: place.name,
        icon: {
          url: iconUrl,
          scaledSize: new window.google.maps.Size(36, 36),
          anchor: new window.google.maps.Point(18, 18),
        },
        zIndex: 50,
      });

      marker.addListener('click', () => {
        if (!nearbyInfoWindowRef.current) {
          nearbyInfoWindowRef.current = new window.google.maps.InfoWindow();
        }
        nearbyInfoWindowRef.current.setContent(`
          <div style="padding: 8px; max-width: 200px;">
            <h4 style="margin: 0 0 4px 0; font-size: 14px; color: ${category.markerColor};">
              ${place.name}
            </h4>
            <p style="margin: 0; font-size: 12px; color: #666;">
              ${place.vicinity || ''}
            </p>
            ${place.rating ? `
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #888;">
                ★ ${place.rating} (${place.user_ratings_total || 0}件)
              </p>
            ` : ''}
          </div>
        `);
        nearbyInfoWindowRef.current.open(mapInstanceRef.current, marker);
      });

      nearbyMarkersRef.current[categoryId].push(marker);
    });
  }, []);

  // 周辺施設マーカーを削除
  const clearNearbyMarkers = useCallback((categoryId) => {
    if (nearbyMarkersRef.current[categoryId]) {
      nearbyMarkersRef.current[categoryId].forEach(m => m.setMap(null));
      delete nearbyMarkersRef.current[categoryId];
    }
  }, []);

  // 周辺施設カテゴリ選択変更時の処理
  useEffect(() => {
    if (!mapLoaded) return;

    // 選択されたカテゴリのマーカーを表示
    selectedCategories.forEach(categoryId => {
      if (!nearbyMarkersRef.current[categoryId]) {
        searchNearbyFacilities(categoryId);
      }
    });

    // 選択解除されたカテゴリのマーカーを削除
    Object.keys(nearbyMarkersRef.current).forEach(categoryId => {
      if (!selectedCategories.includes(categoryId)) {
        clearNearbyMarkers(categoryId);
      }
    });
  }, [selectedCategories, mapLoaded, searchNearbyFacilities, clearNearbyMarkers]);

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      // 周辺施設マーカーをクリア
      Object.values(nearbyMarkersRef.current).forEach(markers => {
        markers.forEach(m => m.setMap(null));
      });
      nearbyMarkersRef.current = {};

      // レイヤーポリゴン/マーカーをクリア
      Object.values(layerPolygonsRef.current).forEach(polygons => {
        polygons.forEach(p => p.setMap(null));
      });
      layerPolygonsRef.current = {};
      Object.values(layerMarkersRef.current).forEach(markers => {
        markers.forEach(m => m.setMap(null));
      });
      layerMarkersRef.current = {};
    };
  }, []);

  // 地図オプションパネルを開いたときにレイヤー一覧を取得
  useEffect(() => {
    if (mapOptionsOpen && availableLayers.length === 0) {
      fetchMapLayers();
    }
  }, [mapOptionsOpen, availableLayers.length, fetchMapLayers]);

  const loadGoogleMaps = () => {
    // meta tagから取得（本番環境）、または環境変数から取得（開発環境）
    const metaTag = document.querySelector('meta[name="google-maps-api-key"]');
    const apiKey = metaTag?.getAttribute('content') || import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || '';
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&v=weekly&loading=async`;
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

      // ストリートビューパノラマの初期化（マップより先に作成）
      let panorama = null;
      if (streetViewRef.current) {
        panorama = new window.google.maps.StreetViewPanorama(
          streetViewRef.current,
          {
            position: { lat: defaultLat, lng: defaultLng },
            pov: {
              heading: 34,
              pitch: 10,
            },
            zoom: 1,
            visible: false, // 初期状態では非表示
          }
        );
        panoramaRef.current = panorama;

        // ストリートビューの表示/非表示を監視
        panorama.addListener('visible_changed', () => {
          const isVisible = panorama.getVisible();
          setStreetViewVisible(isVisible);
        });
      }

      // マップの初期化（カスタムストリートビューを指定）
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: defaultLat, lng: defaultLng },
        zoom: 16,
        mapTypeId: 'roadmap', // 文字列で指定（MapTypeId.ROADMAPの代わり）
        streetView: panorama, // カスタムストリートビューパノラマを指定
        streetViewControl: true, // デフォルトのストリートビューコントロール（ペグマン）を表示
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

  const toggleStreetView = () => {
    if (panoramaRef.current) {
      if (!streetViewVisible && property?.latitude && property?.longitude) {
        // ストリートビューを表示する際に、現在の物件位置を設定
        const lat = parseFloat(property.latitude);
        const lng = parseFloat(property.longitude);
        panoramaRef.current.setPosition({ lat, lng });
      }
      // パノラマの表示状態を切り替え
      panoramaRef.current.setVisible(!streetViewVisible);
    }
  };

  // 経路追加モードの開始（内部ボタンから）
  const handleStartRouteAddMode = useCallback(() => {
    setInternalRouteAddMode(true);
    setTempDestination(null);
  }, []);

  // 経路追加モードのキャンセル
  const handleCancelRouteAddMode = useCallback(() => {
    setInternalRouteAddMode(false);
    if (tempDestMarkerRef.current) {
      tempDestMarkerRef.current.setMap(null);
      tempDestMarkerRef.current = null;
    }
    setTempDestination(null);
    // 外部モードの場合は外部のキャンセルも呼び出す
    if (externalRouteAddMode) {
      onExternalRouteAddModeCancel?.();
    }
  }, [externalRouteAddMode, onExternalRouteAddModeCancel]);

  // 目的地確定
  const handleConfirmDestination = useCallback(() => {
    if (!tempDestination || !onRouteAdd) return;

    onRouteAdd(tempDestination);
    // 状態をリセット
    setInternalRouteAddMode(false);
    if (tempDestMarkerRef.current) {
      tempDestMarkerRef.current.setMap(null);
      tempDestMarkerRef.current = null;
    }
    setTempDestination(null);
  }, [tempDestination, onRouteAdd]);

  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* 地図ヘッダー */}
      {!hideHeader && (
        <Box sx={{
          px: 2,
          py: 1,
          bgcolor: 'background.paper',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MapIcon color="action" />
            <Typography variant="subtitle2" fontWeight={600}>
              物件位置
            </Typography>
          </Box>

          {/* 位置編集・住所検索・ストリートビューボタン（モバイル時は非表示） */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={editingLocation ? <CheckIcon /> : <EditIcon />}
                onClick={handleLocationEdit}
                color={editingLocation ? "success" : "primary"}
                disabled={!mapLoaded}
              >
                {editingLocation ? '完了' : '位置編集'}
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => setAddressSearchOpen(true)}
                disabled={!mapLoaded}
              >
                住所検索
              </Button>

              <Button
                variant={streetViewVisible ? "contained" : "outlined"}
                size="small"
                startIcon={<StreetviewIcon />}
                onClick={toggleStreetView}
                disabled={!mapLoaded}
                color={streetViewVisible ? "primary" : "inherit"}
              >
                ストリートビュー
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* 地図・ストリートビューコンテナ */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 地図コンテナ（ストリートビュー表示時は上半分、非表示時は全体） */}
        <Box
          sx={{
            position: 'relative',
            height: streetViewVisible ? 'calc(50% - 2px)' : '100%',
            width: '100%',
            transition: 'height 0.3s ease',
          }}
        >
          <Box
            ref={mapRef}
            sx={{
              height: '100%',
              width: '100%',
              bgcolor: 'grey.100',
              // モバイルでピンチズーム時にブラウザがズームするのを防ぐ
              touchAction: 'none',
            }}
          />

          {/* 地図オプションパネル（周辺施設・レイヤー） */}
          {mapLoaded && !routeAddMode && !slideshowActive && (
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                left: 16,
                zIndex: 4,
                maxWidth: 280,
              }}
            >
              <Paper
                elevation={3}
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: 'white',
                }}
              >
                {/* ヘッダー/トグルボタン */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1,
                    px: 1.5,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'grey.50' },
                  }}
                  onClick={() => setMapOptionsOpen(!mapOptionsOpen)}
                >
                  <LayersIcon fontSize="small" color="primary" />
                  <Typography variant="body2" sx={{ ml: 0.5, fontWeight: 500, flex: 1 }}>
                    地図オプション
                  </Typography>
                  {(selectedCategories.length > 0 || selectedLayers.length > 0) && (
                    <Chip
                      label={selectedCategories.length + selectedLayers.length}
                      size="small"
                      color="primary"
                      sx={{ height: 20, mr: 0.5, '& .MuiChip-label': { px: 1 } }}
                    />
                  )}
                  {mapOptionsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </Box>

                {/* 展開パネル */}
                <Collapse in={mapOptionsOpen}>
                  <Divider />
                  {/* タブ */}
                  <Tabs
                    value={activeOptionsTab}
                    onChange={(e, v) => setActiveOptionsTab(v)}
                    variant="fullWidth"
                    sx={{
                      minHeight: 36,
                      '& .MuiTab-root': { minHeight: 36, py: 0.5, fontSize: '0.8rem' },
                    }}
                  >
                    <Tab
                      icon={<PlaceIcon sx={{ fontSize: 16 }} />}
                      iconPosition="start"
                      label="周辺施設"
                      sx={{ minHeight: 36 }}
                    />
                    <Tab
                      icon={<LayersIcon sx={{ fontSize: 16 }} />}
                      iconPosition="start"
                      label="レイヤー"
                      sx={{ minHeight: 36 }}
                    />
                  </Tabs>
                  <Divider />

                  {/* 周辺施設タブ */}
                  {activeOptionsTab === 0 && (
                    <Box sx={{ p: 1, maxHeight: 300, overflowY: 'auto' }}>
                      {NEARBY_FACILITY_CATEGORIES.map(category => {
                        const Icon = category.Icon;
                        const isSelected = selectedCategories.includes(category.id);
                        const count = nearbyFacilities[category.id]?.length;

                        return (
                          <FormControlLabel
                            key={category.id}
                            control={
                              <Checkbox
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCategories(prev => [...prev, category.id]);
                                  } else {
                                    setSelectedCategories(prev => prev.filter(id => id !== category.id));
                                  }
                                }}
                                size="small"
                                sx={{
                                  color: category.markerColor,
                                  '&.Mui-checked': { color: category.markerColor },
                                  p: 0.5,
                                }}
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Icon sx={{ fontSize: 18, color: category.markerColor }} />
                                <Typography variant="body2">{category.label}</Typography>
                                {isSelected && count !== undefined && (
                                  <Typography variant="caption" color="text.secondary">
                                    ({count})
                                  </Typography>
                                )}
                              </Box>
                            }
                            sx={{ display: 'flex', m: 0, ml: 0.5, width: '100%' }}
                          />
                        );
                      })}

                      {/* ローディング表示 */}
                      {facilitySearchLoading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                          <CircularProgress size={20} />
                        </Box>
                      )}

                      {/* クリアボタン */}
                      {selectedCategories.length > 0 && (
                        <Button
                          size="small"
                          color="inherit"
                          onClick={() => setSelectedCategories([])}
                          sx={{ mt: 1, width: '100%' }}
                        >
                          クリア
                        </Button>
                      )}
                    </Box>
                  )}

                  {/* レイヤータブ */}
                  {activeOptionsTab === 1 && (
                    <Box sx={{ p: 1, maxHeight: 300, overflowY: 'auto' }}>
                      {layersLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : availableLayers.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                          利用可能なレイヤーがありません
                        </Typography>
                      ) : (
                        availableLayers.map(layer => {
                          const isSelected = selectedLayers.includes(layer.id);

                          return (
                            <FormControlLabel
                              key={layer.id}
                              control={
                                <Checkbox
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedLayers(prev => [...prev, layer.id]);
                                    } else {
                                      setSelectedLayers(prev => prev.filter(id => id !== layer.id));
                                    }
                                  }}
                                  size="small"
                                  sx={{
                                    color: layer.color,
                                    '&.Mui-checked': { color: layer.color },
                                    p: 0.5,
                                  }}
                                />
                              }
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
                                  <Box
                                    sx={{
                                      width: 14,
                                      height: 14,
                                      bgcolor: layer.color,
                                      opacity: layer.opacity + 0.3,
                                      borderRadius: 0.5,
                                      flexShrink: 0,
                                    }}
                                  />
                                  <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                                    {layer.label}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                                    ({layer.description})
                                  </Typography>
                                  {layer.attribution && (
                                    <Tooltip title={`出典: ${layer.attribution}`} placement="top">
                                      <InfoIcon sx={{ fontSize: 14, color: 'text.disabled', ml: 0.5 }} />
                                    </Tooltip>
                                  )}
                                </Box>
                              }
                              sx={{ display: 'flex', m: 0, ml: 0.5, width: '100%' }}
                            />
                          );
                        })
                      )}

                      {/* クリアボタン */}
                      {selectedLayers.length > 0 && (
                        <Button
                          size="small"
                          color="inherit"
                          onClick={() => setSelectedLayers([])}
                          sx={{ mt: 1, width: '100%' }}
                        >
                          クリア
                        </Button>
                      )}
                    </Box>
                  )}
                </Collapse>
              </Paper>
            </Box>
          )}

          {/* ストリートビュー切り替えFAB（モバイルのみ表示） */}
          {mapLoaded && !slideshowActive && isMobile && (
            <Tooltip title={streetViewVisible ? "地図に戻る" : "ストリートビュー"} placement="left">
              <Fab
                size="medium"
                color={streetViewVisible ? "default" : "primary"}
                onClick={toggleStreetView}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  zIndex: 5,
                  boxShadow: 3,
                }}
              >
                {streetViewVisible ? <MapIcon /> : <StreetviewIcon />}
              </Fab>
            </Tooltip>
          )}
        </Box>

        {/* ストリートビュー上部の区切り線 */}
        {streetViewVisible && (
          <Box sx={{ height: 2, bgcolor: '#e0e0e0', flexShrink: 0 }} />
        )}

        {/* ストリートビューコンテナ（下半分） - 常にレンダリング */}
        <Box
          sx={{
            position: 'relative',
            height: streetViewVisible ? '50%' : '0',
            width: '100%',
            overflow: 'hidden',
            transition: 'height 0.3s ease',
          }}
          onMouseMove={slideshowActive ? handleMouseMove : undefined}
          onMouseEnter={slideshowActive ? () => setControlsVisible(true) : undefined}
        >
          <Box
            ref={streetViewRef}
            sx={{
              height: '100%',
              width: '100%',
              bgcolor: 'grey.100',
            }}
          />

          {/* 閉じるボタン（ストリートビュー表示中は常時表示） */}
          {streetViewVisible && (
            <Tooltip title="ストリートビューを閉じる">
              <IconButton
                size="small"
                onClick={slideshowActive ? handleCloseSlideshow : toggleStreetView}
                sx={{
                  position: 'absolute',
                  top: 15,
                  right: 64,
                  zIndex: 11,
                  color: 'white',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* スライドショーコントロールオーバーレイ */}
          {slideshowActive && streetViewVisible && slideshowPoints.length > 0 && (
            <Fade in={controlsVisible}>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                  p: 2,
                  pt: 4,
                  zIndex: 10,
                }}
              >
                {/* 進捗スライダー */}
                <Slider
                  value={currentPointIndex}
                  onChange={(_, v) => {
                    setCurrentPointIndex(v);
                    setIsPlaying(false);
                  }}
                  min={0}
                  max={slideshowPoints.length - 1}
                  step={1}
                  sx={{
                    color: 'white',
                    '& .MuiSlider-thumb': {
                      width: 12,
                      height: 12,
                    },
                    '& .MuiSlider-rail': {
                      opacity: 0.4,
                    },
                  }}
                />

                {/* コントロールボタン */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  {/* 前へ */}
                  <IconButton
                    size="small"
                    onClick={() => setCurrentPointIndex((p) => Math.max(0, p - 1))}
                    disabled={currentPointIndex === 0}
                    sx={{ color: 'white', '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' } }}
                  >
                    <SkipPreviousIcon />
                  </IconButton>

                  {/* 再生/一時停止 */}
                  <IconButton
                    size="small"
                    onClick={() => setIsPlaying(!isPlaying)}
                    sx={{ color: 'white' }}
                  >
                    {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                  </IconButton>

                  {/* 次へ */}
                  <IconButton
                    size="small"
                    onClick={() => setCurrentPointIndex((p) => Math.min(slideshowPoints.length - 1, p + 1))}
                    disabled={currentPointIndex === slideshowPoints.length - 1}
                    sx={{ color: 'white', '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' } }}
                  >
                    <SkipNextIcon />
                  </IconButton>

                  {/* 進捗表示 */}
                  <Typography
                    variant="body2"
                    sx={{ color: 'white', mx: 1, minWidth: 60, textAlign: 'center' }}
                  >
                    {currentPointIndex + 1} / {slideshowPoints.length}
                  </Typography>

                  {/* スペーサー */}
                  <Box sx={{ flex: 1 }} />

                  {/* 速度調整 */}
                  <Select
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(e.target.value)}
                    size="small"
                    sx={{
                      color: 'white',
                      height: 28,
                      fontSize: '0.75rem',
                      '& .MuiSelect-icon': { color: 'white' },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'white',
                      },
                    }}
                  >
                    <MenuItem value={0.5}>0.5x</MenuItem>
                    <MenuItem value={1}>1x</MenuItem>
                    <MenuItem value={2}>2x</MenuItem>
                    <MenuItem value={3}>3x</MenuItem>
                  </Select>

                  {/* フルスクリーンボタン */}
                  {onFullscreenSlideshow && (
                    <Tooltip title="フルスクリーン">
                      <IconButton
                        size="small"
                        onClick={() => {
                          onFullscreenSlideshow(slideshowPoints, currentPointIndex);
                        }}
                        sx={{ color: 'white' }}
                      >
                        <OpenInFullIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}

                  {/* 閉じるボタン */}
                  <Tooltip title="スライドショーを終了">
                    <IconButton
                      size="small"
                      onClick={handleCloseSlideshow}
                      sx={{ color: 'white' }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Fade>
          )}
        </Box>
      </Box>

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

      {/* 経路追加モードオーバーレイ */}
      <Fade in={routeAddMode}>
        <Box
          sx={{
            position: 'absolute',
            top: 56,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 3,
          }}
        >
          {/* 上部ガイド */}
          <Paper
            elevation={4}
            sx={{
              position: 'absolute',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              px: 3,
              py: 2,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(4px)',
              pointerEvents: 'auto',
              textAlign: 'center',
              maxWidth: 360,
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              目的地を選択してください
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              地図をクリックして目的地を設定します。
              {tempDestination && 'マーカーをドラッグして微調整できます。'}
            </Typography>
            {tempDestination && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                選択位置: {tempDestination.lat.toFixed(6)}, {tempDestination.lng.toFixed(6)}
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleCancelRouteAddMode}
              >
                キャンセル
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleConfirmDestination}
                disabled={!tempDestination}
              >
                確定
              </Button>
            </Box>
          </Paper>
        </Box>
      </Fade>

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

      {/* グラウンディングウィジェット閉じるボタン（ウィジェット外側） */}
      {mapLoaded && widgetVisible && (
        <Tooltip title="閉じる">
          <IconButton
            size="small"
            onClick={() => setWidgetVisible(false)}
            sx={{
              position: 'absolute',
              top: 72,
              right: 8,
              bgcolor: 'white',
              boxShadow: 2,
              zIndex: 6,
              '&:hover': {
                bgcolor: 'grey.100',
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Google Maps Grounding Widget */}
      {mapLoaded && widgetVisible && (
        <Box
          sx={{
            position: 'absolute',
            top: 80,
            right: 16,
            width: 320,
            maxHeight: 'calc(100% - 180px)',
            zIndex: 5,
          }}
        >
          <gmp-place-contextual
            ref={widgetElementRef}
            style={{
              display: 'block',
              width: '100%',
            }}
          >
            <gmp-place-contextual-list-config layout="compact" />
          </gmp-place-contextual>
        </Box>
      )}

      {/* AIチャットウィジェット（ストリートビュー表示時は非表示） */}
      {mapLoaded && !streetViewVisible && (
        <MapChatWidget
          property={property}
          accessToken={accessToken}
          onPlaceClick={onPlaceClick}
          onWidgetTokenChange={onWidgetTokenChange}
          onAddressesFound={handleAddressesFound}
          rightOffset={chatRightOffset}
        />
      )}
    </Box>
  );
}
