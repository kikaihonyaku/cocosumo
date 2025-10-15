import React, { useState, useEffect } from "react";
import {
  ThemeProvider,
  CssBaseline,
  Box,
  useMediaQuery,
  Fade,
  Button,
  Paper,
  Collapse,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';
import muiTheme from '../theme/muiTheme';
import Header from "../components/shared/Header";
import MapContainer from "../components/MapSystem/MapContainer";
import LeftPanel from "../components/MapSystem/LeftPanel/LeftPanel";
import PropertyTable from "../components/MapSystem/BottomPanel/PropertyTable";
import BuildingFormModal from "../components/MapSystem/BuildingFormModal";

export default function MapSystem() {
  const [leftPanelPinned, setLeftPanelPinned] = useState(true);
  const [bottomPanelVisible, setBottomPanelVisible] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);
  const [selectedLayers, setSelectedLayers] = useState([]);
  const [rightPanelVisible, setRightPanelVisible] = useState(false);
  const [leftPanelHovered, setLeftPanelHovered] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [propertyListMaximized, setPropertyListMaximized] = useState(false);
  const [leftPanelForceClose, setLeftPanelForceClose] = useState(false);
  const [buildingFormModalOpen, setBuildingFormModalOpen] = useState(false);

  // データ管理用のステート
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchConditions, setSearchConditions] = useState({});
  const [mapControllers, setMapControllers] = useState(null);

  // レスポンシブ設定
  const isMdUp = useMediaQuery(muiTheme.breakpoints.up('md'));
  const isSmUp = useMediaQuery(muiTheme.breakpoints.up('sm'));
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md')); // 960px未満（モバイル）

  // モバイル時は左パネルをピン止めしない
  useEffect(() => {
    if (isMobile) {
      setLeftPanelPinned(false);
    }
  }, [isMobile]);

  // 初回データ取得
  useEffect(() => {
    fetchBuildings();
  }, []);

  // 物件データの取得
  const fetchBuildings = async (conditions = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      // クエリパラメータを構築
      const params = new URLSearchParams();
      if (conditions.propertyName) params.append('name', conditions.propertyName);
      if (conditions.address) params.append('address', conditions.address);
      if (conditions.buildingType) params.append('building_type', conditions.buildingType);
      if (conditions.hasVacancy === 'true') params.append('has_vacancy', 'true');
      if (conditions.hasVacancy === 'false') params.append('has_vacancy', 'false');
      if (conditions.minRooms) params.append('min_rooms', conditions.minRooms);
      if (conditions.maxRooms) params.append('max_rooms', conditions.maxRooms);
      if (conditions.maxVacancyRate) params.append('max_vacancy_rate', conditions.maxVacancyRate);

      const queryString = params.toString();
      const url = queryString ? `/api/v1/buildings?${queryString}` : '/api/v1/buildings';

      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      } else if (response.status === 401) {
        // 認証エラーの場合、ログインページにリダイレクト
        window.location.href = '/login';
        return;
      } else {
        throw new Error('物件情報の取得に失敗しました');
      }
    } catch (err) {
      console.error('取得エラー:', err);
      setError(err.message || 'ネットワークエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkerSelect = (type, data) => {
    setSelectedObject({ type, data });
    setRightPanelVisible(true);

    // 右パネルが表示される時に左パネルのホバー状態を閉じる
    if (!leftPanelPinned && leftPanelHovered) {
      setLeftPanelForceClose(true);
      setLeftPanelHovered(false);
      setTimeout(() => setLeftPanelForceClose(false), 300);
    }
  };

  const handleSearch = async (conditions) => {
    try {
      setSearchConditions(conditions);
      await fetchBuildings(conditions);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleLayerToggle = (layerId, enabled) => {
    setSelectedLayers(prev => {
      if (enabled) {
        return [...prev, layerId];
      } else {
        return prev.filter(id => id !== layerId);
      }
    });
    // ここでレイヤーの表示を切り替える処理を追加
    console.log('Layer toggled:', layerId, enabled);
  };

  const handleTogglePin = () => {
    setLeftPanelPinned(!leftPanelPinned);
  };

  const handleToggleBottomPanel = () => {
    setBottomPanelVisible(!bottomPanelVisible);
  };

  const handleTogglePropertyListMaximize = () => {
    setPropertyListMaximized(!propertyListMaximized);
    // 最大化時は下ペインを非表示に
    if (!propertyListMaximized) {
      setBottomPanelVisible(false);
    } else {
      // 最小化時（最大化を解除時）は下ペインを表示
      setBottomPanelVisible(true);
    }
  };

  const handleClosePropertyList = () => {
    setPropertyListMaximized(false);
    setBottomPanelVisible(false);
  };

  const handleMapAreaClick = () => {
    // 左パネルがピン止めされておらず、ホバー状態の場合は強制的に閉じる
    if (!leftPanelPinned && leftPanelHovered) {
      setLeftPanelForceClose(true);
      setLeftPanelHovered(false);
      // 少し遅延後にフォースクローズ状態をリセット
      setTimeout(() => setLeftPanelForceClose(false), 300);
    }
  };

  const getBuildingTypeLabel = (type) => {
    const typeMap = {
      mansion: 'マンション',
      apartment: 'アパート',
      house: '一戸建て',
      office: 'オフィス',
      store: '店舗',
      other: 'その他'
    };
    return typeMap[type] || type;
  };

  // 新規物件登録成功時のハンドラー
  const handleBuildingRegistered = (newBuilding) => {
    // 物件詳細画面を別タブで開く
    window.open(`/property/${newBuilding.id}`, '_blank');
    // 物件一覧を再取得
    fetchBuildings(searchConditions);
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* デスクトップ時のヘッダーホバーエリア */}
        {!isMobile && (
          <>
            <Box
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '20px',
                zIndex: 2200,
                pointerEvents: 'all',
              }}
              onMouseEnter={() => setHeaderVisible(true)}
              onMouseLeave={() => setHeaderVisible(false)}
            />

            {/* ヘッダーエリア */}
            <Fade in={headerVisible} timeout={200}>
              <Box
                sx={{
                  position: 'fixed',
                  top: headerVisible ? 0 : '-60px',
                  left: 0,
                  right: 0,
                  zIndex: 2100,
                  transition: 'top 0.2s ease-in-out',
                }}
                onMouseEnter={() => setHeaderVisible(true)}
                onMouseLeave={() => setHeaderVisible(false)}
              >
                <Header />
              </Box>
            </Fade>
          </>
        )}

        {/* コンテンツエリア */}
        <Box
          sx={{
            display: 'flex',
            flex: 1,
            overflow: 'hidden',
            bgcolor: 'background.default',
            paddingTop: !isMobile ? (headerVisible ? '45px' : '0px') : '0px',
            transition: 'padding-top 0.2s ease-in-out',
          }}
        >
          {/* メインコンテンツエリア */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* 左ペイン（ピン止め時・フローティング時共通） */}
            <LeftPanel
              isPinned={leftPanelPinned}
              onTogglePin={handleTogglePin}
              onSearch={handleSearch}
              onLayerToggle={handleLayerToggle}
              searchConditions={searchConditions}
              selectedLayers={selectedLayers}
              onHoverChange={setLeftPanelHovered}
              isLoading={isLoading}
              error={error}
              forceClose={leftPanelForceClose}
            />
            {/* 上部エリア（地図 + 右ペイン） */}
            <Box
              sx={{
                display: 'flex',
                flex: 1,
                overflow: 'hidden',
                marginLeft: leftPanelPinned ? '323px' : '0px',
                transition: 'margin-left 0.3s ease',
              }}
            >
              {/* 中央の地図エリア */}
              <Box
                sx={{ flex: 1, position: 'relative' }}
                onClick={handleMapAreaClick}
              >
                {propertyListMaximized ? (
                  /* 最大化された物件一覧 */
                  <Fade in={true} timeout={300}>
                    <Paper
                      elevation={2}
                      sx={{
                        position: 'absolute',
                        top: '2px',
                        left: '2px',
                        right: rightPanelVisible && !isMobile ? '4px' : '2px',
                        bottom: '2px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                      }}
                    >
                      <Box sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        px: 2,
                        py: 0.5,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        minHeight: '40px'
                      }}>
                        <Box component="h3" sx={{ m: 0, fontSize: '1rem', fontWeight: 600 }}>
                          物件一覧（最大化表示）
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="元に戻す" placement="top">
                            <Button
                              size="small"
                              onClick={handleTogglePropertyListMaximize}
                              sx={{
                                color: 'white',
                                minWidth: 'auto',
                                p: 0.5,
                                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                              }}
                            >
                              <FullscreenExitIcon fontSize="small" />
                            </Button>
                          </Tooltip>
                          <Tooltip title="閉じる" placement="top">
                            <Button
                              size="small"
                              onClick={handleClosePropertyList}
                              sx={{
                                color: 'white',
                                minWidth: 'auto',
                                p: 0.5,
                                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                              }}
                            >
                              ✕
                            </Button>
                          </Tooltip>
                        </Box>
                      </Box>
                      <Box sx={{ flex: 1, overflow: 'auto' }}>
                        <PropertyTable
                          properties={properties}
                          onPropertySelect={(property) => {
                            setSelectedObject({ type: 'property', data: property });
                            setRightPanelVisible(true);
                            // 左パネルのホバー状態を閉じる
                            if (!leftPanelPinned && leftPanelHovered) {
                              setLeftPanelForceClose(true);
                              setLeftPanelHovered(false);
                              setTimeout(() => setLeftPanelForceClose(false), 300);
                            }
                          }}
                          searchConditions={searchConditions}
                        />
                      </Box>
                    </Paper>
                  </Fade>
                ) : (
                  /* 通常の地図表示 */
                  <MapContainer
                    onMarkerSelect={handleMarkerSelect}
                    rightPanelVisible={rightPanelVisible}
                    onToggleRightPanel={() => setRightPanelVisible(true)}
                    selectedObject={selectedObject}
                    properties={properties}
                    isLoading={isLoading}
                    onNewBuildingClick={() => setBuildingFormModalOpen(true)}
                  />
                )}
              </Box>

              {/* モバイル用背景オーバーレイ */}
              {isMobile && rightPanelVisible && (
                <Box
                  sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(0, 0, 0, 0.4)',
                    zIndex: 1300,
                  }}
                  onClick={() => setRightPanelVisible(false)}
                />
              )}

              {/* 右ペイン */}
              {rightPanelVisible && (
                <Paper
                  elevation={2}
                  square
                  sx={{
                    width: isMobile ? 'calc(100% - 16px)' : 320,
                    position: isMobile ? 'fixed' : 'relative',
                    top: isMobile ? '50%' : '2px',
                    left: isMobile ? '50%' : 'auto',
                    right: isMobile ? 'auto' : '2px',
                    height: isMobile ? 'auto' : 'calc(100% - 4px)',
                    maxHeight: isMobile ? '70vh' : 'calc(100% - 4px)',
                    transform: isMobile ? 'translate(-50%, -50%)' : 'none',
                    zIndex: isMobile ? 1400 : 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    '&&': {
                      borderTopLeftRadius: isMobile ? 8 : 8,
                      borderTopRightRadius: isMobile ? 8 : 8,
                      borderBottomLeftRadius: isMobile ? 8 : 0,
                      borderBottomRightRadius: isMobile ? 8 : 0,
                    }
                  }}
                >
                    <Box
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        px: 2,
                        py: 0.5,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        minHeight: '40px',
                      }}
                    >
                      <Box component="h3" sx={{ m: 0, fontSize: '1rem', fontWeight: 600 }}>
                        物件詳細
                      </Box>
                      <Button
                        size="small"
                        onClick={() => setRightPanelVisible(false)}
                        sx={{
                          color: 'white',
                          minWidth: 'auto',
                          p: 0.5,
                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                        }}
                        title="物件詳細を閉じる"
                      >
                        ✕
                      </Button>
                    </Box>

                    <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
                      {selectedObject ? (
                        <Box>
                          {selectedObject.type === 'property' && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Box sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', mb: 0.5 }}>
                                  物件名
                                </Box>
                                <Box sx={{ fontSize: '1rem', color: 'text.primary' }}>
                                  {selectedObject.data.name}
                                </Box>
                              </Paper>

                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Box sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', mb: 0.5 }}>
                                  住所
                                </Box>
                                <Box sx={{ fontSize: '1rem', color: 'text.primary' }}>
                                  {selectedObject.data.address}
                                </Box>
                              </Paper>

                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Box sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', mb: 0.5 }}>
                                  建物種別
                                </Box>
                                <Box sx={{ fontSize: '1rem', color: 'text.primary' }}>
                                  {getBuildingTypeLabel(selectedObject.data.building_type)}
                                </Box>
                              </Paper>

                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                                  <Box sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', mb: 0.5 }}>
                                    総戸数
                                  </Box>
                                  <Box sx={{ fontSize: '1rem', color: 'text.primary' }}>
                                    {selectedObject.data.room_cnt || 0}戸
                                  </Box>
                                </Paper>

                                <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                                  <Box sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', mb: 0.5 }}>
                                    空室数
                                  </Box>
                                  <Box sx={{ fontSize: '1rem', color: 'text.primary' }}>
                                    {selectedObject.data.free_cnt || 0}戸
                                  </Box>
                                </Paper>
                              </Box>

                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Box sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', mb: 0.5 }}>
                                  空室率
                                </Box>
                                <Box sx={{ fontSize: '1rem', color: 'text.primary' }}>
                                  {selectedObject.data.room_cnt > 0
                                    ? ((selectedObject.data.free_cnt / selectedObject.data.room_cnt) * 100).toFixed(1)
                                    : '0.0'}%
                                </Box>
                              </Paper>

                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                                <Button
                                  variant="contained"
                                  fullWidth
                                  onClick={() => window.open(`/property/${selectedObject.data.id}`, '_blank')}
                                  sx={{
                                    minHeight: isMobile ? '48px' : 'auto',
                                    fontSize: isMobile ? '1rem' : '0.875rem'
                                  }}
                                >
                                  詳細ページを開く
                                </Button>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      ) : (
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 3,
                            textAlign: 'center',
                            color: 'text.secondary',
                            border: '2px dashed',
                            borderColor: 'grey.300',
                          }}
                        >
                          地図上の物件を選択してください
                        </Paper>
                      )}
                    </Box>
                  </Paper>
              )}
            </Box>

            {/* 下ペイン - 最大化時は非表示 */}
            {(!leftPanelPinned || isMdUp) && !propertyListMaximized && (
              <Collapse in={bottomPanelVisible}>
                <Paper
                  elevation={2}
                  sx={{
                    maxHeight: '40vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    zIndex: 1200,
                    position: 'relative',
                    marginLeft: leftPanelPinned ? '324px' : '0px',
                    marginRight: '1px',
                    transition: 'margin-left 0.3s ease',
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      px: 2,
                      py: 0.5,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      minHeight: '40px',
                    }}
                  >
                    <Box component="h3" sx={{ m: 0, fontSize: '1rem', fontWeight: 600 }}>
                      物件一覧
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="最大化" placement="top">
                        <IconButton
                          size="small"
                          onClick={handleTogglePropertyListMaximize}
                          sx={{
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }
                          }}
                        >
                          <FullscreenIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Button
                        size="small"
                        onClick={() => setBottomPanelVisible(false)}
                        sx={{ color: 'white', minWidth: 'auto', p: 0.5 }}
                        title="閉じる"
                      >
                        ✕
                      </Button>
                    </Box>
                  </Box>
                  <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <PropertyTable
                      properties={properties}
                      onPropertySelect={(property) => {
                        setSelectedObject({ type: 'property', data: property });
                        setRightPanelVisible(true);

                        // 地図マーカーをクリックした時と同じ動作をグローバル関数で実行
                        if (window.selectProperty && property.id) {
                          window.selectProperty(property.id);
                        }

                        // 左パネルのホバー状態を閉じる
                        if (!leftPanelPinned && leftPanelHovered) {
                          setLeftPanelForceClose(true);
                          setLeftPanelHovered(false);
                          setTimeout(() => setLeftPanelForceClose(false), 300);
                        }
                      }}
                      searchConditions={searchConditions}
                    />
                  </Box>
                </Paper>
              </Collapse>
            )}
          </Box>

          {/* 下ペイン表示ボタン（非表示時かつ非最大化時） */}
          {!bottomPanelVisible && !propertyListMaximized && (
            <Box
              sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '80px',
                pointerEvents: 'none', // 背景はクリック不可
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingLeft: isMobile ? '20px' : (leftPanelPinned || leftPanelHovered ? '320px' : '60px'),
                paddingRight: isMobile ? '20px' : '0px',
                transition: 'padding-left 0.3s ease',
                zIndex: 1000,
              }}
            >
              <Fade in={true}>
                <Button
                  variant="contained"
                  onClick={() => {
                    setBottomPanelVisible(true);
                    if (selectedObject) {
                      setRightPanelVisible(true);
                    }
                  }}
                  sx={{
                    pointerEvents: 'all', // ボタンのみクリック可能
                    borderRadius: '25px',
                    px: isMobile ? 2.5 : 3,
                    py: isMobile ? 1.5 : 1.5,
                    fontSize: isMobile ? '1rem' : '1rem',
                    minHeight: isMobile ? '44px' : 'auto',
                    maxWidth: isMobile ? '200px' : 'auto',
                  }}
                >
                  物件一覧を表示
                </Button>
              </Fade>
            </Box>
          )}

        </Box>

        {/* 物件新規登録モーダル */}
        <BuildingFormModal
          isOpen={buildingFormModalOpen}
          onClose={() => setBuildingFormModalOpen(false)}
          onSuccess={handleBuildingRegistered}
        />
      </Box>
    </ThemeProvider>
  );
}
