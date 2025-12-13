import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ThemeProvider,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Paper,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
  useMediaQuery,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Map as MapIcon,
  Home as HomeIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Person as PersonIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import muiTheme from '../theme/muiTheme';

// 子コンポーネントのインポート
import BuildingInfoPanel from '../components/BuildingDetail/BuildingInfoPanel';
import PropertyMapPanel from '../components/BuildingDetail/PropertyMapPanel';
import RoomsPanel from '../components/BuildingDetail/RoomsPanel';
import BuildingPhotosPanel from '../components/BuildingDetail/BuildingPhotosPanel';

export default function BuildingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // 状態管理
  const [property, setProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isPhotosMaximized, setIsPhotosMaximized] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState(0); // モバイル用タブ管理
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // 未保存の変更
  const [selectedPlace, setSelectedPlace] = useState(null); // AI応答から選択された場所
  const [widgetContextToken, setWidgetContextToken] = useState(null); // Google Maps Grounding Widget Context Token
  const [leftPaneWidth, setLeftPaneWidth] = useState(280); // 左ペインの横幅
  const [rightPaneWidth, setRightPaneWidth] = useState(280); // 右ペインの横幅
  const [rightPaneTopHeight, setRightPaneTopHeight] = useState(50); // 右ペイン上部の高さ（パーセンテージ）
  const [isResizingLeft, setIsResizingLeft] = useState(false); // 左側リサイズ中かどうか
  const [isResizingRight, setIsResizingRight] = useState(false); // 右側リサイズ中かどうか
  const [isResizingVertical, setIsResizingVertical] = useState(false); // 垂直方向リサイズ中かどうか

  // レスポンシブ設定
  const isMdUp = useMediaQuery(muiTheme.breakpoints.up('md'));
  const isLgUp = useMediaQuery(muiTheme.breakpoints.up('lg'));
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md')); // 960px未満（スマホ・小タブレット）

  // データ取得
  useEffect(() => {
    fetchPropertyData();
    fetchStores();
  }, [id]);

  // 店舗一覧の取得
  const fetchStores = async () => {
    try {
      const response = await fetch('/api/v1/stores', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setStores(data);
      }
    } catch (err) {
      console.error('店舗取得エラー:', err);
    }
  };

  // geocoding失敗アラートの表示
  useEffect(() => {
    if (location.state?.geocodingFailed && !loading) {
      showSnackbar(
        '物件は登録されましたが、住所から位置情報を取得できませんでした。地図上で手動で位置を設定してください。',
        'error'
      );
      // location stateをクリア（リロード時に再度表示されないように）
      window.history.replaceState({}, document.title);
    }
  }, [location.state, loading]);

  // 未保存の変更がある場合、ページ離脱時に警告を表示
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const fetchPropertyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 物件詳細データ取得
      const propertyResponse = await fetch(`/api/v1/buildings/${id}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!propertyResponse.ok) {
        throw new Error('物件データの取得に失敗しました');
      }
      const propertyData = await propertyResponse.json();
      setProperty(propertyData);

      // 部屋データを物件データに含まれているか確認
      if (propertyData.rooms) {
        setRooms(propertyData.rooms);
      } else {
        // 別途部屋データ取得
        try {
          const roomsResponse = await fetch(`/api/v1/buildings/${id}/rooms`, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          if (roomsResponse.ok) {
            const roomsData = await roomsResponse.json();
            setRooms(roomsData.rooms || roomsData || []);
          }
        } catch (err) {
          console.error('部屋データの取得に失敗:', err);
          setRooms([]);
        }
      }

    } catch (err) {
      setError(err.message);
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      setSaving(true);

      const response = await fetch(`/api/v1/buildings/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ building: formData }),
      });

      if (!response.ok) {
        throw new Error('保存に失敗しました');
      }

      const result = await response.json();
      setProperty(result);
      showSnackbar('建物(土地)情報を保存しました', 'success');

    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRoomUpdate = async () => {
    // 部屋データを再取得
    try {
      const roomsResponse = await fetch(`/api/v1/buildings/${id}/rooms`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (roomsResponse.ok) {
        const roomsData = await roomsResponse.json();
        setRooms(roomsData.rooms || roomsData || []);
      }
    } catch (err) {
      console.error('部屋データの更新に失敗:', err);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleTogglePhotosMaximize = () => {
    setIsPhotosMaximized(!isPhotosMaximized);
  };

  const handleMobileTabChange = (event, newValue) => {
    setMobileActiveTab(newValue);
  };

  const handleFormChange = (hasChanges) => {
    setHasUnsavedChanges(hasChanges);
  };

  const handlePlaceClick = (address) => {
    console.log('Place clicked:', address);
    setSelectedPlace({ address, timestamp: Date.now() });
    showSnackbar(`地図上で「${address}」を検索しています...`, 'info');
  };

  // スプリッタバーのリサイズ処理（左側）
  const handleLeftMouseDown = (e) => {
    setIsResizingLeft(true);
    e.preventDefault();
  };

  // スプリッタバーのリサイズ処理（右側）
  const handleRightMouseDown = (e) => {
    setIsResizingRight(true);
    e.preventDefault();
  };

  // スプリッタバーのリサイズ処理（垂直方向）
  const handleVerticalMouseDown = (e) => {
    setIsResizingVertical(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      const containerRect = document.querySelector('.desktop-layout-container')?.getBoundingClientRect();
      if (!containerRect) return;

      if (isResizingLeft) {
        // 左ペインのリサイズ：左端からマウス位置までの距離を計算
        const newWidth = e.clientX - containerRect.left - 8; // 8pxはpadding/gap分
        // 最小幅200px、最大幅500px
        const clampedWidth = Math.max(200, Math.min(500, newWidth));
        setLeftPaneWidth(clampedWidth);
      }

      if (isResizingRight) {
        // 右ペインのリサイズ：右端からマウス位置までの距離を計算
        const newWidth = containerRect.right - e.clientX - 8; // 8pxはpadding/gap分
        // 最小幅300px、最大幅800px
        const clampedWidth = Math.max(300, Math.min(800, newWidth));
        setRightPaneWidth(clampedWidth);
      }

      if (isResizingVertical) {
        // 垂直方向のリサイズ：右ペインコンテナの上端からマウス位置までの距離をパーセンテージで計算
        const rightPaneRect = document.querySelector('.right-pane-container')?.getBoundingClientRect();
        if (!rightPaneRect) return;

        const relativeY = e.clientY - rightPaneRect.top;
        const percentage = (relativeY / rightPaneRect.height) * 100;

        // 最小30%、最大70%
        const clampedPercentage = Math.max(30, Math.min(70, percentage));
        setRightPaneTopHeight(clampedPercentage);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
      setIsResizingVertical(false);
    };

    if (isResizingLeft || isResizingRight || isResizingVertical) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // リサイズ中はユーザー選択を無効化
      document.body.style.userSelect = 'none';
      document.body.style.cursor = isResizingVertical ? 'row-resize' : 'col-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizingLeft, isResizingRight, isResizingVertical]);

  if (loading) {
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          bgcolor="background.default"
        >
          <CircularProgress size={60} />
        </Box>
      </ThemeProvider>
    );
  }

  if (error || !property) {
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          bgcolor="background.default"
          gap={2}
        >
          <Typography variant="h6" color="error">
            {error || '物件が見つかりません'}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/buildings')}>
            物件一覧に戻る
          </Button>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>

        {/* ヘッダー */}
        <AppBar position="static" elevation={0} sx={{
          bgcolor: 'primary.main',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          borderRadius: '12px 12px 0 0',
        }}>
          <Toolbar variant="dense" sx={{ minHeight: 52 }}>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h6" component="h1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                {property.name}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.85rem' }}>
                {property.address}
              </Typography>
            </Box>
            <Button
              color="inherit"
              onClick={() => window.close()}
              sx={{
                minWidth: 'auto',
                p: 1,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
              title="閉じる"
            >
              <CloseIcon />
            </Button>
          </Toolbar>
        </AppBar>

        {/* メインコンテンツ */}
        {isMobile ? (
          // モバイルレイアウト: タブ形式
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* タブヘッダー */}
            <Paper elevation={1} sx={{ borderRadius: 0 }}>
              <Tabs
                value={mobileActiveTab}
                onChange={handleMobileTabChange}
                variant="fullWidth"
                indicatorColor="primary"
                textColor="primary"
                sx={{ borderBottom: '1px solid #ddd' }}
              >
                <Tab
                  icon={<BusinessIcon />}
                  label="建物"
                  id="mobile-tab-0"
                  aria-controls="mobile-tabpanel-0"
                  sx={{ minHeight: 64 }}
                />
                <Tab
                  icon={<MapIcon />}
                  label="地図"
                  id="mobile-tab-1"
                  aria-controls="mobile-tabpanel-1"
                  sx={{ minHeight: 64 }}
                />
                <Tab
                  icon={<PhotoLibraryIcon />}
                  label="外観"
                  id="mobile-tab-2"
                  aria-controls="mobile-tabpanel-2"
                  sx={{ minHeight: 64 }}
                />
                <Tab
                  icon={<HomeIcon />}
                  label="部屋"
                  id="mobile-tab-3"
                  aria-controls="mobile-tabpanel-3"
                  sx={{ minHeight: 64 }}
                />
              </Tabs>
            </Paper>

            {/* タブコンテンツ - 常にマウントし、display で表示切り替え */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {/* 物件情報タブ */}
              <Box sx={{ display: mobileActiveTab === 0 ? 'block' : 'none' }}>
                <BuildingInfoPanel
                  property={property}
                  onSave={handleSave}
                  loading={saving}
                  isMobile={true}
                  onFormChange={handleFormChange}
                  stores={stores}
                />
              </Box>

              {/* 地図タブ */}
              <Box sx={{
                display: mobileActiveTab === 1 ? 'block' : 'none',
                height: '100vh',
                width: '100%',
                position: 'relative'
              }}>
                <PropertyMapPanel
                  property={property}
                  onLocationUpdate={(lat, lng) => {
                    setProperty(prev => ({ ...prev, latitude: lat, longitude: lng }));
                  }}
                  visible={mobileActiveTab === 1}
                  onFormChange={handleFormChange}
                  onSave={handleSave}
                  selectedPlace={selectedPlace}
                  onPlaceClick={handlePlaceClick}
                  widgetContextToken={widgetContextToken}
                  onWidgetTokenChange={(token) => {
                    setWidgetContextToken(token);
                  }}
                  isMobile={true}
                />
              </Box>

              {/* 外観タブ */}
              <Box sx={{
                display: mobileActiveTab === 2 ? 'block' : 'none',
                height: '100vh',
                width: '100%'
              }}>
                <BuildingPhotosPanel
                  propertyId={id}
                  buildingName={property.name}
                  rooms={rooms}
                  onPhotosUpdate={() => {}}
                  isMaximized={false} // モバイルでは最大化無効
                  onToggleMaximize={() => {}} // 無効化
                  isMobile={true}
                />
              </Box>

              {/* 部屋タブ */}
              <Box sx={{
                display: mobileActiveTab === 3 ? 'block' : 'none',
                height: '100%'
              }}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* 部屋一覧 */}
                  <Box sx={{ flex: 1 }}>
                    <RoomsPanel
                      propertyId={id}
                      rooms={rooms}
                      onRoomsUpdate={handleRoomUpdate}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        ) : (
          // デスクトップレイアウト: 3カラムカードレイアウト
          <Box sx={{
            flex: 1,
            overflow: 'hidden',
            px: 1,
            py: 1,
            bgcolor: 'grey.50'
          }}>
            <Box
              className="desktop-layout-container"
              sx={{
                display: 'flex',
                flexDirection: 'row',
                gap: 1,
                height: '100%',
              }}
            >
              {/* 左カラム: 建物（土地）カード */}
              <Paper
                elevation={3}
                sx={{
                  width: leftPaneWidth,
                  flexShrink: 0,
                  borderRadius: 2,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                <BuildingInfoPanel
                  property={property}
                  onSave={handleSave}
                  loading={saving}
                  onFormChange={handleFormChange}
                  stores={stores}
                />
              </Paper>

              {/* スプリッタバー（左側） */}
              <Box
                onMouseDown={handleLeftMouseDown}
                sx={{
                  width: 6,
                  cursor: 'col-resize',
                  bgcolor: isResizingLeft ? 'primary.main' : 'transparent',
                  '&:hover': {
                    bgcolor: 'primary.light',
                  },
                  transition: 'background-color 0.2s',
                  flexShrink: 0,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 2,
                    height: 40,
                    bgcolor: isResizingLeft ? 'primary.main' : 'grey.400',
                    borderRadius: 1,
                  },
                }}
              />

              {/* 中央: 物件位置（地図）カード - AIチャットウィジェット統合 */}
              <Paper
                elevation={3}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  borderRadius: 2,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                <PropertyMapPanel
                  property={property}
                  onLocationUpdate={(lat, lng) => {
                    setProperty(prev => ({ ...prev, latitude: lat, longitude: lng }));
                  }}
                  onFormChange={handleFormChange}
                  onSave={handleSave}
                  selectedPlace={selectedPlace}
                  onPlaceClick={handlePlaceClick}
                  widgetContextToken={widgetContextToken}
                  onWidgetTokenChange={(token) => {
                    setWidgetContextToken(token);
                  }}
                />
              </Paper>

              {/* スプリッタバー（右側） */}
              <Box
                onMouseDown={handleRightMouseDown}
                sx={{
                  width: 6,
                  cursor: 'col-resize',
                  bgcolor: isResizingRight ? 'primary.main' : 'transparent',
                  '&:hover': {
                    bgcolor: 'primary.light',
                  },
                  transition: 'background-color 0.2s',
                  flexShrink: 0,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 2,
                    height: 40,
                    bgcolor: isResizingRight ? 'primary.main' : 'grey.400',
                    borderRadius: 1,
                  },
                }}
              />

              {/* 右カラム: 部屋一覧と外観写真 */}
              <Box
                className="right-pane-container"
                sx={{
                  width: rightPaneWidth,
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                {/* 右上: 部屋一覧カード */}
                <Paper
                  elevation={3}
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: `${rightPaneTopHeight}%`,
                    minHeight: 0,
                  }}
                >
                  <RoomsPanel
                    propertyId={id}
                    rooms={rooms}
                    onRoomsUpdate={handleRoomUpdate}
                  />
                </Paper>

                {/* スプリッタバー（垂直方向） */}
                <Box
                  onMouseDown={handleVerticalMouseDown}
                  sx={{
                    height: 6,
                    cursor: 'row-resize',
                    bgcolor: isResizingVertical ? 'primary.main' : 'transparent',
                    '&:hover': {
                      bgcolor: 'primary.light',
                    },
                    transition: 'background-color 0.2s',
                    flexShrink: 0,
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 40,
                      height: 2,
                      bgcolor: isResizingVertical ? 'primary.main' : 'grey.400',
                      borderRadius: 1,
                    },
                  }}
                />

                {/* 右下: 外観写真カード */}
                <Paper
                  elevation={3}
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: `${100 - rightPaneTopHeight}%`,
                    minHeight: 0,
                  }}
                >
                  <BuildingPhotosPanel
                    propertyId={id}
                    buildingName={property.name}
                    rooms={rooms}
                    onPhotosUpdate={() => {}}
                    isMaximized={false}
                    onToggleMaximize={() => {}}
                  />
                </Paper>
              </Box>
            </Box>
          </Box>
        )}

        {/* スナックバー */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}
