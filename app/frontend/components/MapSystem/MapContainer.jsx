import React, { useEffect, useState } from 'react';
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
  rightPanelVisible,
  onToggleRightPanel,
  selectedObject,
  properties = [],
  isLoading = false,
  onNewBuildingClick
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapType, setMapType] = useState('roadmap');

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
          <button onclick="window.openPropertyDetail(${property.id})"
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


  // 地図が読み込まれたら物件マーカーを配置
  useEffect(() => {
    if (isLoaded && map) {
      // 詳細ページを新しいタブで開く関数
      window.openPropertyDetail = (propertyId) => {
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
          console.log(`Creating marker for ${property.name} with icon: ${iconUrl}`);

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

    </Box>
  );
}
