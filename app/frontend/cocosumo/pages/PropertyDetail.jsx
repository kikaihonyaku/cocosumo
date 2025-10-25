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
} from '@mui/icons-material';
import muiTheme from '../theme/muiTheme';

// 子コンポーネントのインポート
import PropertyInfoPanel from '../components/PropertyDetail/PropertyInfoPanel';
import PropertyMapPanel from '../components/PropertyDetail/PropertyMapPanel';
import RoomsPanel from '../components/PropertyDetail/RoomsPanel';
import PhotosPanel from '../components/PropertyDetail/PhotosPanel';
import OwnersPanel from '../components/PropertyDetail/OwnersPanel';

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // 状態管理
  const [property, setProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isPropertyInfoMaximized, setIsPropertyInfoMaximized] = useState(false);
  const [isPhotosMaximized, setIsPhotosMaximized] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState(0); // モバイル用タブ管理
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // 未保存の変更

  // レスポンシブ設定
  const isMdUp = useMediaQuery(muiTheme.breakpoints.up('md'));
  const isLgUp = useMediaQuery(muiTheme.breakpoints.up('lg'));
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md')); // 960px未満（スマホ・小タブレット）

  // データ取得
  useEffect(() => {
    fetchPropertyData();
  }, [id]);

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

  const handleOwnerUpdate = async () => {
    // 家主データを再取得
    try {
      const propertyResponse = await fetch(`/api/v1/buildings/${id}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (propertyResponse.ok) {
        const propertyData = await propertyResponse.json();
        setProperty(propertyData);
      }
    } catch (err) {
      console.error('家主データの更新に失敗:', err);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleTogglePropertyInfoMaximize = () => {
    setIsPropertyInfoMaximized(!isPropertyInfoMaximized);
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

  // TabPanelコンポーネント
  function TabPanel({ children, value, index, ...other }) {
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`mobile-tabpanel-${index}`}
        aria-labelledby={`mobile-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ minHeight: '100%', pb: 2 }}>
            {children}
          </Box>
        )}
      </div>
    );
  }

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
          <Toolbar variant="dense" sx={{ minHeight: '52px', py: 1 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" component="h1" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                {property.name}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.8rem' }}>
                {property.address}
              </Typography>
            </Box>
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
                  label="建物(土地)"
                  id="mobile-tab-0"
                  aria-controls="mobile-tabpanel-0"
                  sx={{ minHeight: 64 }}
                />
                <Tab
                  icon={<MapIcon />}
                  label="地図・写真"
                  id="mobile-tab-1"
                  aria-controls="mobile-tabpanel-1"
                  sx={{ minHeight: 64 }}
                />
                <Tab
                  icon={<HomeIcon />}
                  label="部屋・家主"
                  id="mobile-tab-2"
                  aria-controls="mobile-tabpanel-2"
                  sx={{ minHeight: 64 }}
                />
              </Tabs>
            </Paper>

            {/* タブコンテンツ */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {/* 物件情報タブ */}
              <TabPanel value={mobileActiveTab} index={0}>
                <PropertyInfoPanel
                  property={property}
                  onSave={handleSave}
                  loading={saving}
                  isMaximized={false} // モバイルでは最大化無効
                  onToggleMaximize={() => {}} // 無効化
                  isMobile={true}
                  onFormChange={handleFormChange}
                />
              </TabPanel>

              {/* 地図・写真タブ */}
              <TabPanel value={mobileActiveTab} index={1}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  {/* 地図エリア */}
                  <Box sx={{ height: '400px', minHeight: '400px' }}>
                    <PropertyMapPanel
                      property={property}
                      onLocationUpdate={(lat, lng) => {
                        setProperty(prev => ({ ...prev, latitude: lat, longitude: lng }));
                      }}
                      visible={mobileActiveTab === 1}
                      onFormChange={handleFormChange}
                      onSave={handleSave}
                    />
                  </Box>

                  {/* 写真エリア */}
                  <Box sx={{ minHeight: '400px', borderTop: '1px solid #ddd' }}>
                    <PhotosPanel
                      propertyId={id}
                      onPhotosUpdate={() => {}}
                      isMaximized={false} // モバイルでは最大化無効
                      onToggleMaximize={() => {}} // 無効化
                      isMobile={true}
                    />
                  </Box>
                </Box>
              </TabPanel>

              {/* 部屋・家主タブ */}
              <TabPanel value={mobileActiveTab} index={2}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* 部屋一覧 */}
                  <Box sx={{ flex: 1, borderBottom: '1px solid #ddd' }}>
                    <RoomsPanel
                      propertyId={id}
                      rooms={rooms}
                      onRoomsUpdate={handleRoomUpdate}
                    />
                  </Box>

                  {/* 家主情報 */}
                  <Box sx={{ height: '200px', overflow: 'auto' }}>
                    <OwnersPanel
                      propertyId={id}
                      owners={property?.owners || []}
                      onOwnersUpdate={handleOwnerUpdate}
                    />
                  </Box>
                </Box>
              </TabPanel>
            </Box>
          </Box>
        ) : (
          // デスクトップレイアウト: 3カラムカードレイアウト
          <Box sx={{
            flex: 1,
            overflow: 'auto',
            px: 0.5,
            py: 1,
            bgcolor: 'grey.50'
          }}>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: isLgUp ? '280px 1fr 340px' : '1fr',
              gridTemplateRows: isLgUp ? 'auto auto' : 'auto',
              gap: 1,
              height: isLgUp ? 'fit-content' : 'auto',
            }}>
              {/* 左カラム: 建物（土地）カード */}
              <Paper
                elevation={3}
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  gridRow: isLgUp ? 'span 2' : 'auto',
                  minHeight: isLgUp ? 800 : 500,
                  maxHeight: isLgUp ? 'none' : 700,
                }}
              >
                <PropertyInfoPanel
                  property={property}
                  onSave={handleSave}
                  loading={saving}
                  isMaximized={false}
                  onToggleMaximize={() => {}}
                  onFormChange={handleFormChange}
                />
              </Paper>

              {/* 中央上: 物件位置（地図）カード */}
              <Paper
                elevation={3}
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 400,
                  maxHeight: isLgUp ? 500 : 600,
                }}
              >
                <PropertyMapPanel
                  property={property}
                  onLocationUpdate={(lat, lng) => {
                    setProperty(prev => ({ ...prev, latitude: lat, longitude: lng }));
                  }}
                  onFormChange={handleFormChange}
                  onSave={handleSave}
                />
              </Paper>

              {/* 右上: 部屋一覧カード */}
              <Paper
                elevation={3}
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 400,
                  maxHeight: isLgUp ? 500 : 600,
                }}
              >
                <RoomsPanel
                  propertyId={id}
                  rooms={rooms}
                  onRoomsUpdate={handleRoomUpdate}
                />
              </Paper>

              {/* 中央下: 外観写真カード */}
              <Paper
                elevation={3}
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 280,
                  maxHeight: isLgUp ? 350 : 500,
                }}
              >
                <PhotosPanel
                  propertyId={id}
                  onPhotosUpdate={() => {}}
                  isMaximized={false}
                  onToggleMaximize={() => {}}
                />
              </Paper>

              {/* 右下: 家主情報カード */}
              <Paper
                elevation={3}
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 280,
                  maxHeight: isLgUp ? 350 : 500,
                }}
              >
                <OwnersPanel
                  propertyId={id}
                  owners={property?.owners || []}
                  onOwnersUpdate={handleOwnerUpdate}
                />
              </Paper>
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
