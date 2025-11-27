import React, { useEffect, useState, useCallback } from 'react';
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
} from '@mui/material';
import {
  Home as HomeIcon,
  MyLocation as MyLocationIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Visibility as StreetViewIcon,
  Info as InfoIcon,
  Add as AddIcon,
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
  onNewBuildingClick
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapType, setMapType] = useState('roadmap');
  const [layerLoadingStates, setLayerLoadingStates] = useState({});

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


  // 学区ポリゴンの状態管理（useRefを使用して無限ループを防ぐ）
  // 小学校区と中学校区のポリゴンを別々に管理
  const elementarySchoolPolygonsRef = React.useRef([]);
  const juniorHighSchoolPolygonsRef = React.useRef([]);

  // 学区ポリゴンを地図に表示（汎用化：色とrefを引数で指定）
  const displaySchoolDistricts = useCallback((geojson, polygonsRef, color, schoolType, attribution) => {
    if (!map || !geojson || !geojson.features) {
      return;
    }

    // 既存のポリゴンをクリア
    polygonsRef.current.forEach(polygon => {
      polygon.setMap(null);
    });

    const newPolygons = [];

    geojson.features.forEach((feature, index) => {
      const geometry = feature.geometry;
      const properties = feature.properties;

      if (geometry.type === 'Polygon') {
        // Polygon の場合
        const paths = geometry.coordinates.map(ring =>
          ring.map(coord => ({ lat: coord[1], lng: coord[0] }))
        );

        const polygon = new google.maps.Polygon({
          paths: paths,
          strokeColor: color,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: color,
          fillOpacity: 0.15,
          map: map,
        });

        // マウスホバー時のハイライト効果
        polygon.addListener('mouseover', () => {
          polygon.setOptions({
            strokeWeight: 4,
            fillOpacity: 0.35,
          });
        });

        polygon.addListener('mouseout', () => {
          polygon.setOptions({
            strokeWeight: 2,
            fillOpacity: 0.15,
          });
        });

        // クリックイベントを追加
        polygon.addListener('click', (event) => {
          const formattedAttribution = attribution ? attribution.replace(/\n/g, '<br>') : '';
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; font-family: 'Segoe UI', sans-serif;">
                <h4 style="margin: 0 0 8px 0; font-size: 1rem; color: #333;">${properties.school_name}</h4>
                <p style="margin: 4px 0; font-size: 0.875rem; color: #666;">${properties.name}</p>
                <p style="margin: 4px 0; font-size: 0.875rem; color: #666;">${properties.city}</p>
                <p style="margin: 4px 0; font-size: 0.875rem; color: #666;">${properties.school_type}</p>
                ${formattedAttribution ? `<p style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 0.75rem; color: #999;">${formattedAttribution}</p>` : ''}
              </div>
            `,
            position: event.latLng,
          });
          infoWindow.open(map);
        });

        newPolygons.push(polygon);
      } else if (geometry.type === 'MultiPolygon') {
        // MultiPolygon の場合
        geometry.coordinates.forEach(polygonCoords => {
          const paths = polygonCoords.map(ring =>
            ring.map(coord => ({ lat: coord[1], lng: coord[0] }))
          );

          const polygon = new google.maps.Polygon({
            paths: paths,
            strokeColor: color,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: color,
            fillOpacity: 0.15,
            map: map,
          });

          // マウスホバー時のハイライト効果
          polygon.addListener('mouseover', () => {
            polygon.setOptions({
              strokeWeight: 4,
              fillOpacity: 0.35,
            });
          });

          polygon.addListener('mouseout', () => {
            polygon.setOptions({
              strokeWeight: 2,
              fillOpacity: 0.15,
            });
          });

          // クリックイベントを追加
          polygon.addListener('click', (event) => {
            const formattedAttribution = attribution ? attribution.replace(/\n/g, '<br>') : '';
            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div style="padding: 8px; font-family: 'Segoe UI', sans-serif;">
                  <h4 style="margin: 0 0 8px 0; font-size: 1rem; color: #333;">${properties.school_name}</h4>
                  <p style="margin: 4px 0; font-size: 0.875rem; color: #666;">${properties.name}</p>
                  <p style="margin: 4px 0; font-size: 0.875rem; color: #666;">${properties.city}</p>
                  <p style="margin: 4px 0; font-size: 0.875rem; color: #666;">${properties.school_type}</p>
                  ${formattedAttribution ? `<p style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 0.75rem; color: #999;">${formattedAttribution}</p>` : ''}
                </div>
              `,
              position: event.latLng,
            });
            infoWindow.open(map);
          });

          newPolygons.push(polygon);
        });
      }
    });

    polygonsRef.current = newPolygons;
  }, [map]);

  // 学区データを取得（汎用化：school_typeパラメータ追加）
  const fetchSchoolDistricts = useCallback(async (schoolTypeParam, polygonsRef, color, schoolType, attribution, layerKey) => {
    try {
      // ローディング開始
      setLayerLoadingStates(prev => ({ ...prev, [layerKey]: true }));

      const response = await fetch(`/api/v1/school_districts?school_type=${schoolTypeParam}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const geojson = await response.json();
        displaySchoolDistricts(geojson, polygonsRef, color, schoolType, attribution);
      } else if (response.status === 401) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error(`Error fetching school districts (${schoolType}):`, error);
    } finally {
      // ローディング終了
      setLayerLoadingStates(prev => ({ ...prev, [layerKey]: false }));
    }
  }, [displaySchoolDistricts]);

  // 小学校区レイヤーの表示/非表示を切り替え
  useEffect(() => {
    if (!isLoaded || !map) return;

    const isElementarySchoolLayerVisible = selectedLayers.includes('elementary-school-district');

    if (isElementarySchoolLayerVisible) {
      // availableLayersから色とattributionを取得
      const layerConfig = availableLayers.find(layer => layer.id === 'elementary-school-district');
      const color = layerConfig?.color || '#FF6B00'; // デフォルト色
      const attribution = layerConfig?.attribution || '';

      // 色が変わった場合は再描画
      const needsRedraw = elementarySchoolPolygonsRef.current.length > 0 &&
                         elementarySchoolPolygonsRef.current[0]?.strokeColor !== color;

      if (elementarySchoolPolygonsRef.current.length === 0 || needsRedraw) {
        if (needsRedraw) {
          // 既存のポリゴンを削除
          elementarySchoolPolygonsRef.current.forEach(polygon => polygon.setMap(null));
          elementarySchoolPolygonsRef.current = [];
        }
        fetchSchoolDistricts('elementary', elementarySchoolPolygonsRef, color, '小学校区', attribution, 'elementary-school-district');
      }
    } else {
      // 小学校区ポリゴンを非表示
      elementarySchoolPolygonsRef.current.forEach(polygon => {
        polygon.setMap(null);
      });
      elementarySchoolPolygonsRef.current = [];
    }
  }, [selectedLayers, availableLayers, isLoaded, map, fetchSchoolDistricts]);

  // 中学校区レイヤーの表示/非表示を切り替え
  useEffect(() => {
    if (!isLoaded || !map) return;

    const isJuniorHighSchoolLayerVisible = selectedLayers.includes('junior-high-school-district');

    if (isJuniorHighSchoolLayerVisible) {
      // availableLayersから色とattributionを取得
      const layerConfig = availableLayers.find(layer => layer.id === 'junior-high-school-district');
      const color = layerConfig?.color || '#2196F3'; // デフォルト色
      const attribution = layerConfig?.attribution || '';

      // 色が変わった場合は再描画
      const needsRedraw = juniorHighSchoolPolygonsRef.current.length > 0 &&
                         juniorHighSchoolPolygonsRef.current[0]?.strokeColor !== color;

      if (juniorHighSchoolPolygonsRef.current.length === 0 || needsRedraw) {
        if (needsRedraw) {
          // 既存のポリゴンを削除
          juniorHighSchoolPolygonsRef.current.forEach(polygon => polygon.setMap(null));
          juniorHighSchoolPolygonsRef.current = [];
        }
        fetchSchoolDistricts('junior_high', juniorHighSchoolPolygonsRef, color, '中学校区', attribution, 'junior-high-school-district');
      }
    } else {
      // 中学校区ポリゴンを非表示
      juniorHighSchoolPolygonsRef.current.forEach(polygon => {
        polygon.setMap(null);
      });
      juniorHighSchoolPolygonsRef.current = [];
    }
  }, [selectedLayers, availableLayers, isLoaded, map, fetchSchoolDistricts]);

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

      // 全ての物件が見えるように地図をフィット
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
    }

    return () => {
      if (window.openPropertyDetail) {
        delete window.openPropertyDetail;
      }
      if (window.selectProperty) {
        delete window.selectProperty;
      }
    };
  }, [isLoaded, map, properties]);

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
            bottom: 20,
            right: 20,
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
